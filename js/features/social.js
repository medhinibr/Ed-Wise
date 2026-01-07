export async function renderGroupDiscussion(container, db) {
    const groups = await db.getDiscussionGroups() || [];

    container.innerHTML = `
        <div style="display: grid; gap: 20px;">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-users"></i> Create New Group</h3>
                </div>
                <div style="padding: 20px;">
                    <input type="text" id="groupName" placeholder="Group Name" style="width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white;">
                    <textarea id="groupDesc" placeholder="Description" style="width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; min-height: 60px; font-family: inherit;"></textarea>
                    <button id="createGroupBtn" class="cta-btn"><i class="fa-solid fa-plus"></i> Create Group</button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-comments"></i> My Discussion Groups</h3>
                </div>
                <div style="padding: 20px;">
                    <div style="display: grid; gap: 15px;">
                        ${groups.map(group => `
                            <div class="group-card" data-group-id="${group.id}" data-group-name="${group.name}" style="padding: 20px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.3s;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                    <div>
                                        <h4 style="margin: 0 0 5px 0;">${group.name}</h4>
                                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">${group.description}</p>
                                    </div>
                                    <span style="padding: 5px 12px; border-radius: 15px; font-size: 0.75rem; background: rgba(var(--primary-rgb), 0.2); color: var(--primary);">
                                        ${group.members || 0} members
                                    </span>
                                </div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">
                                    <i class="fa-regular fa-clock"></i> Created ${new Date(group.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        `).join('')}
                        ${groups.length === 0 ? '<p style="text-align: center; color: var(--text-muted); padding: 30px 0;">No discussion groups yet. Create one above!</p>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('createGroupBtn').addEventListener('click', async () => {
        const name = document.getElementById('groupName').value.trim();
        const description = document.getElementById('groupDesc').value.trim();

        if (!name) {
            alert('Please enter a group name');
            return;
        }

        await db.createDiscussionGroup({ name, description });
        renderGroupDiscussion(container, db);
    });

    document.querySelectorAll('.group-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.background = 'rgba(var(--primary-rgb), 0.1)';
            card.style.borderColor = 'var(--primary)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.background = 'rgba(255,255,255,0.05)';
            card.style.borderColor = 'rgba(255,255,255,0.1)';
        });
        card.addEventListener('click', () => {
            const groupId = card.dataset.groupId;
            const groupName = card.dataset.groupName;
            showGroupChat(groupId, groupName, db);
        });
    });
}

async function showGroupChat(groupId, groupName, db) {
    const modalContainer = document.getElementById('modalContainer');
    const currentUser = JSON.parse(localStorage.getItem('edwise_user'));

    modalContainer.innerHTML = `
        <div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div class="modal-content" style="background: #1a1a2e; padding: 0; border-radius: 20px; width: 90%; max-width: 800px; height: 80vh; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column;">
                <!-- Chat Header -->
                <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0 0 5px 0;"><i class="fa-solid fa-users"></i> ${groupName}</h3>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">Group ID: ${groupId}</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="addMemberBtn" class="cta-btn btn-secondary" style="padding: 8px 15px; font-size: 0.8rem;">
                            <i class="fa-solid fa-user-plus"></i> Add Member
                        </button>
                        <button id="closeGroupChatBtn" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; opacity: 0.7; transition: opacity 0.2s;">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- Chat Messages -->
                <div id="groupChatMessages" style="flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px;">
                    <div style="text-align: center; padding: 20px;">
                        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                    </div>
                </div>

                <!-- Chat Input -->
                <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="file" id="groupFileInput" hidden>
                        <button id="attachFileBtn" class="control-btn btn-secondary" style="padding: 12px;">
                            <i class="fa-solid fa-paperclip"></i>
                        </button>
                        <input type="text" id="groupChatInput" placeholder="Type your message..." style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; outline: none;">
                        <button id="sendGroupMsgBtn" class="cta-btn" style="padding: 12px 20px;">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const messagesContainer = document.getElementById('groupChatMessages');
    const input = document.getElementById('groupChatInput');
    const sendBtn = document.getElementById('sendGroupMsgBtn');
    const addMemberBtn = document.getElementById('addMemberBtn');
    const attachFileBtn = document.getElementById('attachFileBtn');
    const fileInput = document.getElementById('groupFileInput');
    let pollInterval;

    // Add Member Logic
    addMemberBtn.addEventListener('click', async () => {
        const username = prompt("Enter the username to add:");
        if (username) {
            const success = await db.addMemberToGroup(groupId, username);
            if (success) {
                alert(`User ${username} added to the group!`);
            }
        }
    });

    // File Attachment Logic
    attachFileBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            await sendMessage(null, file);
            fileInput.value = ''; // Reset
        }
    });

    async function loadMessages() {
        if (!document.getElementById('groupChatMessages')) {
            clearInterval(pollInterval);
            return;
        }

        const messages = await db.getGroupMessages(groupId);

        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <i class="fa-solid fa-comments" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = messages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            let content = msg.text;

            if (msg.type === 'file') {
                content = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-file-alt" style="font-size: 1.5rem;"></i>
                        <div>
                            <div style="font-weight: bold;">${msg.fileName}</div>
                            <div style="font-size: 0.8rem; opacity: 0.7;">Shared File</div>
                        </div>
                        <a href="${msg.fileData || '#'}" download="${msg.fileName}" style="color: inherit; margin-left: auto;"><i class="fa-solid fa-download"></i></a>
                    </div>
                `;
            }

            return `
                <div style="display: flex; gap: 10px; ${isMe ? 'flex-direction: row-reverse;' : ''}">
                    <div style="width: 35px; height: 35px; border-radius: 50%; background: ${isMe ? 'var(--primary)' : '#444'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">
                        ${msg.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div style="max-width: 70%;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 3px; ${isMe ? 'text-align: right;' : ''}">
                            ${isMe ? 'You' : msg.senderName} • ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style="background: ${isMe ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)'}; padding: 12px; border-radius: 12px; border: 1px solid ${isMe ? 'var(--primary)' : 'rgba(255,255,255,0.1)'};">
                            ${content}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Initial load
    await loadMessages();

    // Poll for new messages every 3 seconds
    pollInterval = setInterval(loadMessages, 3000);

    async function sendMessage(text, file = null) {
        if (!text && !file) return;

        let fileData = null;
        if (file) {
            if (file.size > 1024 * 1024) {
                alert("File is too large. Max 1MB allowed.");
                return;
            }
            fileData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        const msg = {
            groupId,
            text: text || `Sent a file: ${file.name}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            timestamp: new Date().toISOString(),
            type: file ? 'file' : 'text',
            fileName: file ? file.name : null,
            fileData: fileData
        };

        await db.addGroupMessage(msg);
        input.value = '';
        loadMessages();
    }

    sendBtn.addEventListener('click', () => sendMessage(input.value.trim()));
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage(input.value.trim());
    });

    document.getElementById('closeGroupChatBtn').addEventListener('click', () => {
        clearInterval(pollInterval);
        modalContainer.innerHTML = '';
    });

    document.querySelector('.modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            clearInterval(pollInterval);
            modalContainer.innerHTML = '';
        }
    });
}

export async function renderLeaderboard(container, db) {
    const users = await db.getLeaderboard();
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
