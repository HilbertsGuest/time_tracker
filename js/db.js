// IndexedDB wrapper for Time Tracker data persistence

const DB_NAME = 'TimeTrackerDB';
const DB_VERSION = 1;
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

        // Create tasks object store
        if (!db.objectStoreNames.contains(TASKS_STORE)) {
          const tasksStore = db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
          tasksStore.createIndex('project', 'project', { unique: false });
          tasksStore.createIndex('start', 'start', { unique: false });
          console.log('Tasks store created');
        }

        // Create archived weeks object store
        if (!db.objectStoreNames.contains(ARCHIVE_STORE)) {
          const archiveStore = db.createObjectStore(ARCHIVE_STORE, { keyPath: 'id', autoIncrement: true });
          archiveStore.createIndex('kw', 'kw', { unique: false });
          archiveStore.createIndex('year', 'year', { unique: false });
          console.log('Archive store created');
        }
      };
    });
  }

  // Save all tasks to IndexedDB
  async saveTasks(tasks) {
    if (!this.db) await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([TASKS_STORE], 'readwrite');
      const store = transaction.objectStore(TASKS_STORE);

      // Clear existing tasks first
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        // Add all new tasks (if any)
        if (tasks && tasks.length > 0) {
          tasks.forEach(task => {
            store.add(task);
          });
        }
      };

      transaction.oncomplete = () => {
        console.log('Tasks saved successfully:', tasks ? tasks.length : 0);
        resolve();
      };

      transaction.onerror = () => {
        console.error('Error saving tasks:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // Load all tasks from IndexedDB
  async loadTasks() {
    if (!this.db) await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([TASKS_STORE], 'readonly');
      const store = transaction.objectStore(TASKS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('Tasks loaded successfully');
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error loading tasks');
        reject(request.error);
      };
    });
  }

  // Save archived weeks to IndexedDB
  async saveArchivedWeeks(archivedWeeks) {
    if (!this.db) await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([ARCHIVE_STORE], 'readwrite');
      const store = transaction.objectStore(ARCHIVE_STORE);

      // Clear existing archives first
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        // Add all archived weeks (if any)
        if (archivedWeeks && archivedWeeks.length > 0) {
          archivedWeeks.forEach(week => {
            // Remove autoIncrement id if it exists to avoid conflicts
            const weekData = { ...week };
            if (weekData.id) delete weekData.id;
            store.add(weekData);
          });
        }
      };

      transaction.oncomplete = () => {
        console.log('Archived weeks saved successfully:', archivedWeeks.length);
        resolve();
      };

      transaction.onerror = () => {
        console.error('Error saving archived weeks');
        reject(transaction.error);
      };
    });
  }

  // Load archived weeks from IndexedDB
  async loadArchivedWeeks() {
    if (!this.db) await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([ARCHIVE_STORE], 'readonly');
      const store = transaction.objectStore(ARCHIVE_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('Archived weeks loaded successfully');
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error loading archived weeks');
        reject(request.error);
      };
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
