import { DataStore } from './data.js';
import { PomodoroTimer } from './features/pomodoro.js';
import { ChatManager } from './features/chat.js';
import { renderCalendar } from './features/calendar.js';
import { renderTasks } from './features/tasks.js';
import { renderTimetable } from './features/timetable.js';
import { renderStudyMaterials } from './features/study.js';
import { renderGroupDiscussion } from './features/social.js';
import { renderHobbies, renderBadges, renderLeaderboard } from './features/gamification.js';
import { renderAskTeacher, renderTeacherQuestions } from './features/teacher.js';
import { renderChildProgress, renderChildActivity, renderParentalControls } from './features/parent.js';
import { renderWeekendFun } from './features/weekend.js';
import { renderProfile } from './features/profile.js';
import { renderQnAManager } from './features/qna.js';
import { renderStudentTracking } from './features/tracking.js';

import CONFIG from './config.js';

const GROQ_API_KEY = CONFIG.GROQ_API_KEY;
const GROQ_API_URL = CONFIG.GROQ_API_URL;

const app = {
    user: null,
    db: null,
    currentView: 'home',
    pomodoro: new PomodoroTimer(),
    chatManager: null,

    init: async function () {
        try {
            console.log("App initializing...");
            this.checkAuth();
            console.log("Auth checked. User:", this.user.id);

            this.db = new DataStore(this.user.id);
            console.log("DataStore created. Initializing DB...");
            await this.db.init();
            console.log("DB initialized.");

            this.chatManager = new ChatManager(this.db, this);

            if (this.user.isFirstLogin) {
                this.showChangePasswordModal();
            }

            this.setupGlobalEvents();
            this.renderSidebar();
            this.setupNotifications();
            this.checkWelcomeBadge();

            this.loadView('home');
            this.updateUserInfo();
            this.updateDate();
            console.log("App initialization complete.");
        } catch (error) {
            console.error("App initialization failed:", error);
            alert("Failed to load application: " + error.message);
            document.body.innerHTML = `<div style="color: white; text-align: center; padding: 50px;">
                <h1>Error Loading App</h1>
                <p>${error.message}</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; cursor: pointer;">Retry</button>
            </div>`;
        }
    },

    checkAuth: function () {
        const userStr = localStorage.getItem('edwise_user');
        if (!userStr) {
            window.location.href = 'index.html';
        }
        this.user = JSON.parse(userStr);
    },

    checkWelcomeBadge: async function () {
        if (this.user.role !== 'student') return;

        const badges = await this.db.getUserBadges();
        const welcomeBadgeId = 'welcome_explorer';

        if (!badges.includes(welcomeBadgeId)) {
            await this.db.awardBadge(welcomeBadgeId, 0); // 0 XP for welcome badge
            await this.db.addNotification({
                text: "Welcome to Ed-Wise! You've earned your first badge: Explorer!",
                icon: "fa-medal",
                color: "#FFD700"
            });
            this.updateNotificationBadge();
        }
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

            try {
                await this.db.updateUserPassword(newPass);
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

    setupNotifications: async function () {
        const bellBtn = document.querySelector('.icon-btn');
        if (bellBtn) {
            const existingBadge = bellBtn.querySelector('.badge');
            if (existingBadge) existingBadge.remove();

            if (!bellBtn.querySelector('.notification-badge')) {
                const badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #ff4757; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.7rem; display: none;';
                bellBtn.style.position = 'relative';
                bellBtn.appendChild(badge);
            }

            bellBtn.addEventListener('click', () => {
                this.showNotifications();
            });

            this.updateNotificationBadge();
            setInterval(() => this.updateNotificationBadge(), 60000);
        }
    },

    updateNotificationBadge: async function () {
        const notifications = await this.db.getNotifications();
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-badge');

        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    },

    showNotifications: async function () {
        const modalContainer = document.getElementById('modalContainer');
        const notifications = await this.db.getNotifications();
        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        modalContainer.innerHTML = `
            <div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;">
                <div class="modal-content" style="background: #1a1a2e; padding: 0; border-radius: 20px; width: 90%; max-width: 500px; border: 1px solid rgba(255,255,255,0.1); max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;"><i class="fa-solid fa-bell"></i> Notifications</h3>
                        <button id="closeNotifBtn" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; opacity: 0.7;">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div style="padding: 20px; overflow-y: auto; flex: 1;">
                        ${notifications.length > 0 ? notifications.map(notif => `
                            <div style="padding: 15px; border-radius: 12px; background: ${notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)'}; border-left: 3px solid ${notif.color || '#2196F3'}; margin-bottom: 12px;">
                                <div style="display: flex; gap: 12px; align-items: start;">
                                    <i class="fa-solid ${notif.icon || 'fa-info-circle'}" style="color: ${notif.color || '#2196F3'}; font-size: 1.2rem; margin-top: 2px;"></i>
                                    <div style="flex: 1;">
                                        <p style="margin: 0 0 5px 0; font-weight: ${notif.read ? 'normal' : 'bold'};">${notif.text}</p>
                                        <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted);">${new Date(notif.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<p style="text-align: center; color: var(--text-muted);">No notifications yet.</p>'}
                    </div>
                    <div style="padding: 15px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                        <button id="clearNotifsBtn" class="text-btn" style="color: var(--text-muted); font-size: 0.9rem;">Clear All</button>
                    </div>
                </div>
            </div>
        `;

        notifications.forEach(async (n) => {
            if (!n.read) {
                await this.db.markNotificationRead(n.id);
            }
        });
        this.updateNotificationBadge();

        document.getElementById('closeNotifBtn').addEventListener('click', () => {
            modalContainer.innerHTML = '';
        });

        document.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                modalContainer.innerHTML = '';
            }
        });
    },

    updateUserInfo: async function () {
        // Update top bar profile dropdown
        const topBarUserName = document.getElementById('topBarUserName');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserRole = document.getElementById('dropdownUserRole');

        if (topBarUserName) topBarUserName.textContent = this.user.name;
        if (dropdownUserName) dropdownUserName.textContent = this.user.name;
        if (dropdownUserRole) dropdownUserRole.textContent = this.user.role;

        const pointsDisplay = document.querySelector('.points-display');
        if (this.user.role === 'student') {
            const data = await this.db.getData();
            const points = data.stats?.points || 0;
            document.getElementById('userPoints').textContent = points;
            if (pointsDisplay) {
                pointsDisplay.style.display = points > 0 ? 'flex' : 'none';
            }
        } else {
            if (pointsDisplay) pointsDisplay.style.display = 'none';
        }
    },

    updateDate: function () {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateEl = document.getElementById('currentDate');
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    },

    renderSidebar: function () {
        const nav = document.querySelector('.nav-menu');
        if (!nav) return;

        let items = [];

        if (this.user.role === 'student') {
            items = [
                { id: 'home', icon: 'fa-house', label: 'Dashboard' },
                { id: 'profile', icon: 'fa-user', label: 'My Profile' },
                { id: 'tasks', icon: 'fa-list-check', label: 'To-Do List' },
                { id: 'calendar', icon: 'fa-calendar-alt', label: 'Calendar' },
                { id: 'timetable', icon: 'fa-calendar-days', label: 'Timetable' },
                { id: 'studymaterials', icon: 'fa-book', label: 'Study Materials' },
                { id: 'studyplan', icon: 'fa-wand-magic-sparkles', label: 'AI Study Plan' },
                { id: 'focus', icon: 'fa-clock', label: 'Focus Mode' },
                { id: 'chat', icon: 'fa-robot', label: 'AI Tutor' },
                { id: 'askteacher', icon: 'fa-chalkboard-user', label: 'Ask Teacher' },
                { id: 'groupdiscussion', icon: 'fa-users', label: 'Group Discussion' },
                { id: 'hobbies', icon: 'fa-puzzle-piece', label: 'Hobbies & Events' },
                { id: 'badges', icon: 'fa-medal', label: 'My Badges' },
                { id: 'leaderboard', icon: 'fa-trophy', label: 'Leaderboard' },
                { id: 'weekend', icon: 'fa-umbrella-beach', label: 'Weekend Fun' }
            ];
        } else if (this.user.role === 'teacher') {
            items = [
                { id: 'home', icon: 'fa-house', label: 'Dashboard' },
                { id: 'profile', icon: 'fa-user', label: 'My Profile' },
                { id: 'qna', icon: 'fa-comments', label: 'QnA Manager' },
                { id: 'students', icon: 'fa-users', label: 'Student Tracking' },
                { id: 'timetable', icon: 'fa-calendar-days', label: 'Timetable' },
                { id: 'studymaterials', icon: 'fa-book', label: 'Study Materials' }
            ];
        } else if (this.user.role === 'parent') {
            items = [
                { id: 'home', icon: 'fa-house', label: 'Overview' },
                { id: 'profile', icon: 'fa-user', label: 'My Profile' },
                { id: 'childprogress', icon: 'fa-chart-line', label: 'Child Progress' },
                { id: 'childactivity', icon: 'fa-eye', label: 'Activity Monitor' },
                { id: 'controls', icon: 'fa-lock', label: 'Parental Controls' },
                { id: 'reports', icon: 'fa-file-alt', label: 'Reports' }
            ];
        }

        nav.innerHTML = items.map(item => `
            <a href="#" class="nav-item ${item.id === 'home' ? 'active' : ''}" data-view="${item.id}">
                <i class="fa-solid ${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `).join('');

        this.setupSidebarEvents();
    },

    setupSidebarEvents: function () {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = item.dataset.view;
                if (viewId) this.loadView(viewId);
            });
        });
    },

    setupGlobalEvents: function () {
        // Profile dropdown toggle
        const profileDropdownBtn = document.getElementById('profileDropdownBtn');
        const profileDropdownMenu = document.getElementById('profileDropdownMenu');

        if (profileDropdownBtn && profileDropdownMenu) {
            profileDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdownBtn.classList.toggle('active');
                profileDropdownMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.profile-dropdown')) {
                    profileDropdownBtn.classList.remove('active');
                    profileDropdownMenu.classList.remove('show');
                }
            });

            // View Profile button
            const viewProfileBtn = document.getElementById('viewProfileBtn');
            if (viewProfileBtn) {
                viewProfileBtn.addEventListener('click', () => {
                    this.loadView('profile');
                    profileDropdownMenu.classList.remove('show');
                    profileDropdownBtn.classList.remove('active');
                });
            }

            // Settings button
            const settingsBtn = document.getElementById('settingsBtn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    alert('Settings feature coming soon!');
                    profileDropdownMenu.classList.remove('show');
                    profileDropdownBtn.classList.remove('active');
                });
            }

            // Top bar logout button
            const topBarLogoutBtn = document.getElementById('topBarLogoutBtn');
            if (topBarLogoutBtn) {
                topBarLogoutBtn.addEventListener('click', () => {
                    this.showLogoutModal();
                });
            }
        }
    },

    showLogoutModal: function () {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 12, 41, 0.95); z-index: 2000; display: flex; justify-content: center; align-items: center; flex-direction: column; text-align: center; color: white; opacity: 0; transition: opacity 0.5s ease; backdrop-filter: blur(10px);';
        modal.innerHTML = `
            <div style="transform: scale(0.8); transition: transform 0.5s ease;">
                <h2 style="font-size: 2.5rem; margin-bottom: 20px; background: linear-gradient(to right, #fff, #a5a5a5); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Thanks for using Ed-wise</h2>
                <p style="font-size: 1.5rem; margin-bottom: 15px; color: #a0a0a0;">See you again, until then</p>
                <p style="font-size: 2rem; font-weight: bold; color: #6C63FF;">Happy learning <i class="fa-solid fa-rocket"></i></p>
            </div>
        `;
        document.body.appendChild(modal);

        // Trigger animation
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.querySelector('div').style.transform = 'scale(1)';
        });

        // Redirect after delay
        setTimeout(() => {
            localStorage.removeItem('edwise_user');
            window.location.href = 'index.html';
        }, 3000);
    },

    loadView: async function (viewId) {
        // If we're processing an AI query and trying to leave chat, wait for it to complete
        if (this.currentView === 'chat' && viewId !== 'chat' && this.chatManager && this.chatManager.processingQuery) {
            console.log('Waiting for AI query to complete before navigation...');
            // Wait for the query to complete (max 30 seconds)
            let waitTime = 0;
            while (this.chatManager.processingQuery && waitTime < 30000) {
                await new Promise(resolve => setTimeout(resolve, 500));
                waitTime += 500;
            }
        }

        const content = document.getElementById('contentArea');
        const title = document.getElementById('pageTitle');

        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const activeItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
        if (activeItem) activeItem.classList.add('active');

        this.currentView = viewId;
        content.innerHTML = '<div style="text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        switch (viewId) {
            case 'home':
                title.textContent = 'Dashboard';
                await this.renderHome(content);
                break;
            case 'tasks':
                title.textContent = 'My Tasks';
                await renderTasks(content, this.db);
                break;
            case 'calendar':
                title.textContent = 'My Calendar';
                await renderCalendar(content, this.db);
                break;
            case 'timetable':
                title.textContent = 'Class Timetable';
                await renderTimetable(content, this.db);
                break;
            case 'studymaterials':
                title.textContent = 'Study Materials';
                await renderStudyMaterials(content, this.db);
                break;
            case 'studymaterials':
                title.textContent = 'Study Materials';
                await renderStudyMaterials(content, this.db);
                break;
            case 'studyplan':
                title.textContent = 'AI Study Planner';
                this.renderStudyPlanGenerator(content);
                break;
            case 'focus':
                title.textContent = 'Focus Session';
                this.renderFocus(content);
                break;
            case 'chat':
                title.textContent = 'AI Tutor';
                // Always create a new chat session when accessing AI Tutor
                await this.chatManager.createNewSession();
                await this.chatManager.render(content);
                break;
            case 'askteacher':
                title.textContent = 'Ask Teacher';
                await renderAskTeacher(content, this.db, this);
                break;
            case 'groupdiscussion':
                title.textContent = 'Group Discussions';
                await renderGroupDiscussion(content, this.db);
                break;
            case 'hobbies':
                title.textContent = 'Hobbies & Competitions';
                await renderHobbies(content, this.db);
                break;
            case 'badges':
                title.textContent = 'My Achievements';
                await renderBadges(content, this.db);
                break;
            case 'weekend':
                title.textContent = 'Weekend Fun Activities';
                await renderWeekendFun(content, this.db);
                break;
            case 'teacherquestions':
                title.textContent = 'Student Questions';
                await renderTeacherQuestions(content, this.db, this);
                break;
            case 'qna':
                title.textContent = 'QnA Manager';
                await renderQnAManager(content, this.db, this);
                break;
            case 'students':
                title.textContent = 'Student Tracking';
                await renderStudentTracking(content, this.db, this.user);
                break;
            case 'childprogress':
                title.textContent = 'Child Progress';
                await renderChildProgress(content, this.db);
                break;
            case 'childactivity':
                title.textContent = 'Activity Monitor';
                await renderChildActivity(content, this.db);
                break;
            case 'controls':
                title.textContent = 'Parental Controls';
                await renderParentalControls(content, this.db);
                break;
            case 'leaderboard':
                title.textContent = 'Class Leaderboard';
                await renderLeaderboard(content, this.db);
                break;
            case 'profile':
                title.textContent = 'My Profile';
                await renderProfile(content, this.db, this.user, this);
                break;
            default:
                content.innerHTML = `<div class="card"><h3>Coming Soon</h3><p>The ${viewId} module is under construction.</p></div>`;
        }
    },

    renderHome: async function (container) {
        const data = await this.db.getData();
        const tasks = await this.db.getTasks();
        const pendingTasks = tasks.filter(t => !t.completed);

        if (this.user.role === 'student') {
            container.innerHTML = `
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                            <i class="fa-solid fa-gem"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${data.stats?.points || 0}</h3>
                            <p>Total XP</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
                            <i class="fa-solid fa-fire"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${data.stats?.streak || 0}</h3>
                            <p>Day Streak</p>
                        </div>
                    </div>

                    <div class="stat-card clickable-card" data-navigate="tasks" style="cursor: pointer;">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
                            <i class="fa-solid fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${data.stats?.tasksCompleted || 0}</h3>
                            <p>Tasks Done</p>
                        </div>
                    </div>

                    <div class="stat-card clickable-card" data-navigate="tasks" style="cursor: pointer;">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
                            <i class="fa-solid fa-list-check"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${pendingTasks.length}</h3>
                            <p>Pending Tasks</p>
                        </div>
                    </div>
                </div>

                <div class="card" style="margin-top: 20px;">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-brain"></i> AI Study Planner</h3>
                    </div>
                    <div style="padding: 20px; text-align: center;">
                        <p style="margin-bottom: 15px; color: var(--text-muted);">Get a personalized study plan based on your learning goals</p>
                        <button id="createStudyPlanBtn" class="cta-btn" style="max-width: 300px; margin: 0 auto;">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Study Plan
                        </button>
                    </div>
                </div>
            `;

            // Add click handlers for clickable cards
            document.querySelectorAll('.clickable-card').forEach(card => {
                card.addEventListener('click', () => {
                    const navigateTo = card.dataset.navigate;
                    if (navigateTo) {
                        this.loadView(navigateTo);
                    }
                });
            });
        } else {
            // Teacher/Parent Dashboard
            container.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h3>Welcome Back, ${this.user.name}!</h3>
                    </div>
                    <div style="padding: 20px;">
                        <p>You are logged in as a <strong>${this.user.role}</strong>.</p>
                        <p>Use the sidebar to navigate through the available features.</p>
                    </div>
                </div>
            `;
        }

        const btn = document.getElementById('createStudyPlanBtn');
        if (btn) {
            btn.addEventListener('click', async () => {
                this.showStudyPlanModal();
            });
        }
    },

    renderStudyPlanGenerator: function (container) {
        container.innerHTML = `
            <div class="card" style="max-width: 900px; margin: 0 auto; height: calc(100vh - 180px); display: flex; flex-direction: column; overflow: hidden;">
                <div class="card-header" style="padding: 12px 20px; flex-shrink: 0;">
                    <h3 style="margin: 0; font-size: 1.1rem;"><i class="fa-solid fa-brain"></i> Generate AI Study Plan</h3>
                </div>
                <div style="padding: 18px 25px; overflow-y: auto; flex: 1; display: flex; flex-direction: column;">
                    <div style="display: flex; flex-direction: column; gap: 12px; flex: 1;">
                        <div style="display: flex; flex-direction: column;">
                            <label style="display: block; margin-bottom: 4px; color: var(--text-muted); font-weight: 500; font-size: 0.85rem;">Describe Your Goal *</label>
                            <textarea id="studyGoal" placeholder="e.g., Master calculus, learn web development..." 
                                style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; min-height: 55px; max-height: 55px; resize: none; font-family: inherit; line-height: 1.3; font-size: 0.9rem; flex-shrink: 0;"></textarea>
                        </div>

                        <div style="display: flex; flex-direction: column;">
                            <label style="display: block; margin-bottom: 4px; color: var(--text-muted); font-weight: 500; font-size: 0.85rem;">Time Duration *</label>
                            <input type="text" id="studyDuration" placeholder="e.g., 120 minutes, 10 hours, 5 days, 2 weeks..." 
                                style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; font-size: 0.9rem; flex-shrink: 0;">
                        </div>

                        <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
                            <label style="display: block; margin-bottom: 4px; color: var(--text-muted); font-weight: 500; font-size: 0.85rem;">Upload Materials (Optional)</label>
                            
                            <!-- Compact Drag and Drop Zone -->
                            <div id="dropZone" style="
                                border: 2px dashed rgba(255,255,255,0.2); 
                                border-radius: 8px; 
                                padding: 12px; 
                                text-align: center; 
                                background: rgba(0,0,0,0.2);
                                transition: all 0.3s ease;
                                cursor: pointer;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                min-height: 80px;
                            ">
                                <i class="fa-solid fa-cloud-arrow-up" style="font-size: 1.4rem; color: var(--primary); margin-bottom: 4px;"></i>
                                <p style="margin: 0; font-size: 0.85rem; color: white;">Drag & Drop or 
                                    <span style="color: var(--primary); text-decoration: underline;">Choose Files</span>
                                </p>
                                <input type="file" id="studyFiles" multiple accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png" style="display: none;">
                            </div>
                        </div>

                        <div id="filesList" style="display: none; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px; border-left: 3px solid var(--primary); max-height: 80px; overflow-y: auto; flex-shrink: 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">
                                    <i class="fa-solid fa-paperclip"></i> Files:
                                </p>
                                <button id="clearFilesBtn" style="background: none; border: none; color: #ff4757; cursor: pointer; font-size: 0.75rem; padding: 2px 6px;">
                                    <i class="fa-solid fa-times"></i> Clear
                                </button>
                            </div>
                            <div id="filesListContent"></div>
                        </div>

                        <button id="generatePlanBtn" class="cta-btn" style="width: 100%; margin-top: auto; padding: 10px; flex-shrink: 0;">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Study Plan
                        </button>
                    </div>

                    <div id="studyPlanResult" style="display: none; margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 10px; border-left: 3px solid var(--primary); flex-shrink: 0;">
                        <h4 style="margin-bottom: 12px; font-size: 1rem; color: var(--primary);"><i class="fa-solid fa-clipboard-check"></i> Your Study Plan</h4>
                        <div id="studyPlanContent" style="line-height: 1.6; font-size: 0.9rem;"></div>
                        <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end;">
                             <button id="clearPlanBtn" class="control-btn" style="font-size: 0.8rem; padding: 6px 12px; background: #ff4757; border: none;"><i class="fa-solid fa-times"></i> Clear</button>
                             <button id="savePlanBtn" class="control-btn btn-secondary" style="font-size: 0.8rem; padding: 6px 12px;"><i class="fa-solid fa-save"></i> Save</button>
                             <button id="printPlanBtn" class="control-btn btn-secondary" style="font-size: 0.8rem; padding: 6px 12px;"><i class="fa-solid fa-print"></i> Print</button>
                        </div>
                    </div>
                </div>
                <div style="text-align: center; padding: 10px; font-size: 0.75rem; color: var(--text-muted); opacity: 0.7;">
                    Ed-wise AI can make mistakes. Check important info. See Cookie Preferences.
                </div>
            </div>
        `;

        // File handling setup
        const fileInput = document.getElementById('studyFiles');
        const filesList = document.getElementById('filesList');
        const filesListContent = document.getElementById('filesListContent');
        const dropZone = document.getElementById('dropZone');
        const chooseFilesBtn = document.getElementById('chooseFilesBtn');
        const clearFilesBtn = document.getElementById('clearFilesBtn');

        let selectedFiles = [];

        // Function to display files
        const displayFiles = () => {
            if (selectedFiles.length > 0) {
                filesList.style.display = 'block';
                filesListContent.innerHTML = selectedFiles.map((f, index) => `
                    <div style="padding: 4px 8px; margin-bottom: 3px; background: rgba(255,255,255,0.05); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 6px; flex: 1; overflow: hidden;">
                            <i class="fa-solid fa-file" style="color: var(--primary); font-size: 0.75rem;"></i>
                            <span style="font-size: 0.8rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${f.name}</span>
                        </div>
                        <button class="remove-file-btn" data-index="${index}" style="background: none; border: none; color: #ff4757; cursor: pointer; padding: 2px 4px; font-size: 0.75rem; flex-shrink: 0;">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                `).join('');

                // Add remove file handlers
                document.querySelectorAll('.remove-file-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const index = parseInt(e.currentTarget.dataset.index);
                        selectedFiles.splice(index, 1);
                        displayFiles();
                    });
                });
            } else {
                filesList.style.display = 'none';
            }
        };

        // Clear all files
        clearFilesBtn.addEventListener('click', () => {
            selectedFiles = [];
            fileInput.value = '';
            displayFiles();
        });

        // File input change handler
        fileInput.addEventListener('change', (e) => {
            const newFiles = Array.from(e.target.files);
            selectedFiles = [...selectedFiles, ...newFiles];
            displayFiles();
        });

        // Drag and drop handlers
        dropZone.addEventListener('click', (e) => {
            if (e.target !== chooseFilesBtn) {
                fileInput.click();
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary)';
            dropZone.style.background = 'rgba(108, 99, 255, 0.1)';
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(255,255,255,0.2)';
            dropZone.style.background = 'rgba(0,0,0,0.2)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(255,255,255,0.2)';
            dropZone.style.background = 'rgba(0,0,0,0.2)';

            const droppedFiles = Array.from(e.dataTransfer.files);
            selectedFiles = [...selectedFiles, ...droppedFiles];
            displayFiles();
        });

        // Function to format AI response
        const formatAIResponse = (text) => {
            // Replace **text** with <strong>text</strong> for bold
            let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

            // Replace single * at start of line with bullet points
            formatted = formatted.replace(/^\* /gm, '• ');

            // Replace numbered lists (1., 2., etc.) with proper formatting
            formatted = formatted.replace(/^(\d+)\.\s/gm, '<strong>$1.</strong> ');

            // Split into lines and wrap in proper HTML
            const lines = formatted.split('\n');
            let html = '';
            let inList = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (line === '') {
                    if (inList) {
                        html += '</ul>';
                        inList = false;
                    }
                    html += '<br>';
                    continue;
                }

                // Check if line starts with bullet
                if (line.startsWith('•')) {
                    if (!inList) {
                        html += '<ul style="margin: 8px 0; padding-left: 20px;">';
                        inList = true;
                    }
                    html += `<li style="margin: 4px 0;">${line.substring(1).trim()}</li>`;
                } else {
                    if (inList) {
                        html += '</ul>';
                        inList = false;
                    }

                    // Check if it's a heading (contains <strong> tag)
                    if (line.includes('<strong>') && line.endsWith('</strong>')) {
                        html += `<h4 style="margin: 15px 0 8px 0; color: var(--primary); font-size: 1rem;">${line}</h4>`;
                    } else if (line.match(/^<strong>\d+\.<\/strong>/)) {
                        // Numbered item
                        html += `<p style="margin: 6px 0;">${line}</p>`;
                    } else {
                        html += `<p style="margin: 6px 0;">${line}</p>`;
                    }
                }
            }

            if (inList) {
                html += '</ul>';
            }

            return html;
        };

        // Generate plan
        document.getElementById('generatePlanBtn').addEventListener('click', async () => {
            const goal = document.getElementById('studyGoal').value.trim();
            const duration = document.getElementById('studyDuration').value.trim();

            // Validate required fields
            if (!goal) {
                alert('Please describe your learning goal!');
                return;
            }

            if (!duration) {
                alert('Please enter a time duration for your study plan!');
                return;
            }

            const generateBtn = document.getElementById('generatePlanBtn');
            const originalText = generateBtn.innerHTML;
            generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            generateBtn.disabled = true;

            try {
                let fileContents = '';
                let hasUploadedContent = false;

                // Process uploaded files FIRST with enhanced extraction
                if (selectedFiles.length > 0) {
                    for (let file of selectedFiles) {
                        if (file.size > 10 * 1024 * 1024) {
                            alert(`File ${file.name} is too large (max 10MB)`);
                            continue;
                        }

                        // Read text files
                        if (file.type.includes('text') || file.name.endsWith('.txt')) {
                            const text = await file.text();
                            fileContents += `\n\n=== Content from ${file.name} ===\n${text.substring(0, 15000)}`; // Increased to 15000 chars
                            hasUploadedContent = true;
                        }
                        // Handle PDF files - extract text content
                        else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                            try {
                                // For now, inform user that PDF text extraction requires server-side processing
                                // In a production environment, you would use PDF.js or a server endpoint
                                const reader = new FileReader();
                                const pdfText = await new Promise((resolve, reject) => {
                                    reader.onload = async (e) => {
                                        try {
                                            // Basic PDF text extraction (limited in browser)
                                            const arrayBuffer = e.target.result;
                                            const uint8Array = new Uint8Array(arrayBuffer);
                                            const textDecoder = new TextDecoder('utf-8');
                                            let extractedText = textDecoder.decode(uint8Array);

                                            // Clean up PDF artifacts
                                            extractedText = extractedText.replace(/[^\x20-\x7E\n]/g, ' ');
                                            extractedText = extractedText.replace(/\s+/g, ' ').trim();

                                            resolve(extractedText.substring(0, 15000));
                                        } catch (err) {
                                            resolve('');
                                        }
                                    };
                                    reader.onerror = reject;
                                    reader.readAsArrayBuffer(file);
                                });

                                if (pdfText && pdfText.length > 100) {
                                    fileContents += `\n\n=== Content from ${file.name} (PDF) ===\n${pdfText}`;
                                    hasUploadedContent = true;
                                } else {
                                    fileContents += `\n\n=== PDF Document: ${file.name} ===\n[PDF uploaded - For best results, please convert to .txt format or the AI will work with available metadata]`;
                                }
                            } catch (error) {
                                console.error('PDF processing error:', error);
                                fileContents += `\n\n=== PDF Document: ${file.name} ===\n[PDF uploaded - Text extraction limited in browser. For detailed analysis, please convert to .txt format]`;
                            }
                        }
                        // Handle Word documents
                        else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                            fileContents += `\n\n=== Document: ${file.name} ===\n[Word document uploaded - For best results, please convert to .txt or .pdf format]`;
                        }
                        else {
                            fileContents += `\n\n=== File: ${file.name} ===\n[Binary file - content not readable as text. Please use .txt or .pdf format]`;
                        }
                    }
                }

                let prompt = '';

                // CASE 1: Documents uploaded - STRICT material-based response
                if (hasUploadedContent) {
                    prompt = `You are an expert study plan creator. A student has uploaded study materials and wants to learn the following:

Goal: ${goal}
Timeframe: ${duration}

UPLOADED STUDY MATERIALS:
${fileContents}

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. You MUST analyze and extract information EXCLUSIVELY from the uploaded document content provided above.
2. The study plan must be based ONLY on topics, concepts, and information explicitly found in the uploaded materials.
3. DO NOT use external knowledge, web information, or general assumptions. Work ONLY with the document content.
4. If the user asks for "major topics" or similar, identify them by reading the uploaded content above.
5. Structure the study plan around the actual content structure of the uploaded materials.
6. Reference specific sections, chapters, topics, or concepts that appear in the uploaded document.
7. If the materials are insufficient or unclear, explicitly state what is missing rather than adding external information.
8. Organize the document's content into a logical learning sequence based on what's actually in the materials.

CRITICAL DURATION INTERPRETATION RULES:
- The user has specified: "${duration}"
- You MUST structure the study plan using the EXACT time unit provided by the user
- Supported units: MINUTES, HOURS, DAYS, WEEKS, MONTHS
- DO NOT default to "day-wise" planning unless the user explicitly specified days
- Examples:
  * If "${duration}" = "120 minutes": Break down activities totaling 120 minutes (e.g., Activity 1: 30 min, Activity 2: 45 min)
  * If "${duration}" = "10 hours": Structure activities totaling 10 hours (e.g., Hour 1-2: Topic A, Hour 3-5: Topic B)
  * If "${duration}" = "5 days": Use day-based structure (Day 1, Day 2, etc.)
  * If "${duration}" = "2 weeks": Use week-based structure or break into days/hours within weeks
  * If "${duration}" = "1 month": Use week or day-based structure within the month
- NEVER use "Day X" headings unless user specified duration in days
- Match your time breakdown to the user's specified unit
- Ensure all activities/sessions sum to the total duration specified

Please provide a study plan with:
- Major topics and concepts IDENTIFIED FROM THE UPLOADED DOCUMENT
- Specific sections and content FROM THE MATERIALS to study in sequence
- A schedule structured using the EXACT time unit from "${duration}"
- Time allocations that sum to the total ${duration}
- Practice exercises or review questions BASED ON THE DOCUMENT CONTENT
- Review checkpoints for material-specific content

FORMATTING REQUIREMENTS:
- Use **text** for headings that match the time unit (e.g., **Minute 1-30:** or **Hour 1-2:** or **Week 1:** based on "${duration}")
- Use dashes (-) for all list items
- Use numbered lists (1., 2., 3.) for sequential steps
- Keep sections separated with blank lines

Generate a study plan that is 100% grounded in the uploaded document content and uses the time unit from "${duration}". Make it clear you have processed the uploaded file.`;

                }
                // CASE 2: No documents - Specific, tailored response based on goal
                else {
                    prompt = `You are an expert study plan creator with deep knowledge across all subjects. Create a highly specific and tailored study plan for this learning goal:

Goal: ${goal}
Timeframe: ${duration}

CRITICAL INSTRUCTIONS:
1. Analyze the specific goal carefully and identify the exact subject, topic, or skill being requested.
2. Generate a SPECIFIC, DETAILED study plan tailored to this exact goal - NOT a generic template.
3. Include concrete topics, concepts, and resources that are directly relevant to achieving this specific goal.
4. Provide actionable steps, specific learning objectives, and targeted practice activities.
5. If the goal mentions a specific exam, certification, or application, tailor the plan accordingly.
6. Include specific resources, techniques, or methodologies that are proven effective for this particular subject/skill.

CRITICAL DURATION INTERPRETATION RULES:
- The user has specified: "${duration}"
- You MUST structure the study plan using the EXACT time unit provided by the user
- Supported units: MINUTES, HOURS, DAYS, WEEKS, MONTHS
- DO NOT default to "day-wise" planning unless the user explicitly specified days
- Examples:
  * If "${duration}" = "120 minutes": Break down activities totaling 120 minutes (e.g., Activity 1: 30 min, Activity 2: 45 min)
  * If "${duration}" = "10 hours": Structure activities totaling 10 hours (e.g., Hour 1-2: Topic A, Hour 3-5: Topic B)
  * If "${duration}" = "5 days": Use day-based structure (Day 1, Day 2, etc.)
  * If "${duration}" = "2 weeks": Use week-based structure or break into days/hours within weeks
  * If "${duration}" = "1 month": Use week or day-based structure within the month
- NEVER use "Day X" headings unless user specified duration in days
- Match your time breakdown to the user's specified unit
- Ensure all activities/sessions sum to the total duration specified
- For short durations (minutes/hours), provide intensive, focused sessions
- For longer durations (weeks/months), break down appropriately but maintain the primary unit

Please provide a comprehensive study plan with:
1. A clear breakdown of the specific learning path for THIS goal
2. Concrete topics, concepts, and skills to master (not generic placeholders)
3. A schedule structured using the EXACT time unit from "${duration}"
4. Time allocations for each activity that sum to the total ${duration}
5. Specific practice exercises, projects, or activities relevant to the goal
6. Recommended resources (books, courses, tools) specific to this subject
7. Progress checkpoints and assessment strategies
8. Tips and strategies specific to mastering this particular subject/skill

FORMATTING REQUIREMENTS:
- Use **text** for headings that match the time unit (e.g., **Minutes 1-30:** or **Hour 1-2:** or **Day 1:** or **Week 1:** based on "${duration}")
- Use dashes (-) for all list items
- Use numbered lists (1., 2., 3.) for sequential steps
- Keep sections clearly separated with blank lines
- Maintain clear hierarchy: headings in bold, lists with dashes or numbers

Make it practical, achievable, motivating, and HIGHLY SPECIFIC to the stated goal. Structure the entire plan using the time unit specified in "${duration}". Avoid generic advice - provide concrete, actionable guidance tailored to this exact learning objective.`;
                }

                const response = await this.callGroqAPI(prompt);

                // Display result with formatting
                const resultDiv = document.getElementById('studyPlanResult');
                resultDiv.style.display = 'block';
                document.getElementById('studyPlanContent').innerHTML = formatAIResponse(response);

                // DO NOT clear input fields - keep them for user reference
                // Removed: document.getElementById('studyGoal').value = '';
                // Removed: document.getElementById('studyDuration').value = '';
                // Removed: selectedFiles = [];
                // Removed: fileInput.value = '';
                // Removed: displayFiles();

                // Scroll to result
                resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                // Setup action buttons (Clear, Save, Print)
                document.getElementById('clearPlanBtn').onclick = () => {
                    // Clear the study plan result
                    resultDiv.style.display = 'none';
                    document.getElementById('studyPlanContent').innerHTML = '';

                    // Clear all input fields
                    document.getElementById('studyGoal').value = '';
                    document.getElementById('studyDuration').value = '';
                    selectedFiles = [];
                    fileInput.value = '';
                    displayFiles();
                };

                document.getElementById('savePlanBtn').onclick = () => {
                    // TODO: Implement save functionality
                    alert('Save functionality will be implemented soon!');
                };

                document.getElementById('printPlanBtn').onclick = () => {
                    const printWindow = window.open('', '', 'height=600,width=800');
                    printWindow.document.write('<html><head><title>Study Plan</title>');
                    printWindow.document.write('<style>body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; } h1, h3, h4 { color: #6C63FF; } ul { margin: 10px 0; } li { margin: 5px 0; } strong { color: #6C63FF; }</style>');
                    printWindow.document.write('</head><body>');
                    printWindow.document.write('<h1>Study Plan</h1>');
                    printWindow.document.write('<h3>Goal: ' + goal + '</h3>');
                    printWindow.document.write('<p><strong>Duration:</strong> ' + duration + '</p>');
                    if (selectedFiles.length > 0) {
                        printWindow.document.write('<p><strong>Materials:</strong> ' + selectedFiles.map(f => f.name).join(', ') + '</p>');
                    }
                    printWindow.document.write('<hr>');
                    printWindow.document.write(formatAIResponse(response));
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                    printWindow.print();
                };

            } catch (error) {
                console.error('Error generating study plan:', error);
                alert('Failed to generate study plan. Error: ' + error.message);
            } finally {
                generateBtn.innerHTML = originalText;
                generateBtn.disabled = false;
            }
        });
    },

    showStudyPlanModal: async function () {
        // Redirect to the new full page view
        this.loadView('studyplan');
    },

    renderFocus: function (container) {
        // Ensure pomodoro state is initialized for rendering if needed
        // The PomodoroTimer class handles its own state, but we need to pass the initial view structure
        // We'll use the timer's internal state to render the initial view

        const currentStage = this.pomodoro.sequence[this.pomodoro.currentIndex];

        container.innerHTML = `
            <div class="card focus-card" style="text-align: center; padding: 50px; width: 100%; max-width: 800px; margin: 0 auto;">
                <div style="margin-bottom: 20px;">
                    <span id="pomodoroStatusBadge" style="background: rgba(255,255,255,0.1); padding: 5px 15px; border-radius: 20px; font-size: 0.9rem;">
                        ${this.pomodoro.state === 'IDLE' ? 'Ready to Start' : currentStage.label}
                    </span>
                </div>
                
                <h3 id="focusStatus">${this.pomodoro.state === 'IDLE' ? 'Pomodoro Cycle' : 'Stay Focused'}</h3>
                
                <div class="timer-display" id="timerDisplay" style="font-size: 6rem; font-weight: 700; margin: 20px 0; color: var(--primary);">
                    ${this.pomodoro.formatTime(this.pomodoro.timeLeft)}
                </div>
                
                <div class="timer-controls" style="display: flex; justify-content: center; gap: 15px; margin-bottom: 30px;">
                    <button class="cta-btn" id="startTimerBtn">
                        <i class="fa-solid fa-play"></i> Start Cycle
                    </button>
                    <button class="cta-btn" id="pauseTimerBtn" style="display: none; background: #f39c12;">
                        <i class="fa-solid fa-pause"></i> Pause
                    </button>
                    <button class="control-btn btn-secondary" id="resetTimerBtn">
                        <i class="fa-solid fa-rotate-right"></i> Reset
                    </button>
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

        this.pomodoro.attachToDOM(
            document.getElementById('timerDisplay'),
            document.getElementById('pomodoroStatusBadge'), // Using the badge as the status element
            document.getElementById('startTimerBtn'),
            document.getElementById('pauseTimerBtn'), // Separate pause button
            document.getElementById('resetTimerBtn'),
            this.db
        );
    },

    callGroqAPI: async function (prompt) {
        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { role: "system", content: "You are Ed Wise, a helpful and knowledgeable AI learning assistant. Format your responses using proper markdown: use **bold** for headings and important terms, use bullet points (•) or numbered lists for items, and avoid using asterisks (*) for emphasis. Use clear, structured formatting." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API request failed');
            }

            const data = await response.json();
            let content = data.choices[0].message.content;

            // Format the response to remove asterisks and improve display
            content = this.formatAIResponse(content);

            return content;
        } catch (error) {
            console.error("Groq API Error:", error);
            throw error;
        }
    },

    getAIResponse: async function (userMessage) {
        try {
            return await this.callGroqAPI(userMessage);
        } catch (error) {
            console.error("AI Error:", error);
            return "I'm having trouble connecting right now. Please try again later.";
        }
    },

    formatAIResponse: function (text) {
        // Remove all asterisks and hash symbols completely
        let formatted = text;

        // Handle markdown headings (### text) - convert to colored spans
        formatted = formatted.replace(/^###\s*(.+?)$/gm, '<span style="color: #6C63FF; font-weight: 600; font-size: 1.1em;">$1</span>');
        formatted = formatted.replace(/^##\s*(.+?)$/gm, '<span style="color: #6C63FF; font-weight: 600; font-size: 1.15em;">$1</span>');
        formatted = formatted.replace(/^#\s*(.+?)$/gm, '<span style="color: #6C63FF; font-weight: 600; font-size: 1.2em;">$1</span>');

        // Handle **text** patterns (headings/important terms) - convert to colored spans
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<span style="color: #6C63FF; font-weight: 600;">$1</span>');

        // Replace single * at start of line with bullet points
        formatted = formatted.replace(/^\* /gm, '• ');

        // Remove any remaining asterisks and hash symbols
        formatted = formatted.replace(/\*/g, '');
        formatted = formatted.replace(/#/g, '');

        // Improve paragraph structure - add line breaks between sections
        // Split by double newlines and process
        const paragraphs = formatted.split('\n\n');
        const processedParagraphs = paragraphs.map(para => {
            para = para.trim();
            if (!para) return '';

            // Check if it's a list item
            if (para.startsWith('•') || /^\d+\./.test(para)) {
                return para;
            }

            // Break long paragraphs (more than 200 chars) into smaller chunks
            if (para.length > 200 && !para.includes('<span')) {
                const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
                let chunks = [];
                let currentChunk = '';

                sentences.forEach(sentence => {
                    if ((currentChunk + sentence).length > 150) {
                        if (currentChunk) chunks.push(currentChunk.trim());
                        currentChunk = sentence;
                    } else {
                        currentChunk += sentence;
                    }
                });
                if (currentChunk) chunks.push(currentChunk.trim());

                return chunks.join('\n\n');
            }

            return para;
        });

        formatted = processedParagraphs.join('\n\n');

        // Convert newlines to <br> for HTML display, but preserve structure
        formatted = formatted.replace(/\n/g, '<br>');

        // Add spacing after bullet points for better readability
        formatted = formatted.replace(/• /g, '• ');

        return formatted;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
