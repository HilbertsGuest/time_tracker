// IndexedDB wrapper for Time Tracker data persistence

const DB_NAME = 'TimeTrackerDB';
const DB_VERSION = 2; // Incremented to add program index
const TASKS_STORE = 'tasks';
const ARCHIVE_STORE = 'archivedWeeks';

class TimeTrackerDB {
  constructor() {
    this.db = null;
  }

  // Open database connection
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        // Create tasks object store
        if (!db.objectStoreNames.contains(TASKS_STORE)) {
          const tasksStore = db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
          tasksStore.createIndex('project', 'project', { unique: false });
          tasksStore.createIndex('start', 'start', { unique: false });
          tasksStore.createIndex('program', 'program', { unique: false });
          console.log('Tasks store created');
        } else if (oldVersion < 2) {
          // Add program index if upgrading from version 1
          const transaction = event.target.transaction;
          const tasksStore = transaction.objectStore(TASKS_STORE);
          if (!tasksStore.indexNames.contains('program')) {
            tasksStore.createIndex('program', 'program', { unique: false });
            console.log('Program index added to tasks store');
          }
        }

        // Create archived weeks object store
        if (!db.objectStoreNames.contains(ARCHIVE_STORE)) {
          const archiveStore = db.createObjectStore(ARCHIVE_STORE, { keyPath: 'id', autoIncrement: true });
          archiveStore.createIndex('kw', 'kw', { unique: false });
          archiveStore.createIndex('year', 'year', { unique: false });
          archiveStore.createIndex('program', 'program', { unique: false });
          console.log('Archive store created');
        } else if (oldVersion < 2) {
          // Add program index if upgrading from version 1
          const transaction = event.target.transaction;
          const archiveStore = transaction.objectStore(ARCHIVE_STORE);
          if (!archiveStore.indexNames.contains('program')) {
            archiveStore.createIndex('program', 'program', { unique: false });
            console.log('Program index added to archive store');
          }
        }
      };
    });
  }

  // Save all tasks to IndexedDB for a specific program
  async saveTasks(tasks, program) {
    if (!this.db) await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([TASKS_STORE], 'readwrite');
      const store = transaction.objectStore(TASKS_STORE);
      const programIndex = store.index('program');

      // Delete existing tasks for this program
      const deleteRequest = programIndex.openCursor(IDBKeyRange.only(program));
      const idsToDelete = [];

      deleteRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          idsToDelete.push(cursor.primaryKey);
          cursor.continue();
        } else {
          // Delete all found tasks for this program
          idsToDelete.forEach(id => store.delete(id));

          // Add all new tasks with program field
          if (tasks && tasks.length > 0) {
            tasks.forEach(task => {
              store.add({ ...task, program });
            });
          }
        }
      };

      transaction.oncomplete = () => {
        console.log(`Tasks saved successfully for ${program}:`, tasks ? tasks.length : 0);
        resolve();
      };

      transaction.onerror = () => {
        console.error('Error saving tasks:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // Load all tasks from IndexedDB for a specific program
  async loadTasks(program) {
    if (!this.db) await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([TASKS_STORE], 'readonly');
      const store = transaction.objectStore(TASKS_STORE);

      // Try to use program index if it exists
      if (store.indexNames.contains('program')) {
        const programIndex = store.index('program');
        const request = programIndex.getAll(program);

        request.onsuccess = () => {
          console.log(`Tasks loaded successfully for ${program}`);
          resolve(request.result);
        };

        request.onerror = () => {
          console.error('Error loading tasks');
          reject(request.error);
        };
      } else {
        // Fallback for old database version without program index
        const request = store.getAll();

        request.onsuccess = () => {
          // Filter by program or return all if no program field exists
          const tasks = request.result.filter(task => !task.program || task.program === program);
          console.log(`Tasks loaded successfully for ${program} (fallback)`);
          resolve(tasks);
        };

        request.onerror = () => {
          console.error('Error loading tasks');
          reject(request.error);
        };
      }
    });
  }

  // Save archived weeks to IndexedDB for a specific program
  async saveArchivedWeeks(archivedWeeks, program) {
    if (!this.db) await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([ARCHIVE_STORE], 'readwrite');
      const store = transaction.objectStore(ARCHIVE_STORE);
      const programIndex = store.index('program');

      // Delete existing archived weeks for this program
      const deleteRequest = programIndex.openCursor(IDBKeyRange.only(program));
      const idsToDelete = [];

      deleteRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          idsToDelete.push(cursor.primaryKey);
          cursor.continue();
        } else {
          // Delete all found weeks for this program
          idsToDelete.forEach(id => store.delete(id));

          // Add all archived weeks with program field
          if (archivedWeeks && archivedWeeks.length > 0) {
            archivedWeeks.forEach(week => {
              // Remove autoIncrement id if it exists to avoid conflicts
              const weekData = { ...week, program };
              if (weekData.id) delete weekData.id;
              store.add(weekData);
            });
          }
        }
      };

      transaction.oncomplete = () => {
        console.log(`Archived weeks saved successfully for ${program}:`, archivedWeeks ? archivedWeeks.length : 0);
        resolve();
      };

      transaction.onerror = () => {
        console.error('Error saving archived weeks');
        reject(transaction.error);
      };
    });
  }

  // Load archived weeks from IndexedDB for a specific program
  async loadArchivedWeeks(program) {
    if (!this.db) await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([ARCHIVE_STORE], 'readonly');
      const store = transaction.objectStore(ARCHIVE_STORE);

      // Try to use program index if it exists
      if (store.indexNames.contains('program')) {
        const programIndex = store.index('program');
        const request = programIndex.getAll(program);

        request.onsuccess = () => {
          console.log(`Archived weeks loaded successfully for ${program}`);
          resolve(request.result);
        };

        request.onerror = () => {
          console.error('Error loading archived weeks');
          reject(request.error);
        };
      } else {
        // Fallback for old database version without program index
        const request = store.getAll();

        request.onsuccess = () => {
          // Filter by program or return all if no program field exists
          const weeks = request.result.filter(week => !week.program || week.program === program);
          console.log(`Archived weeks loaded successfully for ${program} (fallback)`);
          resolve(weeks);
        };

        request.onerror = () => {
          console.error('Error loading archived weeks');
          reject(request.error);
        };
      }
    });
  }

  // Clear all data
  async clearAllData() {
    if (!this.db) await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([TASKS_STORE, ARCHIVE_STORE], 'readwrite');

      transaction.objectStore(TASKS_STORE).clear();
      transaction.objectStore(ARCHIVE_STORE).clear();

      transaction.oncomplete = () => {
        console.log('All data cleared');
        resolve();
      };

      transaction.onerror = () => {
        console.error('Error clearing data');
        reject(transaction.error);
      };
    });
  }
}

// Create singleton instance
const timeTrackerDB = new TimeTrackerDB();
