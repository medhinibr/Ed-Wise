export class ChatManager {
    constructor(db, appInstance) {
        this.db = db;
        this.app = appInstance;
        this.currentChatId = null;
        this.processingQuery = false;
    }

    async createNewSession() {
        // Create a new chat session (in-memory, not saved to DB yet)
        this.currentChatId = `temp_${Date.now()}`;
        this.tempSession = {
            id: this.currentChatId,
            title: "New Chat",
            createdAt: new Date().toISOString(),
            messages: [],
            isTemp: true
        };
    }

    async render(container) {
        // Create or get current session
        if (!this.currentChatId) {
            const sessions = await this.db.getChatSessions();
            if (sessions.length === 0) {
                // Create first session
                this.currentChatId = await this.db.createChatSession("New Chat");
            } else {
                // Use most recent session
                this.currentChatId = sessions[sessions.length - 1].id;
            }
        }

        const sessions = await this.db.getChatSessions();

        // Filter out empty sessions (no messages) from sidebar display
        const nonEmptySessions = sessions.filter(s => s.messages && s.messages.length > 0);

        // Get current session (could be temp or from DB)
        let currentSession = sessions.find(s => s.id === this.currentChatId);
        if (!currentSession && this.tempSession && this.tempSession.id === this.currentChatId) {
            currentSession = this.tempSession;
        }
        const messages = currentSession ? currentSession.messages : [];

        // Flat List Rendering
        const renderSessionItem = (session) => {
            const isSelected = session.id === this.currentChatId;
            return `
                <div class="chat-session-wrapper">
                    <div class="chat-session-item ${isSelected ? 'active' : ''}" 
                         data-session-id="${session.id}"
                         style="padding: 10px 15px; border-radius: 8px; cursor: pointer; 
                                background: ${isSelected ? 'rgba(var(--primary-rgb), 0.15)' : 'transparent'}; 
                                color: ${isSelected ? 'var(--primary)' : 'var(--text-muted)'};
                                display: flex; align-items: center; justify-content: space-between;
                                margin-bottom: 5px; transition: all 0.2s; position: relative;">
                        <span class="session-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9rem; flex: 1;">
                            ${session.title}
                        </span>
                        <div class="session-actions" style="display: ${isSelected ? 'flex' : 'none'}; gap: 5px; align-items: center;">
                            <button class="delete-session-btn" data-session-id="${session.id}" title="Delete"
                                    style="background: none; border: none; color: #ff4444; cursor: pointer; padding: 2px; opacity: 0.7; transition: opacity 0.2s;">
                                <i class="fa-solid fa-trash" style="font-size: 0.8rem;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        };

        const sidebarHTML = `
            <div class="card" style="width: 260px; padding: 15px; display: flex; flex-direction: column; background: var(--bg-secondary); border-right: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h4 style="margin: 0; font-size: 1rem; font-weight: 600;">Conversations</h4>
                    <button id="newChatBtn" class="control-btn" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--primary); color: white;">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
                <div id="chatSessionsList" style="flex: 1; overflow-y: auto; margin: 0 -10px; padding: 0 10px;">
                    ${nonEmptySessions.map(s => renderSessionItem(s)).join('')}
                </div>
            </div>
        `;

        let mainContentHTML = '';
        if (!messages || messages.length === 0) {
            // Welcome UI
            mainContentHTML = `
                <div class="card" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; background: var(--bg-primary);">
                    <div style="text-align: center; max-width: 600px; width: 100%;">
                        <div style="margin-bottom: 40px;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 10px 20px rgba(var(--primary-rgb), 0.3);">
                                <i class="fa-solid fa-robot" style="font-size: 40px; color: white;"></i>
                            </div>
                            <h2 style="font-size: 2.5rem; margin-bottom: 15px; font-weight: 700; background: linear-gradient(to right, #fff, #ccc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">How can I help you?</h2>
                            <p style="color: var(--text-muted); font-size: 1.1rem;">I'm your AI study assistant. Ask me anything about your subjects.</p>
                        </div>
                        
                        <div style="position: relative; margin-bottom: 30px;">
                            <input type="text" id="welcomeInput" placeholder="Ask a question..." 
                                   style="width: 100%; padding: 20px 25px; padding-right: 60px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 1.1rem; outline: none; box-shadow: 0 4px 20px rgba(0,0,0,0.2); transition: all 0.3s;">
                            <button id="welcomeSendBtn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 45px; height: 45px; border-radius: 50%; border: none; background: var(--primary); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;">
                                <i class="fa-solid fa-arrow-up"></i>
                            </button>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            <button class="suggestion-chip" style="padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: pointer; transition: all 0.2s;" onclick="document.getElementById('welcomeInput').value = 'Explain Calculus derivatives'; document.getElementById('welcomeSendBtn').click();">Calculus derivatives</button>
                            <button class="suggestion-chip" style="padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: pointer; transition: all 0.2s;" onclick="document.getElementById('welcomeInput').value = 'History of Rome'; document.getElementById('welcomeSendBtn').click();">History of Rome</button>
                            <button class="suggestion-chip" style="padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: pointer; transition: all 0.2s;" onclick="document.getElementById('welcomeInput').value = 'Physics formulas'; document.getElementById('welcomeSendBtn').click();">Physics formulas</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Standard Chat UI
            mainContentHTML = `
                <div class="card" style="flex: 1; display: flex; flex-direction: column; padding: 0; background: var(--bg-primary);">
                    <div class="chat-header" style="padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="margin: 0; font-size: 1.1rem;">${currentSession ? currentSession.title : 'Chat'}</h4>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button id="renameChatBtn" class="control-btn btn-secondary" title="Rename" style="padding: 8px;">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button id="clearChatBtn" class="control-btn btn-secondary" title="Clear Chat" style="padding: 8px;">
                                <i class="fa-solid fa-eraser"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div id="chatMessages" style="flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
                        ${messages.map(msg => `
                            <div class="message ${msg.sender}" style="display: flex; gap: 15px; ${msg.sender === 'user' ? 'justify-content: flex-end;' : ''}">
                                ${msg.sender === 'bot' ? `
                                    <div class="bot-avatar" style="width: 35px; height: 35px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 10px rgba(var(--primary-rgb), 0.3);">
                                        <i class="fa-solid fa-robot" style="font-size: 14px; color: white;"></i>
                                    </div>
                                ` : ''}
                                <div class="message-bubble" style="max-width: 75%; padding: 15px 20px; border-radius: 18px; 
                                     background: ${msg.sender === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; 
                                     color: ${msg.sender === 'user' ? 'white' : 'var(--text-primary)'};
                                     border-bottom-${msg.sender === 'user' ? 'right' : 'left'}-radius: 4px;
                                     box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                    <div style="margin: 0; line-height: 1.6; ${msg.sender === 'user' ? 'white-space: pre-wrap;' : ''}">${msg.text}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="chat-input-area" style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; gap: 12px; align-items: center; background: rgba(255,255,255,0.03); padding: 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <input type="file" id="fileInput" style="display: none;">
                            <button id="attachFileBtn" class="control-btn" style="padding: 10px; color: var(--text-muted); background: transparent;">
                                <i class="fa-solid fa-paperclip"></i>
                            </button>
                            <input type="text" id="chatInput" placeholder="Type a message..." style="flex: 1; padding: 10px; border: none; background: transparent; color: white; outline: none; font-size: 1rem;">
                            <button id="sendBtn" class="cta-btn" style="padding: 10px 20px; border-radius: 8px;">
                                <i class="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; height: calc(100vh - 100px);">
                <div style="display: flex; gap: 0; flex: 1; overflow: hidden; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                    ${sidebarHTML}
                    ${mainContentHTML}
                </div>
                <div style="text-align: center; padding: 10px; font-size: 0.75rem; color: var(--text-muted); opacity: 0.7;">
                    Ed-wise AI can make mistakes. Check important info. See Cookie Preferences.
                </div>
            </div>
        `;

        this.setupListeners(container, currentSession);
        this.scrollToBottom();
    }

    setupListeners(container, currentSession) {
        document.getElementById('newChatBtn').addEventListener('click', async () => {
            // No prompt, just create new chat
            this.currentChatId = await this.db.createChatSession("New Chat");
            await this.render(container);
        });

        document.querySelectorAll('.chat-session-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (!e.target.closest('.delete-session-btn')) {
                    this.currentChatId = item.dataset.sessionId;
                    await this.render(container);
                }
            });

            // Show actions on hover
            item.addEventListener('mouseenter', () => {
                const actions = item.querySelector('.session-actions');
                if (actions) actions.style.display = 'flex';
            });
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) {
                    const actions = item.querySelector('.session-actions');
                    if (actions) actions.style.display = 'none';
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
                    await this.render(container);
                }
            });
        });

        // Welcome UI Listeners
        const welcomeInput = document.getElementById('welcomeInput');
        const welcomeSendBtn = document.getElementById('welcomeSendBtn');
        if (welcomeInput && welcomeSendBtn) {
            welcomeSendBtn.addEventListener('click', () => this.sendMessage(container, 'welcomeInput'));
            welcomeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage(container, 'welcomeInput');
            });
        }

        // Standard Chat Listeners
        const renameBtn = document.getElementById('renameChatBtn');
        if (renameBtn) {
            renameBtn.addEventListener('click', async () => {
                const newTitle = prompt("Enter new title:", currentSession.title);
                if (newTitle) {
                    await this.db.renameChatSession(this.currentChatId, newTitle);
                    await this.render(container);
                }
            });
        }

        const clearBtn = document.getElementById('clearChatBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (confirm("Clear all messages in this chat?")) {
                    await this.db.deleteChatSession(this.currentChatId);
                    this.currentChatId = await this.db.createChatSession(currentSession.title);
                    await this.render(container);
                }
            });
        }

        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage(container));
        }

        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage(container);
            });
        }

        const attachBtn = document.getElementById('attachFileBtn');
        if (attachBtn) {
            attachBtn.addEventListener('click', () => document.getElementById('fileInput').click());
            document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        }
    }

    async sendMessage(container, inputId = 'chatInput') {
        const input = document.getElementById(inputId);
        const text = input.value.trim();
        if (!text) return;

        // If this is a temp session, convert it to a real session first
        if (this.tempSession && this.tempSession.id === this.currentChatId) {
            // Create the actual session in the database
            const realSessionId = await this.db.createChatSession("New Chat");
            this.currentChatId = realSessionId;
            this.tempSession = null;
        }

        // Add User Message
        await this.db.addMessageToSession(this.currentChatId, { sender: 'user', text: text });
        input.value = '';

        // Check if we need to rename the chat
        const session = await this.db.getChatSession(this.currentChatId);
        if (session && (session.messages.length === 1 || session.title === "New Chat")) {
            this.generateAndSetTitle(this.currentChatId, text);
        }

        await this.render(container);

        // Get AI Response
        this.processingQuery = true;
        try {
            const response = await this.app.getAIResponse(text);
            await this.db.addMessageToSession(this.currentChatId, { sender: 'bot', text: response });
            await this.render(container);
        } catch (error) {
            console.error("Error getting AI response:", error);
            await this.db.addMessageToSession(this.currentChatId, { sender: 'bot', text: "Sorry, I'm having trouble connecting. Error: " + error.message });
            await this.render(container);
        } finally {
            this.processingQuery = false;
        }
    }

    async generateAndSetTitle(sessionId, userText) {
        try {
            const prompt = `Generate a very short, concise (max 3-4 words) title for a conversation that starts with this message: "${userText}". Return ONLY the title, no quotes.`;
            const title = await this.app.callGroqAPI(prompt);
            if (title) {
                const cleanTitle = title.replace(/"/g, '').trim();
                await this.db.renameChatSession(sessionId, cleanTitle);

                // Update sidebar title if visible
                const sidebarItemTitle = document.querySelector(`.chat-session-item[data-session-id="${sessionId}"] .session-title`);
                if (sidebarItemTitle) {
                    sidebarItemTitle.textContent = cleanTitle;
                }
            }
        } catch (e) {
            console.error("Error generating title:", e);
        }
    }

    handleFileUpload(e) {
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
    }

    scrollToBottom() {
        const chat = document.getElementById('chatMessages');
        if (chat) chat.scrollTop = chat.scrollHeight;
    }
}
