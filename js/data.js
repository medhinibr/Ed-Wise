import { db } from './firebase-config.js';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const DEFAULT_DATA = {
    tasks: [
        { id: 1, title: "Math Homework: Calculus", subject: "Math", dueDate: "2025-11-22", priority: "high", completed: false },
        { id: 2, title: "Physics Project Research", subject: "Physics", dueDate: "2025-11-24", priority: "medium", completed: false },
        { id: 3, title: "Read Chapter 4: History", subject: "History", dueDate: "2025-11-23", priority: "low", completed: true }
    ],
    timetable: [
        { day: "Monday", periods: ["Math", "Physics", "Chemistry", "Break", "English", "CS"] },
        { day: "Tuesday", periods: ["Physics", "Math", "Biology", "Break", "History", "PE"] },
        { day: "Wednesday", periods: ["Chemistry", "Biology", "Math", "Break", "English", "Art"] },
        { day: "Thursday", periods: ["Math", "Physics", "CS", "Break", "History", "Library"] },
        { day: "Friday", periods: ["Biology", "Chemistry", "English", "Break", "Math", "Club"] }
    ],
    leaderboard: [
        { id: 1, name: "Alice Johnson", points: 1250, avatar: "A" },
        { id: 2, name: "Bob Smith", points: 1100, avatar: "B" },
        { id: 3, name: "Charlie Brown", points: 950, avatar: "C" },
        { id: 4, name: "David Lee", points: 900, avatar: "D" },
        { id: 5, name: "Eva Green", points: 850, avatar: "E" }
    ],
    chatHistory: [
        { sender: "bot", text: "Hello! I'm your AI study assistant. How can I help you today?" }
    ]
};

export class DataStore {
    constructor(userId) {
        this.userId = userId;
        this.userRef = doc(db, "users", userId);
    }

    async init() {
        try {
            console.log(`[DataStore] Initializing for user: ${this.userId}`);
            const docSnap = await getDoc(this.userRef);
            if (!docSnap.exists()) {
                console.log("[DataStore] Creating new user document with default data.");
                await updateDoc(this.userRef, DEFAULT_DATA);
            } else {
                console.log("[DataStore] User document found.");
            }
        } catch (e) {
            console.error("[DataStore] Error initializing data:", e);
        }
    }

    async getData() {
        try {
            const docSnap = await getDoc(this.userRef);
            const data = docSnap.exists() ? docSnap.data() : DEFAULT_DATA;
            console.log("[DataStore] Fetched data:", data);
            return data;
        } catch (e) {
            console.error("[DataStore] Error fetching data:", e);
            return DEFAULT_DATA;
        }
    }

    async getTasks() {
        const data = await this.getData();
        return data.tasks || [];
    }

    async addTask(task) {
        console.log("[DataStore] Adding task:", task);
        task.id = Date.now();
        await updateDoc(this.userRef, {
            tasks: arrayUnion(task)
        });
        console.log("[DataStore] Task added successfully.");
        return task;
    }

