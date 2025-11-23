import { DataStore } from './data.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key Placeholder
const GEMINI_API_KEY = 'Your_API_Key';

const app = {
    user: null,
    db: null,
    genAI: null,
    model: null,
    currentView: 'home',
    timerInterval: null,
    timeLeft: 25 * 60,
    isTimerRunning: false,
    currentChatId: null, 

    init: async function () {
        this.checkAuth();
        // DataStore Initialization with User ID
        this.db = new DataStore(this.user.id);
        await this.db.init();

        // Check for first-time login
        if (this.user.isFirstLogin) {
            this.showChangePasswordModal();
        }

        // Initialize Gemini with auto-detection
        await this.initGemini();

        this.setupNavigation();
        this.renderSidebar();

        this.loadView('home');
        this.updateUserInfo();
        this.updateDate();
    },

    showChangePasswordModal: function () {
        const modalContainer = document.getElementById('modalContainer');
        modalContainer.innerHTML = `
            <div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;">
                <div class="modal-content" style="background: #1a1a2e; padding: 30px; border-radius: 15px; width: 90%; max-width: 400px; border: 1px solid rgba(255,255,255,0.1);">
                    <h3 style="margin-bottom: 15px;">Change Default Password</h3>
                    <p style="color: #ccc; margin-bottom: 20px; font-size: 0.9rem;">For security, please update your password from the default "123456789".</p>
                    
                    <input type="password" id="newPassword" placeholder="New Password" style="width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;">
                    <input type="password" id="confirmPassword" placeholder="Confirm Password" style="width: 100%; padding: 12px; margin-bottom: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;">
                    
                    <button id="savePasswordBtn" class="cta-btn" style="width: 100%;">Update Password</button>
                </div>
            </div>
        `;

        document.getElementById('savePasswordBtn').addEventListener('click', async () => {
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;

            if (newPass.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }
            if (newPass !== confirmPass) {
                alert("Passwords do not match.");
                return;
            }

            // Password Update in Database
            try {
                await this.db.updateUserPassword(newPass);

                // Update local user object
                this.user.isFirstLogin = false;
                delete this.user.password; 
                localStorage.setItem('edwise_user', JSON.stringify(this.user));

                modalContainer.innerHTML = ''; 
                alert("Password updated successfully!");
            } catch (e) {
                console.error("Error updating password:", e);
                alert("Failed to update password.");
            }
        });
    },

    initGemini: async function () {
        // Use hardcoded API key
        if (GEMINI_API_KEY && GEMINI_API_KEY !== '' && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
            try {
                this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                console.log(`✅ Gemini initialized with model: gemini-1.5-flash`);
                return;
            } catch (e) {
                console.error("Error initializing Gemini:", e);
            }
        }

        // Fallback to localStorage key
        let key = localStorage.getItem('edwise_gemini_key');
        if (key && key !== 'null') {
            try {
                this.genAI = new GoogleGenerativeAI(key);
                this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                console.log(`✅ Gemini initialized with localStorage key`);
                return;
            } catch (e) {
                console.error("Error initializing Gemini with localStorage key:", e);
            }
        } else {
            console.log("Gemini API Key not found. Features will prompt for it.");
        }
    },

    getGeminiKey: function () {
        let key = localStorage.getItem('edwise_gemini_key');
        if (!key) {
            key = prompt("Please enter your Gemini API Key to use AI features:");
            if (key) {
                localStorage.setItem('edwise_gemini_key', key);
                this.initGemini();
                return key;
            }
        }
        return key;
    },

    checkAuth: function () {
        const userStr = localStorage.getItem('edwise_user');
        if (!userStr) {
            window.location.href = 'index.html';
        }
        this.user = JSON.parse(userStr);
    },

    updateUserInfo: async function () {
        document.getElementById('userName').textContent = this.user.name;
        document.getElementById('userRole').textContent = this.user.role;

        // Fetch fresh stats 
        const data = await this.db.getData();
        if (data.stats) {
            document.getElementById('userPoints').textContent = data.stats.points;
            this.user.stats = data.stats; 
        }
    },

    updateDate: function () {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);
    },

    renderSidebar: function () {
        const nav = document.querySelector('.nav-menu');
        let items = [];

        if (this.user.role === 'student') {
            items = [
                { id: 'home', icon: 'fa-house', label: 'Dashboard' },
                { id: 'tasks', icon: 'fa-list-check', label: 'To-Do List' },
                { id: 'timetable', icon: 'fa-calendar-days', label: 'Timetable' },
                { id: 'focus', icon: 'fa-clock', label: 'Focus Mode' },
                { id: 'chat', icon: 'fa-robot', label: 'AI Tutor' },
                { id: 'askteacher', icon: 'fa-chalkboard-user', label: 'Ask Teacher' },
                { id: 'leaderboard', icon: 'fa-trophy', label: 'Leaderboard' },
                { id: 'weekend', icon: 'fa-umbrella-beach', label: 'Weekend Fun' }
            ];
        } else if (this.user.role === 'teacher') {
            items = [
                { id: 'home', icon: 'fa-house', label: 'Dashboard' },
                { id: 'qna', icon: 'fa-question', label: 'QnA Manager' },
                { id: 'students', icon: 'fa-users', label: 'Student Tracking' },
                { id: 'timetable', icon: 'fa-calendar-days', label: 'Timetable' }
            ];
        } else if (this.user.role === 'parent') {
            items = [
                { id: 'home', icon: 'fa-house', label: 'Overview' },
                { id: 'progress', icon: 'fa-chart-line', label: 'Child Progress' },
                { id: 'controls', icon: 'fa-lock', label: 'Parental Controls' }
            ];
        }

        nav.innerHTML = items.map(item => `
            <a href="#" class="nav-item ${item.id === 'home' ? 'active' : ''}" data-view="${item.id}">
                <i class="fa-solid ${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `).join('');

        // Re-attach listeners
        this.setupNavigation();
    },

    setupNavigation: function () {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.loadView(item.dataset.view);
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('edwise_user');
            window.location.href = 'index.html';
        });
    },

    loadView: async function (viewId) {
        const content = document.getElementById('contentArea');
        const title = document.getElementById('pageTitle');
        this.currentView = viewId;

        // Stop any running timers if leaving focus mode
        if (viewId !== 'focus' && this.timerInterval) {
            clearInterval(this.timerInterval);
            this.isTimerRunning = false;
        }

        // Show loading state
        content.innerHTML = '<div style="text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        switch (viewId) {
            case 'home':
                title.textContent = 'Dashboard';
                await this.renderHome(content);
                break;
            case 'tasks':
                title.textContent = 'My Tasks';
                await this.renderTasks(content);
                break;
            case 'focus':
                title.textContent = 'Focus Session';
                this.renderFocus(content);
                break;
            case 'chat':
                title.textContent = 'AI Tutor';
                await this.renderChatWithSessions(content);
                break;
            case 'askteacher':
                title.textContent = 'Ask Teacher';
                await this.renderAskTeacher(content);
                break;
            case 'leaderboard':
                title.textContent = 'Class Leaderboard';
                await this.renderLeaderboard(content);
                break;
            default:
                content.innerHTML = `<div class="card"><h3>Coming Soon</h3><p>The ${viewId} module is under construction.</p></div>`;
        }
    },

    renderHome: async function (container) {
        // Optimistic rendering
        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="card stat-card">
                    <div class="stat-icon blue"><i class="fa-solid fa-list-check"></i></div>
                    <div class="stat-info">
                        <h2 id="stat-pending">...</h2>
                        <p>Pending Tasks</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon purple"><i class="fa-solid fa-fire"></i></div>
                    <div class="stat-info">
                        <h2 id="stat-streak">...</h2>
                        <p>Day Streak</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon green"><i class="fa-solid fa-star"></i></div>
                    <div class="stat-info">
                        <h2 id="stat-xp">...</h2>
                        <p>Total XP</p>
                    </div>
                </div>

                <div class="card" style="grid-column: span 2;">
                    <div class="card-header">
                        <h3>Today's Priorities</h3>
                    </div>
                    <div class="task-list-preview" id="home-task-list">
                        <p style="color: var(--text-muted);">Loading tasks...</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>AI Suggestion</h3>
                    </div>
                    <p style="color: var(--text-muted); line-height: 1.6;">
                        Based on your schedule, you have a Math test coming up on Friday. 
                        I recommend starting with the "Calculus" homework today to avoid last-minute stress.
                    </p>
                    <button class="cta-btn" id="createStudyPlanBtn" style="margin-top: 15px; font-size: 0.9rem; padding: 10px;">Create Study Plan</button>
                </div>
            </div>
        `;

        document.getElementById('createStudyPlanBtn').addEventListener('click', () => this.generateStudyPlan());

        // Fetch data in background
        try {
            const tasks = await this.db.getTasks();
            const pendingTasks = tasks.filter(t => !t.completed).length;
            const userData = await this.db.getData();

            document.getElementById('stat-pending').textContent = pendingTasks;
            document.getElementById('stat-streak').textContent = userData.stats ? userData.stats.streak : 0;
            document.getElementById('stat-xp').textContent = userData.stats ? userData.stats.points : 0;

            const taskListEl = document.getElementById('home-task-list');
            if (tasks.length > 0) {
                taskListEl.innerHTML = tasks.slice(0, 3).map(task => `
                    <div class="task-item">
                        <div class="task-check ${task.completed ? 'checked' : ''}" style="background:${task.completed ? 'var(--primary)' : 'transparent'}"></div>
                        <div class="task-content">
                            <p>${task.title}</p>
                            <span class="task-meta">${task.subject} • ${task.dueDate}</span>
                        </div>
                        <span class="priority-dot priority-${task.priority}"></span>
                    </div>
                `).join('');
            } else {
                taskListEl.innerHTML = '<p style="color: var(--text-muted);">No tasks for today!</p>';
            }
        } catch (e) {
            console.error("Error loading home data:", e);
        }
    },

    generateStudyPlan: async function () {
        if (!this.getGeminiKey()) return;
        if (!this.model) this.initGemini();

        const btn = document.getElementById('createStudyPlanBtn');
        const originalText = btn.textContent;
        btn.textContent = "Generating Plan...";
        btn.disabled = true;

        try {
            const tasks = await this.db.getTasks();
            const taskList = tasks.map(t => `${t.title} (Due: ${t.dueDate}, Priority: ${t.priority})`).join(', ');

            const prompt = `I am a student with the following tasks: ${taskList}. Please create a brief, 3-bullet point study plan for today to help me manage this workload efficiently. Keep it encouraging.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            alert("Here is your AI Study Plan:\n\n" + text);
        } catch (error) {
            console.error("Error generating plan:", error);
            alert("Failed to generate study plan. Please check your API key and try again.");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    },

    // --- To-Do List ---
    renderTasks: async function (container) {
        const tasks = await this.db.getTasks();
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>My To-Do List</h3>
                </div>
                
                <div class="add-task-form" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--glass-border);">
                    <input type="text" id="newTaskTitle" placeholder="Task Title" style="width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); color: white; outline: none;">
                    <textarea id="newTaskDesc" placeholder="Add a description (optional)..." style="width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); color: white; outline: none; resize: vertical; min-height: 60px; font-family: inherit;"></textarea>
                    <div style="display: flex; justify-content: flex-end;">
                        <button class="cta-btn" id="addTaskBtn" style="width: auto; padding: 10px 25px;">Add Task <i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>

                <div id="fullTaskList">
                    ${tasks.length === 0 ? '<p style="text-align:center; color:var(--text-muted);">No tasks yet. Add one above!</p>' : ''}
                    ${tasks.sort((a, b) => b.id - a.id).map(task => `
                        <div class="task-item" style="align-items: flex-start;">
                            <div class="task-check" data-id="${task.id}" style="margin-top: 5px;">
                                ${task.completed ? '<i class="fa-solid fa-check" style="color:white; font-size:12px;"></i>' : ''}
                            </div>
                            <div class="task-content" style="${task.completed ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
                                <p style="font-weight: 600; font-size: 1rem; margin-bottom: 4px;">${task.title}</p>
                                ${task.description ? `<p style="font-size: 0.9rem; color: #ccc; margin-bottom: 8px; line-height: 1.4;">${task.description}</p>` : ''}
                                <span class="task-meta">${task.subject} • ${task.dueDate}</span>
                            </div>
                            <button class="icon-btn delete-task-btn" data-id="${task.id}" style="width: 30px; height: 30px; color: #ff4757; margin-top: 5px;"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Event Listeners
        document.getElementById('addTaskBtn').addEventListener('click', () => this.handleAddTask());
        document.getElementById('newTaskTitle').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('newTaskDesc').focus();
            }
        });

        document.querySelectorAll('.task-check').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.toggleTask(id);
            });
        });

        document.querySelectorAll('.delete-task-btn').forEach(el => {
            el.addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                if (confirm('Are you sure you want to delete this task?')) {
                    await this.db.deleteTask(id);
                    this.renderTasks(document.getElementById('contentArea'));
                }
            });
        });
    },

    handleAddTask: async function () {
        const titleInput = document.getElementById('newTaskTitle');
        const descInput = document.getElementById('newTaskDesc');
        const title = titleInput.value.trim();
        const description = descInput.value.trim();

        if (!title) return;

        const btn = document.getElementById('addTaskBtn');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            await this.db.addTask({
                title: title,
                description: description,
                subject: "General",
                dueDate: new Date().toISOString().split('T')[0],
                priority: "medium",
                completed: false
            });
            await this.renderTasks(document.getElementById('contentArea'));
        } catch (error) {
            console.error("Error adding task:", error);
            alert("Failed to add task. Please try again.");
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    },

    toggleTask: async function (id) {
        await this.db.toggleTask(id);
        await this.db.updateUserStats(10, 1);
        this.updateUserInfo();
        this.renderTasks(document.getElementById('contentArea'));
    },

    // ---  Pomodoro  ---
    pomodoro: {
        state: 'IDLE', 
        timeLeft: 25 * 60,
        interval: null,
        sequence: [
            { state: 'FOCUS_1', duration: 25, label: 'Focus Session 1', msg: 'Focus Mode Started. 25 minutes.' },
            { state: 'BREAK_1', duration: 5, label: 'Short Break', msg: 'Time for a 5 minute break.' },
            { state: 'FOCUS_2', duration: 25, label: 'Focus Session 2', msg: 'Back to Focus. 25 minutes.' },
            { state: 'BREAK_2', duration: 10, label: 'Long Break', msg: 'Great job! Take a 10 minute break.' }
        ],
        currentIndex: 0
    },

    renderFocus: function (container) {
        const currentStage = this.pomodoro.sequence[this.pomodoro.currentIndex];

        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 50px;">
                <div style="margin-bottom: 20px;">
                    <span style="background: rgba(255,255,255,0.1); padding: 5px 15px; border-radius: 20px; font-size: 0.9rem;">
                        ${this.pomodoro.state === 'IDLE' ? 'Ready to Start' : currentStage.label}
                    </span>
                </div>
                
                <h3 id="focusStatus">${this.pomodoro.state === 'IDLE' ? 'Pomodoro Cycle' : 'Stay Focused'}</h3>
                
                <div class="timer-display" id="timerDisplay">
                    ${this.formatTime(this.pomodoro.timeLeft)}
                </div>
                
                <div class="timer-controls">
                    <button class="control-btn btn-primary" id="startTimerBtn">
                        ${this.pomodoro.interval ? 'Pause' : 'Start Cycle'}
                    </button>
                    <button class="control-btn btn-secondary" id="resetTimerBtn">Reset</button>
                </div>

                <div style="margin-top: 30px; display: flex; justify-content: center; gap: 10px;">
                    ${this.pomodoro.sequence.map((step, idx) => `
                        <div style="width: 10px; height: 10px; border-radius: 50%; 
                            background: ${idx === this.pomodoro.currentIndex ? 'var(--primary)' : 'rgba(255,255,255,0.2)'};
                            box-shadow: ${idx === this.pomodoro.currentIndex ? '0 0 10px var(--primary)' : 'none'};">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('startTimerBtn').addEventListener('click', () => this.togglePomodoro());
        document.getElementById('resetTimerBtn').addEventListener('click', () => this.resetPomodoro());
    },

    togglePomodoro: function () {
        const btn = document.getElementById('startTimerBtn');

        if (this.pomodoro.interval) {
            // Pause
            clearInterval(this.pomodoro.interval);
            this.pomodoro.interval = null;
            btn.textContent = "Resume";
        } else {
            // Start
            if (this.pomodoro.state === 'IDLE') {
                this.startStage(0);
            } else {
                this.runTimer();
            }
            btn.textContent = "Pause";
        }
    },

    startStage: function (index) {
        this.pomodoro.currentIndex = index;
        const stage = this.pomodoro.sequence[index];
        this.pomodoro.state = stage.state;
        this.pomodoro.timeLeft = stage.duration * 60;

        this.renderFocus(document.getElementById('contentArea'));

        this.speak(stage.msg);

        this.runTimer();
    },

    runTimer: function () {
        this.pomodoro.interval = setInterval(() => {
            this.pomodoro.timeLeft--;
            this.updateTimerDisplay();

            // 5 Minute Warning
            if (this.pomodoro.timeLeft === 5 * 60) {
                this.speak("5 minutes remaining.");
            }

            // Stage Complete
            if (this.pomodoro.timeLeft <= 0) {
                clearInterval(this.pomodoro.interval);
                this.pomodoro.interval = null;

                // next stage
                const nextIndex = this.pomodoro.currentIndex + 1;
                if (nextIndex < this.pomodoro.sequence.length) {
                    this.startStage(nextIndex);
                } else {
                    this.speak("Pomodoro cycle complete. Well done!");
                    alert("Cycle Complete!");
                    this.resetPomodoro();
                }
            }
        }, 1000);
    },

    resetPomodoro: function () {
        clearInterval(this.pomodoro.interval);
        this.pomodoro.interval = null;
        this.pomodoro.state = 'IDLE';
        this.pomodoro.currentIndex = 0;
        this.pomodoro.timeLeft = 25 * 60;
        this.renderFocus(document.getElementById('contentArea'));
    },

    updateTimerDisplay: function () {
        const display = document.getElementById('timerDisplay');
        if (display) display.textContent = this.formatTime(this.pomodoro.timeLeft);
    },

    formatTime: function (seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    speak: function (text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    },

    renderChat: async function (container) {
        const history = await this.db.getChatHistory();
        container.innerHTML = `
            <div class="chat-container" style="height: calc(100vh - 180px); display: flex; flex-direction: column;">
                <div class="chat-header" style="padding: 10px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="clearChatBtn" class="control-btn btn-secondary" style="font-size: 0.8rem; padding: 5px 10px;">Clear Chat <i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="chat-messages" id="chatMessages" style="flex-grow: 1; overflow-y: auto;">
                    ${history.map(msg => `
                        <div class="message ${msg.sender}">
                            ${msg.text}
                        </div>
                    `).join('')}
                </div>
                <div class="chat-input-area">
                    <label for="fileInput" class="icon-btn" style="cursor: pointer; margin-right: 10px;">
                        <i class="fa-solid fa-paperclip"></i>
                    </label>
                    <input type="file" id="fileInput" style="display: none;">
                    <input type="text" id="chatInput" placeholder="Ask a question or upload a file...">
                    <button class="send-btn" id="sendChatBtn"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
        `;

        document.getElementById('sendChatBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        document.getElementById('clearChatBtn').addEventListener('click', async () => {
            if (confirm("Are you sure you want to clear the chat history?")) {
                await this.db.clearChatHistory();
                this.renderChat(container);
            }
        });
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));

        this.scrollToBottom();
    },

    handleFileUpload: async function (e) {
        const file = e.target.files[0];
        if (!file) return;


        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.js') || file.name.endsWith('.html')) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const content = event.target.result;
                const input = document.getElementById('chatInput');
                input.value = `[File: ${file.name}] \n\n${content.substring(0, 1000)}${content.length > 1000 ? '... (truncated)' : ''}`;
                input.focus();
            };
            reader.readAsText(file);
        } else {
            alert(`File "${file.name}" selected. (Note: Only text file content is automatically read in this demo version).`);
            const input = document.getElementById('chatInput');
            input.value = `[Attached File: ${file.name}] `;
            input.focus();
        }
    },

    // ChatBot
    sendMessage: async function () {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        // Add User Message
        await this.db.addChatMessage({ sender: 'user', text: text });
        input.value = ''; 
        this.renderChat(document.getElementById('contentArea'));

        //  AI Response
        try {
            const response = await this.getAIResponse(text);
            await this.db.addChatMessage({ sender: 'bot', text: response });
            this.renderChat(document.getElementById('contentArea'));
        } catch (error) {
            console.error("Error getting AI response:", error);
            await this.db.addChatMessage({ sender: 'bot', text: "Sorry, I'm having trouble connecting to my brain right now. Error: " + error.message });
            this.renderChat(document.getElementById('contentArea'));
        }
    },

    getAIResponse: async function (text) {
        if (!this.model) {
            await this.initGemini();
            if (!this.model) {
                return this.getDemoResponse(text);
            }
        }

        try {
            const result = await this.model.generateContent(text);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini API Error:", error);

            // Fall back to demo mode on any error
            console.log("API error. Using demo mode.");
            return this.getDemoResponse(text);
        }
    },

    getDemoResponse: function (text) {
        // Demo mode responses for testing
        const lowerText = text.toLowerCase();

        if (lowerText.includes('hello') || lowerText.includes('hi')) {
            return " Hello! I'm your AI Study Assistant. I'm currently running in demo mode. How can I help you with your studies today?";
        } else if (lowerText.includes('math') || lowerText.includes('calculate')) {
            return " I can help with math! For example:\n• Algebra: Solving equations\n• Geometry: Area, perimeter calculations\n• Calculus: Derivatives and integrals\n\nWhat specific math topic do you need help with?";
        } else if (lowerText.includes('physics')) {
            return "Physics is fascinating! I can help with:\n• Mechanics (force, motion, energy)\n• Electricity and magnetism\n• Thermodynamics\n• Optics\n\nWhat physics concept are you studying?";
        } else if (lowerText.includes('chemistry')) {
            return " Chemistry help available! Topics include:\n• Atomic structure\n• Chemical reactions\n• Stoichiometry\n• Organic chemistry\n\nWhat do you need help with?";
        } else if (lowerText.includes('help') || lowerText.includes('study')) {
            return " I'm here to help you study! I can:\n✓ Explain difficult concepts\n✓ Help with homework\n✓ Create study plans\n✓ Answer questions on various subjects\n\nJust ask me anything!";
        } else if (lowerText.includes('explain')) {
            return " I'd be happy to explain! Please provide more details about the topic you'd like me to explain, and I'll break it down into simple, easy-to-understand terms.";
        } else {
            return ` I understand you're asking about: "${text}"\n\nI'm currently in demo mode. In full mode with a valid API key, I would provide detailed, intelligent responses to help with your studies.\n\nFor now, try asking about:\n• Math problems\n• Physics concepts\n• Chemistry questions\n• Study tips\n\nHow can I assist you?`;
        }
    },

    scrollToBottom: function () {
        const chat = document.getElementById('chatMessages');
        if (chat) chat.scrollTop = chat.scrollHeight;
    },

    // ===== CHAT SESSIONS =====
    renderChatWithSessions: async function (container) {
        //  current session
        if (!this.currentChatId) {
            const sessions = await this.db.getChatSessions();
            if (sessions.length === 0) {
                // Create first session
                this.currentChatId = await this.db.createChatSession("New Chat");
            } else {
                // Chat History
                this.currentChatId = sessions[sessions.length - 1].id;
            }
        }

        const sessions = await this.db.getChatSessions();
        const currentSession = sessions.find(s => s.id === this.currentChatId);
        const messages = currentSession ? currentSession.messages : [];

        container.innerHTML = `
            <div style="display: flex; gap: 15px; height: calc(100vh - 180px);">
                <!-- Chat Sessions Sidebar -->
                <div class="card" style="width: 250px; padding: 15px; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; font-size: 0.9rem;">Conversations</h4>
                        <button id="newChatBtn" class="control-btn" style="font-size: 0.8rem; padding: 5px 10px;">
                            <i class="fa-solid fa-plus"></i> New
                        </button>
                    </div>
                    <div id="chatSessionsList" style="display: flex; flex-direction: column; gap: 8px;">
                        ${sessions.map(session => `
                            <div class="chat-session-item ${session.id === this.currentChatId ? 'active' : ''}" 
                                 data-session-id="${session.id}"
                                 style="padding: 10px; border-radius: 8px; cursor: pointer; background: ${session.id === this.currentChatId ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${session.id === this.currentChatId ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; transition: all 0.2s;">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1; overflow: hidden;">
                                        <div style="font-size: 0.85rem; font-weight: 500; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${session.title}</div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date(session.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <button class="delete-session-btn" data-session-id="${session.id}" style="background: none; border: none; color: #ff4444; cursor: pointer; padding: 2px 5px; opacity: 0.7; transition: opacity 0.2s;">
                                        <i class="fa-solid fa-trash" style="font-size: 0.7rem;"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Chat Area -->
                <div class="card" style="flex: 1; display: flex; flex-direction: column; padding: 0;">
                    <div class="chat-header" style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0;">${currentSession ? currentSession.title : 'Chat'}</h4>
                        <div style="display: flex; gap: 10px;">
                            <button id="renameChatBtn" class="control-btn btn-secondary" style="font-size: 0.8rem; padding: 5px 10px;">
                                <i class="fa-solid fa-pen"></i> Rename
                            </button>
                            <button id="clearChatBtn" class="control-btn btn-secondary" style="font-size: 0.8rem; padding: 5px 10px;">
                                <i class="fa-solid fa-trash"></i> Clear
                            </button>
                        </div>
                    </div>
                    
                    <div id="chatMessages" style="flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px;">
                        ${messages.map(msg => `
                            <div class="message ${msg.sender}" style="display: flex; gap: 10px; ${msg.sender === 'user' ? 'justify-content: flex-end;' : ''}">
                                ${msg.sender === 'bot' ? '<div class="bot-avatar" style="width: 35px; height: 35px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i class="fa-solid fa-robot"></i></div>' : ''}
                                <div class="message-bubble" style="max-width: 70%; padding: 12px 16px; border-radius: 12px; background: ${msg.sender === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${msg.sender === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.1)'};">
                                    <p style="margin: 0; line-height: 1.5; white-space: pre-wrap;">${msg.text}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="chat-input-area" style="padding: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="file" id="fileInput" style="display: none;">
                            <button id="attachFileBtn" class="control-btn btn-secondary" style="padding: 10px;">
                                <i class="fa-solid fa-paperclip"></i>
                            </button>
                            <input type="text" id="chatInput" placeholder="Ask me anything..." style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; outline: none;">
                            <button id="sendBtn" class="cta-btn" style="padding: 10px 20px;">
                                <i class="fa-solid fa-paper-plane"></i> Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Event Listeners
        document.getElementById('newChatBtn').addEventListener('click', async () => {
            const title = prompt("Enter chat title:", "New Chat");
            if (title) {
                this.currentChatId = await this.db.createChatSession(title);
                await this.renderChatWithSessions(container);
                await this.updateUserInfo();
            }
        });

        document.querySelectorAll('.chat-session-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (!e.target.closest('.delete-session-btn')) {
                    this.currentChatId = item.dataset.sessionId;
                    await this.renderChatWithSessions(container);
                }
            });
        });

        document.querySelectorAll('.delete-session-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm("Delete this conversation?")) {
                    const sessionId = btn.dataset.sessionId;
                    await this.db.deleteChatSession(sessionId);
                    if (this.currentChatId === sessionId) {
                        this.currentChatId = null;
                    }
                    await this.renderChatWithSessions(container);
                }
            });
        });

        document.getElementById('renameChatBtn').addEventListener('click', async () => {
            const newTitle = prompt("Enter new title:", currentSession.title);
            if (newTitle) {
                await this.db.renameChatSession(this.currentChatId, newTitle);
                await this.renderChatWithSessions(container);
            }
        });

        document.getElementById('clearChatBtn').addEventListener('click', async () => {
            if (confirm("Clear all messages in this chat?")) {
                await this.db.deleteChatSession(this.currentChatId);
                this.currentChatId = await this.db.createChatSession(currentSession.title);
                await this.renderChatWithSessions(container);
            }
        });

        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessageToSession());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessageToSession();
        });
        document.getElementById('attachFileBtn').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));

        this.scrollToBottom();
    },

    sendMessageToSession: async function () {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        const container = document.getElementById('contentArea');

        // Add User Message
        await this.db.addMessageToSession(this.currentChatId, { sender: 'user', text: text });
        input.value = '';
        await this.renderChatWithSessions(container);

        // AI Response
        try {
            const response = await this.getAIResponse(text);
            await this.db.addMessageToSession(this.currentChatId, { sender: 'bot', text: response });
            await this.renderChatWithSessions(container);
        } catch (error) {
            console.error("Error getting AI response:", error);
            await this.db.addMessageToSession(this.currentChatId, { sender: 'bot', text: "Sorry, I'm having trouble connecting. Error: " + error.message });
            await this.renderChatWithSessions(container);
        }
    },

    // ===== ASK TEACHER =====
    renderAskTeacher: async function (container) {
        const questions = await this.db.getTeacherQuestions();

        container.innerHTML = `
            <div style="display: grid; gap: 20px;">
                <!-- Ask Question Form -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-chalkboard-user"></i> Ask Your Teacher</h3>
                    </div>
                    <div style="padding: 20px;">
                        <div style="display: grid; gap: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; color: var(--text-muted);">Teacher Name</label>
                                <input type="text" id="teacherName" placeholder="e.g., Mr. Smith" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; outline: none;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; color: var(--text-muted);">Subject</label>
                                <select id="subjectSelect" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; outline: none;">
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Physics">Physics</option>
                                    <option value="Chemistry">Chemistry</option>
                                    <option value="Biology">Biology</option>
                                    <option value="English">English</option>
                                    <option value="History">History</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; color: var(--text-muted);">Your Question</label>
                                <textarea id="questionText" placeholder="Type your question here..." style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; outline: none; resize: vertical; min-height: 100px; font-family: inherit;"></textarea>
                            </div>
                            <button id="submitQuestionBtn" class="cta-btn" style="padding: 12px 24px;">
                                <i class="fa-solid fa-paper-plane"></i> Submit Question (+5 XP)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Questions List -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-list"></i> My Questions</h3>
                    </div>
                    <div style="padding: 20px;">
                        ${questions.length === 0 ? `
                            <p style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                                <i class="fa-solid fa-inbox" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 15px;"></i>
                                No questions asked yet. Ask your first question to earn 5 XP!
                            </p>
                        ` : `
                            <div style="display: grid; gap: 15px;">
                                ${questions.sort((a, b) => b.id - a.id).map(q => `
                                    <div class="question-card" style="padding: 15px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                            <div style="flex: 1;">
                                                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
                                                    <span style="font-weight: 600; color: var(--primary);">${q.teacherName}</span>
                                                    <span style="padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; background: rgba(var(--primary-rgb), 0.2); color: var(--primary);">${q.subject}</span>
                                                </div>
                                                <div style="font-size: 0.8rem; color: var(--text-muted);">
                                                    Asked on ${new Date(q.askedAt).toLocaleDateString()} at ${new Date(q.askedAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                            <span class="status-badge" style="padding: 5px 12px; border-radius: 15px; font-size: 0.75rem; font-weight: 600; ${q.status === 'answered' ? 'background: rgba(76, 175, 80, 0.2); color: #4CAF50;' : 'background: rgba(255, 152, 0, 0.2); color: #FF9800;'}">
                                                <i class="fa-solid fa-${q.status === 'answered' ? 'check-circle' : 'clock'}"></i> ${q.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style="margin: 15px 0;">
                                            <div style="font-weight: 500; margin-bottom: 5px; font-size: 0.9rem;">Question:</div>
                                            <p style="margin: 0; line-height: 1.6; color: var(--text-light);">${q.question}</p>
                                        </div>
                                        ${q.answer ? `
                                            <div style="margin-top: 15px; padding: 12px; border-radius: 8px; background: rgba(76, 175, 80, 0.1); border-left: 3px solid #4CAF50;">
                                                <div style="font-weight: 500; margin-bottom: 5px; font-size: 0.9rem; color: #4CAF50;">
                                                    <i class="fa-solid fa-comment-dots"></i> Answer:
                                                </div>
                                                <p style="margin: 0; line-height: 1.6;">${q.answer}</p>
                                                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
                                                    Answered on ${new Date(q.answeredAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        // Event Listener
        document.getElementById('submitQuestionBtn').addEventListener('click', async () => {
            const teacherName = document.getElementById('teacherName').value.trim();
            const subject = document.getElementById('subjectSelect').value;
            const question = document.getElementById('questionText').value.trim();

            if (!teacherName || !question) {
                alert("Please fill in teacher name and question.");
                return;
            }

            const btn = document.getElementById('submitQuestionBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
            btn.disabled = true;

            try {
                await this.db.askTeacher({
                    teacherName: teacherName,
                    subject: subject,
                    question: question
                });

                // Clear form
                document.getElementById('teacherName').value = '';
                document.getElementById('questionText').value = '';

                // Refresh view and XP
                await this.renderAskTeacher(container);
                await this.updateUserInfo();

                alert("Question submitted successfully! You earned 5 XP!");
            } catch (error) {
                console.error("Error submitting question:", error);
                alert("Failed to submit question. Please try again.");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    },

    renderLeaderboard: async function (container) {
        const users = await this.db.getLeaderboard();
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Top Students</h3>
                </div>
                <div class="leaderboard-list">
                    ${users.map((u, index) => `
                        <div class="leaderboard-item">
                            <div class="rank rank-${index + 1}">${index + 1}</div>
                            <div class="player-avatar">${u.avatar}</div>
                            <div class="player-info">
                                <span>${u.name}</span>
                            </div>
                            <div class="score">${u.points} XP</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

// Set app global for debugging
window.app = app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
