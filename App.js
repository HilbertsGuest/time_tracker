const { useState, useEffect, useRef } = React;

function App() {
    const [programs, setPrograms] = useState(null);
    const [activeProgram, setActiveProgram] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [archivedWeeks, setArchivedWeeks] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [viewMode, setViewMode] = useState('current');
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                setPrograms(data);
                const savedProgram = localStorage.getItem('activeProgram') || Object.keys(data)[0];
                setActiveProgram(savedProgram);
            });
    }, []);

    useEffect(() => {
        if (activeProgram) {
            // Load tasks from DB
            timeTrackerDB.loadTasks(activeProgram).then(loadedTasks => {
                setTasks(loadedTasks);
            });
            timeTrackerDB.loadArchivedWeeks(activeProgram).then(loadedArchivedWeeks => {
                setArchivedWeeks(loadedArchivedWeeks);
            });
        }
    }, [activeProgram]);

    useEffect(() => {
        if (programs && activeProgram) {
            renderChart();
        }
    }, [tasks, activeTab, programs, activeProgram]);
    
    useEffect(() => {
        if (tasks.length > 0) {
            timeTrackerDB.saveTasks(tasks, activeProgram);
        }
        if(archivedWeeks.length > 0) {
            timeTrackerDB.saveArchivedWeeks(archivedWeeks, activeProgram);
        }
    }, [tasks, archivedWeeks, activeProgram]);

    const getProjectData = (filterModule = null) => {
        let filteredTasks = tasks;

        if (filterModule && filterModule !== 'overview') {
            filteredTasks = tasks.filter(task => task.project === filterModule);
        }

        const projectTotals = {};
        filteredTasks.forEach(task => {
            if (!projectTotals[task.project]) {
                projectTotals[task.project] = 0;
            }
            projectTotals[task.project] += task.time;
        });

        const total = Object.values(projectTotals).reduce((sum, time) => sum + time, 0);
        const colors = Object.keys(projectTotals).map(proj => modules[proj]?.color || '#95a5a6');

        return {
            labels: Object.keys(projectTotals),
            datasets: [{
                data: Object.values(projectTotals),
                backgroundColor: colors,
                borderWidth: 0
            }],
            total: total
        };
    };
    
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        // Display only minutes if less than 1 hour
        if (hours === 0) {
            return `${minutes}m`;
        }
        return `${hours}h ${minutes}m`;
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };
    
    const getTotalHours = () => {
        let filteredTasks = tasks;
        if (activeTab !== 'overview' && activeTab !== 'week') {
            filteredTasks = tasks.filter(task => task.project === activeTab);
        }
        const total = filteredTasks.reduce((sum, task) => sum + task.time, 0);
        return formatTime(total);
    };

    const renderChart = () => {
        if (!chartRef.current) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const data = getProjectData(activeTab === 'overview' ? null : activeTab);
        const ctx = chartRef.current.getContext('2d');

        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '75%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const timeFormatted = formatTime(context.raw);
                                const percent = ((context.raw / data.total) * 100).toFixed(1);
                                return `${context.label}: ${timeFormatted} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    };

    const getWeeklyGoalProgress = (moduleName) => {
        const moduleGoal = modules[moduleName].goal * 3600;
        const moduleTasks = tasks.filter(task => task.project === moduleName);
        const totalTime = moduleTasks.reduce((sum, task) => sum + task.time, 0);
        const percentage = (totalTime / moduleGoal) * 100;
        return {
            current: totalTime,
            goal: moduleGoal,
            percentage: Math.min(percentage, 100)
        };
    };

    const getTotalWeeklyGoal = () => {
        const totalGoal = Object.values(modules).reduce((sum, mod) => sum + mod.goal, 0) * 3600;
        const totalTime = tasks.reduce((sum, task) => sum + task.time, 0);
        return {
            current: totalTime,
            goal: totalGoal,
            percentage: (totalTime / totalGoal) * 100
        };
    };

    const openModal = (task = null) => {
        if (task) {
            setEditingTask(task);
        } else {
            setEditingTask(null);
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTask(null);
    };

    const handleTaskSave = (task) => {
        if (editingTask) {
            setTasks(tasks.map(t => t.id === task.id ? task : t));
        } else {
            setTasks([...tasks, { ...task, id: Date.now() }]);
        }
    };

    const handleTaskDelete = (taskId) => {
        if (confirm('Are you sure you want to delete this task?')) {
            setTasks(tasks.filter(t => t.id !== taskId));
        }
    };

    const getWeekNumber = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    };

    const archiveCurrentWeek = () => {
        if (tasks.length === 0) {
            alert('No tasks to archive!');
            return;
        }

        const sortedTasks = [...tasks].sort((a, b) => new Date(a.start) - new Date(b.start));
        const oldestTask = sortedTasks[0];
        const oldestDate = new Date(oldestTask.start);

        const dayOfWeek = oldestDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(oldestDate);
        monday.setDate(oldestDate.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const weekTasks = tasks.filter(task => {
            const taskDate = new Date(task.start);
            return taskDate >= monday && taskDate <= sunday;
        });

        if (weekTasks.length === 0) {
            alert('No tasks found in the oldest week to archive!');
            return;
        }

        const totals = {};
        Object.keys(modules).forEach(mod => {
            const moduleTasks = weekTasks.filter(t => t.project === mod);
            const hours = moduleTasks.reduce((sum, t) => sum + t.time, 0) / 3600;
            totals[mod] = hours;
        });

        const totalHours = Object.values(totals).reduce((sum, h) => sum + h, 0);
        const kw = getWeekNumber(monday);

        const archivedWeek = {
            kw: kw,
            year: monday.getFullYear(),
            startDate: monday.toISOString().split('T')[0],
            endDate: sunday.toISOString().split('T')[0],
            tasks: weekTasks,
            totals: totals,
            totalHours: parseFloat(totalHours.toFixed(1))
        };

        setArchivedWeeks(prev => [...prev, archivedWeek]);

        const remainingTasks = tasks.filter(task => {
            const taskDate = new Date(task.start);
            return !(taskDate >= monday && taskDate <= sunday);
        });

        setTasks(remainingTasks);
    };
    
    const unarchiveWeek = (week) => {
        // Restore tasks to main task list
        const restoredTasks = week.tasks || [];
        setTasks(prev => [...prev, ...restoredTasks]);

        // Remove from archived weeks
        setArchivedWeeks(prev => prev.filter(w =>
            !(w.kw === week.kw && w.year === week.year)
        ));
    };

    const deleteArchivedWeek = (week) => {
        const confirmMessage = `Are you sure you want to permanently delete KW ${week.kw} (${week.year})?\n\nThis will delete ${week.tasks.length} task(s) and cannot be undone!`;

        if (confirm(confirmMessage)) {
            // Remove from archived weeks
            setArchivedWeeks(prev => prev.filter(w =>
                !(w.kw === week.kw && w.year === week.year)
            ));
        }
    };

    if (!programs || !activeProgram) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    const modules = programs[activeProgram].modules;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Time Tracker</h1>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 bg-gray-800 p-1 rounded-lg">
                            {Object.keys(programs).map(programName => (
                                <button
                                    key={programName}
                                    onClick={() => {
                                        setActiveProgram(programName);
                                        localStorage.setItem('activeProgram', programName);
                                    }}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeProgram === programName
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {programName}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <main>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
                            <h2 className="text-xl font-bold mb-4">Invested Time</h2>
                            <div className="border-b border-gray-700 mb-4">
                                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                            activeTab === 'overview'
                                                ? 'border-blue-500 text-blue-400'
                                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                        }`}
                                    >
                                        Overview
                                    </button>
                                    {Object.keys(modules).map(moduleName => (
                                        <button
                                            key={moduleName}
                                            onClick={() => setActiveTab(moduleName)}
                                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                                activeTab === moduleName
                                                    ? 'border-blue-500 text-blue-400'
                                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                            }`}
                                        >
                                            {moduleName}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            <div className="h-96 flex justify-center items-center">
                                <div className="relative w-80 h-80">
                                    <canvas ref={chartRef}></canvas>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-bold">{getTotalHours()}</span>
                                        <span className="text-sm text-gray-400">Total Hours</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <Timer modules={modules} onStop={handleTaskSave} />
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h2 className="text-xl font-bold mb-4">Weekly Goal</h2>
                                {activeTab === 'overview' ? (
                                    <div className="space-y-4">
                                        {Object.keys(modules).map(moduleName => {
                                            const progress = getWeeklyGoalProgress(moduleName);
                                            return (
                                                <div key={moduleName}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-medium text-gray-300">{moduleName}</span>
                                                        <span className="text-sm font-medium text-gray-400">{formatTime(progress.current)} / {modules[moduleName].goal}h</span>
                                                    </div>
                                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                                        <div
                                                            className="h-2.5 rounded-full"
                                                            style={{ width: `${progress.percentage}%`, backgroundColor: modules[moduleName].color }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div>
                                        {(() => {
                                            const progress = getWeeklyGoalProgress(activeTab);
                                            const moduleGoal = modules[activeTab].goal;
                                            return (
                                                <div className="text-center">
                                                    <div
                                                        className="inline-flex items-center justify-center rounded-full bg-gray-700 h-32 w-32"
                                                        style={{
                                                            background: `conic-gradient(${modules[activeTab].color} ${progress.percentage}%, #4a5568 0)`
                                                        }}
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-3xl font-bold">{progress.percentage.toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <div className="text-2xl font-bold">{formatTime(progress.current)}</div>
                                                        <div className="text-sm text-gray-400">of {moduleGoal}h weekly goal</div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Tasks</h2>
                            <div className="flex space-x-4">
                                <div className="flex items-center space-x-2 bg-gray-700 p-1 rounded-lg">
                                    <button
                                        onClick={() => setViewMode('current')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            viewMode === 'current'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        Current
                                    </button>
                                    <button
                                        onClick={() => setViewMode('archive')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            viewMode === 'archive'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        Archive
                                    </button>
                                </div>
                                <button
                                    onClick={() => openModal()}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                                >
                                    Add Task
                                </button>
                                {viewMode === 'current' && (
                                    <button
                                        onClick={archiveCurrentWeek}
                                        className="bg-yellow-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-600"
                                    >
                                        Archive Week
                                    </button>
                                )}
                            </div>
                        </div>

                        {viewMode === 'current' ? (
                            <div className="flow-root">
                                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                        <table className="min-w-full divide-y divide-gray-700">
                                            <thead>
                                                <tr>
                                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-0">Task</th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Module</th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Duration</th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Start Time</th>
                                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                                        <span className="sr-only">Edit</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {tasks.map((task) => (
                                                    <tr key={task.id}>
                                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0">{task.name}</td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{task.project}</td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{formatTime(task.time)}</td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{formatDateTime(task.start)}</td>
                                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                            <button onClick={() => openModal(task)} className="text-blue-400 hover:text-blue-300">Edit</button>
                                                            <button onClick={() => handleTaskDelete(task.id)} className="ml-4 text-red-400 hover:text-red-300">Delete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {archivedWeeks.map(week => (
                                    <div key={`${week.year}-${week.kw}`} className="bg-gray-700 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-lg">KW {week.kw} '{week.year.toString().slice(-2)}</h3>
                                            <div>
                                                <button onClick={() => unarchiveWeek(week)} className="text-blue-400 hover:text-blue-300">Unarchive</button>
                                                <button onClick={() => deleteArchivedWeek(week)} className="ml-4 text-red-400 hover:text-red-300">Delete</button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-400">{week.startDate} - {week.endDate}</p>
                                        <p className="text-lg font-bold mt-2">{week.totalHours.toFixed(1)} Hours</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {showModal && (
                    <TaskModal
                        task={editingTask}
                        modules={modules}
                        onClose={closeModal}
                        onSave={handleTaskSave}
                    />
                )}
            </div>
        </div>
    );
}

function TaskModal({ task, modules, onClose, onSave }) {
    const [name, setName] = useState(task ? task.name : '');
    const [project, setProject] = useState(task ? task.project : Object.keys(modules)[0]);
    const [start, setStart] = useState(task ? task.start : new Date().toISOString().slice(0, 16));
    const [end, setEnd] = useState(task ? task.end : '');

    const handleSubmit = (e) => {
        e.preventDefault();
        const startTime = new Date(start);
        const endTime = end ? new Date(end) : new Date();
        const timeInSeconds = Math.floor((endTime - startTime) / 1000);

        onSave({
            id: task ? task.id : Date.now(),
            name,
            project,
            start,
            end: end || endTime.toISOString().slice(0, 16),
            time: timeInSeconds
        });
        onClose();
    };

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                                {task ? 'Edit Task' : 'Add Task'}
                            </h3>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-300">Task Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="project" className="block text-sm font-medium text-gray-300">Module</label>
                                    <select
                                        id="project"
                                        name="project"
                                        value={project}
                                        onChange={(e) => setProject(e.target.value)}
                                        className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        {Object.keys(modules).map(moduleName => (
                                            <option key={moduleName} value={moduleName}>{moduleName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="start" className="block text-sm font-medium text-gray-300">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        name="start"
                                        id="start"
                                        value={start}
                                        onChange={(e) => setStart(e.target.value)}
                                        className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="end" className="block text-sm font-medium text-gray-300">End Time (optional)</label>
                                    <input
                                        type="datetime-local"
                                        name="end"
                                        id="end"
                                        value={end}
                                        onChange={(e) => setEnd(e.target.value)}
                                        className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