    async toggleTask(taskId) {
        console.log(`[DataStore] Toggling task ID: ${taskId}`);
        const data = await this.getData();
        const tasks = data.tasks || [];
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex !== -1) {
            const updatedTasks = [...tasks];
            updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;

            await updateDoc(this.userRef, {
                tasks: updatedTasks
            });
            console.log("[DataStore] Task toggled.");
            return true;
        }
        return false;
    }

    async deleteTask(taskId) {
        console.log(`[DataStore] Deleting task ID: ${taskId}`);
        const data = await this.getData();
        const tasks = data.tasks || [];
        const updatedTasks = tasks.filter(t => t.id !== taskId);

        await updateDoc(this.userRef, {
            tasks: updatedTasks
        });
        console.log("[DataStore] Task deleted.");
        return true;
    }

    async getLeaderboard() {
        // In a real app, this would query a separate 'leaderboard' collection
        // For now, we'll just return the mock data from the user doc or a global constant
        // To make it realistic, let's fetch all users and sort them
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef);
            const querySnapshot = await getDocs(q);

            let leaderboard = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.role === 'student') {
                    leaderboard.push({
                        id: doc.id,
                        name: data.name,
                        points: data.stats ? data.stats.points : 0,
                        avatar: data.name.charAt(0).toUpperCase()
                    });
                }
            });

            return leaderboard.sort((a, b) => b.points - a.points);
        } catch (e) {
            console.error("Error fetching leaderboard:", e);
            return DEFAULT_DATA.leaderboard;
        }
    }

    async getChatHistory() {
        const data = await this.getData();
        return data.chatHistory || [];
    }

    async addChatMessage(msg) {
        console.log("[DataStore] Saving chat message:", msg);
        await updateDoc(this.userRef, {
            chatHistory: arrayUnion(msg)
        });
    }

    async clearChatHistory() {
        console.log("[DataStore] Clearing chat history.");
        await updateDoc(this.userRef, {
            chatHistory: []
        });
    }

    async updateUserStats(pointsToAdd, tasksCompletedToAdd) {
        console.log(`[DataStore] Updating stats: +${pointsToAdd} XP, +${tasksCompletedToAdd} Tasks`);
        const data = await this.getData();
        const currentStats = data.stats || { points: 0, streak: 0, tasksCompleted: 0 };

        const newStats = {
            ...currentStats,
            points: currentStats.points + pointsToAdd,
            tasksCompleted: currentStats.tasksCompleted + tasksCompletedToAdd
        };

        await updateDoc(this.userRef, {
            stats: newStats
        });

        return newStats;
    }

    async updateUserPassword(newPassword) {
        console.log("[DataStore] Updating user password.");
        await updateDoc(this.userRef, {
            password: newPassword,
            isFirstLogin: false
        });
    }

    async updateUserProfile(updates) {
        console.log("[DataStore] Updating user profile:", updates);
        await updateDoc(this.userRef, updates);
    }

    // ===== CHAT SESSIONS =====
    async createChatSession(title = "New Chat") {
        const sessionId = Date.now().toString();
        const session = {
            id: sessionId,
            title: title,
            createdAt: new Date().toISOString(),
            messages: []
        };

        await updateDoc(this.userRef, {
            chatSessions: arrayUnion(session)
        });

        console.log("[DataStore] Created new chat session:", sessionId);
        return sessionId;
    }

    async getChatSessions() {
        const data = await this.getData();
        return data.chatSessions || [];
    }

    async getChatSession(sessionId) {
        const sessions = await this.getChatSessions();
        return sessions.find(s => s.id === sessionId);
    }

    async addMessageToSession(sessionId, message) {
        console.log(`[DataStore] Adding message to session ${sessionId}:`, message);
        const data = await this.getData();
        const sessions = data.chatSessions || [];
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);

        if (sessionIndex !== -1) {
            sessions[sessionIndex].messages.push(message);
            await updateDoc(this.userRef, {
                chatSessions: sessions
            });
        }
    }

    async deleteChatSession(sessionId) {
        console.log(`[DataStore] Deleting chat session: ${sessionId}`);
        const data = await this.getData();
        const sessions = data.chatSessions || [];
        const updatedSessions = sessions.filter(s => s.id !== sessionId);

        await updateDoc(this.userRef, {
            chatSessions: updatedSessions
        });
    }

    async renameChatSession(sessionId, newTitle) {
        const data = await this.getData();
        const sessions = data.chatSessions || [];
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);

        if (sessionIndex !== -1) {
            sessions[sessionIndex].title = newTitle;
            await updateDoc(this.userRef, {
                chatSessions: sessions
            });
        }
    }

    // ===== TEACHER QUESTIONS =====
    async askTeacher(question) {
        console.log("[DataStore] Asking teacher:", question);
        const questionData = {
            id: Date.now(),
            teacherName: question.teacherName,
            subject: question.subject,
            question: question.question,
            status: "pending",
            askedAt: new Date().toISOString(),
            answer: null,
            answeredAt: null
        };

        await updateDoc(this.userRef, {
            teacherQuestions: arrayUnion(questionData)
        });

        // Award XP for asking a question
        await this.updateUserStats(5, 0); // 5 XP for asking a question

        console.log("[DataStore] Question submitted and 5 XP awarded.");
        return questionData;
    }

    async getTeacherQuestions() {
        const data = await this.getData();
        return data.teacherQuestions || [];
    }

    async answerTeacherQuestion(questionId, answer) {
        console.log(`[DataStore] Answering question ${questionId}`);
        const data = await this.getData();
        const questions = data.teacherQuestions || [];
        const questionIndex = questions.findIndex(q => q.id === questionId);

        if (questionIndex !== -1) {
            questions[questionIndex].answer = answer;
            questions[questionIndex].status = "answered";
            questions[questionIndex].answeredAt = new Date().toISOString();

            await updateDoc(this.userRef, {
                teacherQuestions: questions
            });
        }
    }

    // Legacy chat history methods (for backward compatibility)
    async getChatHistory() {
        const data = await this.getData();
        return data.chatHistory || [];
    }

    async addChatMessage(msg) {
        console.log("[DataStore] Saving chat message:", msg);
        await updateDoc(this.userRef, {
            chatHistory: arrayUnion(msg)
        });
    }

    async clearChatHistory() {
        console.log("[DataStore] Clearing chat history.");
        await updateDoc(this.userRef, {
            chatHistory: []
        });
    }
    // ===== CALENDAR EVENTS =====
    async getCalendarEvents() {
        const data = await this.getData();
        return data.calendarEvents || [];
    }

    async addCalendarEvent(event) {
        event.id = Date.now();
        await updateDoc(this.userRef, {
            calendarEvents: arrayUnion(event)
        });
    }

    async deleteCalendarEvent(eventId) {
        const data = await this.getData();
        const events = (data.calendarEvents || []).filter(e => e.id !== eventId);
        await updateDoc(this.userRef, {
            calendarEvents: events
        });
    }

    // ===== DISCUSSION GROUPS =====
    async getDiscussionGroups() {
        const data = await this.getData();
        return data.discussionGroups || [];
    }

    async createDiscussionGroup(group) {
        group.id = Date.now().toString();
        group.createdAt = new Date().toISOString();
        group.members = 1;
        await updateDoc(this.userRef, {
            discussionGroups: arrayUnion(group)
        });
    }

    // ===== HOBBIES =====
    async getUserHobbies() {
        const data = await this.getData();
        return data.hobbies || [];
    }

    async addUserHobby(hobby) {
        await updateDoc(this.userRef, {
            hobbies: arrayUnion(hobby)
        });
    }

    async removeUserHobby(hobby) {
        await updateDoc(this.userRef, {
            hobbies: arrayRemove(hobby)
        });
    }

    // ===== BADGES =====
    async getUserBadges() {
        const data = await this.getData();
        return data.badges || [];
    }

    async awardBadge(badgeId, points = 50) {
        await updateDoc(this.userRef, {
            badges: arrayUnion(badgeId)
        });
        // Award XP for badge
        if (points > 0) {
            await this.updateUserStats(points, 0);
        }
    }

    // ===== TEACHER DASHBOARD =====
    async getAllStudentQuestions() {
        try {
            const usersRef = collection(db, "users");
            const querySnapshot = await getDocs(usersRef);

            let allQuestions = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.teacherQuestions) {
                    data.teacherQuestions.forEach(q => {
                        allQuestions.push({
                            ...q,
                            studentName: data.name,
                            studentId: doc.id
                        });
                    });
                }
            });

            return allQuestions;
        } catch (e) {
            console.error("Error fetching all questions:", e);
            return [];
        }
    }

    async answerStudentQuestion(questionId, studentId, answer) {
        const studentRef = doc(db, "users", studentId);
        const studentData = await getDoc(studentRef);
        const questions = studentData.data().teacherQuestions || [];

        const questionIndex = questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
            questions[questionIndex].answer = answer;
            questions[questionIndex].status = "answered";
            questions[questionIndex].answeredAt = new Date().toISOString();

            await updateDoc(studentRef, {
                teacherQuestions: questions
            });
        }
    }

    async getAllStudents() {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("role", "==", "student"));
            const querySnapshot = await getDocs(q);

            let students = [];
            querySnapshot.forEach((doc) => {
                students.push(doc.data());
            });
            return students;
        } catch (e) {
            console.error("Error fetching students:", e);
            return [];
        }
    }

    // ===== PARENTAL CONTROLS =====
    async getChildData(childId) {
        // In a real app, this would fetch specific child's data
        // For demo, return current user's data formatted for parent view
        const data = await this.getData();
        return {
            totalStudyTime: data.stats?.focusTime || 0,
            tasksCompleted: data.stats?.tasksCompleted || 0,
            points: data.stats?.points || 0,
            streak: data.stats?.streak || 0,
            recentActivity: data.recentActivity || [],
            subjectPerformance: data.subjectPerformance || [
                { name: 'Mathematics', score: 85 },
                { name: 'Science', score: 92 },
                { name: 'English', score: 88 },
                { name: 'Social Science', score: 90 }
            ]
        };
    }

    async getChildDetailedActivity(childId) {
        const data = await this.getData();
        return data.detailedActivity || [];
    }

    async getParentalSettings() {
        const data = await this.getData();
        return data.parentalSettings || {
            screenTimeLimit: 120,
            bedtime: '22:00',
            weekendRelax: false,
            restrictChat: false,
            restrictGroups: false,
            requireApprovalForQuestions: false
        };
    }

    async updateParentalSettings(settings) {
        await updateDoc(this.userRef, {
            parentalSettings: settings
        });
    }

    // ===== NOTIFICATIONS =====
    async getNotifications() {
        const data = await this.getData();
        return data.notifications || [];
    }

    async addNotification(notification) {
        notification.id = Date.now();
        notification.read = false;
        notification.timestamp = new Date().toISOString();
        await updateDoc(this.userRef, {
            notifications: arrayUnion(notification)
        });
    }

    async markNotificationRead(notificationId) {
        const data = await this.getData();
        const notifications = data.notifications || [];
        const index = notifications.findIndex(n => n.id === notificationId);

        if (index !== -1) {
            notifications[index].read = true;
            await updateDoc(this.userRef, {
                notifications: notifications
            });
        }
    }

    async clearAllNotifications() {
        await updateDoc(this.userRef, {
            notifications: []
        });
    }

    // ===== GROUP CHAT MESSAGES =====
    async getGroupMessages(groupId) {
        const data = await this.getData();
        const allGroupMessages = data.groupMessages || {};
        return allGroupMessages[groupId] || [];
    }

    async addGroupMessage(message) {
        const groupId = message.groupId;
        const data = await this.getData();
        const allGroupMessages = data.groupMessages || {};

        if (!allGroupMessages[groupId]) {
            allGroupMessages[groupId] = [];
        }

        if (!message.id) message.id = Date.now();
        if (!message.timestamp) message.timestamp = new Date().toISOString();

        allGroupMessages[groupId].push(message);

        await updateDoc(this.userRef, {
            groupMessages: allGroupMessages
        });
    }

    async addMemberToGroup(groupId, username) {
        // Normalize username to ID format (lowercase, underscores)
        const userId = username.toLowerCase().replace(/\s+/g, '_');
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            alert("User not found! Please check the username.");
            return false;
        }

        const data = await this.getData();
        const groups = data.discussionGroups || [];
        const groupIndex = groups.findIndex(g => g.id === groupId);

        if (groupIndex !== -1) {
            // In a real app, we would add the user ID to a members array
            // For this demo, we just increment the count
            groups[groupIndex].members = (groups[groupIndex].members || 0) + 1;

            await updateDoc(this.userRef, {
                discussionGroups: groups
            });

            // Also add a system message to the chat
            await this.addGroupMessage({
                groupId,
                text: `${userSnap.data().name} (@${userSnap.data().username}) has joined the group.`,
                senderId: 'system',
                senderName: 'System',
                type: 'system'
            });
            return true;
        }
        return false;
    }
}
