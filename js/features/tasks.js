export async function renderTasks(container, db, appInstance) {
    const tasks = await db.getTasks();
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
    document.getElementById('addTaskBtn').addEventListener('click', () => handleAddTask(db, container));
    document.getElementById('newTaskTitle').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('newTaskDesc').focus();
        }
    });

    document.querySelectorAll('.task-check').forEach(el => {
        el.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            toggleTask(id, db, container, appInstance);
        });
    });

    document.querySelectorAll('.delete-task-btn').forEach(el => {
        el.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            if (confirm('Are you sure you want to delete this task?')) {
                await db.deleteTask(id);
                renderTasks(container, db, appInstance);
            }
        });
    });
}

async function handleAddTask(db, container) {
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
        await db.addTask({
            title: title,
            description: description,
            subject: "General",
            dueDate: new Date().toISOString().split('T')[0],
            priority: "medium",
            completed: false
        });
        // Re-render tasks
        // Note: We need to pass appInstance if we want to re-bind listeners correctly, 
        // but for internal re-renders we might need to pass it down.
        // For simplicity, we'll assume the caller handles the context or we pass it.
        // Here we just re-call renderTasks but we need 'appInstance' which isn't passed to handleAddTask.
        // Let's modify handleAddTask signature.
        const appInstance = window.app; // Fallback or pass it
        renderTasks(container, db, appInstance);
    } catch (error) {
        console.error("Error adding task:", error);
        alert("Failed to add task. Please try again.");
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

async function toggleTask(id, db, container, appInstance) {
    await db.toggleTask(id);
    await db.updateUserStats(10, 1);
    if (appInstance && appInstance.updateUserInfo) {
        appInstance.updateUserInfo();
    }
    renderTasks(container, db, appInstance);
}
