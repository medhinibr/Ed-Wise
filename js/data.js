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

    // Leaderboard
    async getLeaderboard() {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef);
            const querySnapshot = await getDocs(q);

            let leaderboard = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                leaderboard.push({
                    id: doc.id,
                    name: data.name,
                    points: data.stats ? data.stats.points : 0,
                    avatar: data.name.charAt(0).toUpperCase()
                });
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

    // ===== CHAT SESSIONS =====
    async createChatSession(title = "New Chat") {
        const sessionId = Date.now().toString();
        const session = {
            id: sessionId,
            title: title,
            createdAt: new Date().toISOString(),
            messages: [
                { sender: "bot", text: "Hello! I'm your AI study assistant. How can I help you today?" }
            ]
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

        // Award 5 XP for asking a question
        await this.updateUserStats(5, 0); 

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
}
