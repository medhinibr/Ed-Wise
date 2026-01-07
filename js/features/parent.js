export async function renderChildProgress(container, db) {
    // For demo, we use the current user's ID as the "child"
    const childId = db.userId;
    const data = await db.getChildData(childId);

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="card stat-card">
                <div class="stat-icon blue"><i class="fa-solid fa-clock"></i></div>
                <div class="stat-info">
                    <h2>${Math.round(data.totalStudyTime / 60)}h</h2>
                    <p>Study Time</p>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon green"><i class="fa-solid fa-check-circle"></i></div>
                <div class="stat-info">
                    <h2>${data.tasksCompleted}</h2>
                    <p>Tasks Done</p>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon purple"><i class="fa-solid fa-star"></i></div>
                <div class="stat-info">
                    <h2>${data.points}</h2>
                    <p>Total XP</p>
                </div>
            </div>

            <div class="card" style="grid-column: span 2;">
                <div class="card-header">
                    <h3>Subject Performance</h3>
                </div>
                <div style="padding: 20px;">
                    ${data.subjectPerformance.map(subj => `
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>${subj.name}</span>
                                <span>${subj.score}%</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                                <div style="width: ${subj.score}%; height: 100%; background: var(--primary); border-radius: 4px;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

export async function renderChildActivity(container, db) {
    const childId = db.userId;
    const activities = await db.getChildDetailedActivity(childId);

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fa-solid fa-eye"></i> Activity Monitor</h3>
            </div>
            <div style="padding: 20px;">
                <div class="activity-timeline" style="border-left: 2px solid rgba(255,255,255,0.1); padding-left: 20px; margin-left: 10px;">
                    ${activities.length === 0 ? '<p style="color: var(--text-muted);">No recent activity recorded.</p>' : ''}
                    ${activities.map(act => `
                        <div style="position: relative; margin-bottom: 25px;">
                            <div style="position: absolute; left: -26px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: var(--primary); border: 2px solid #1a1a2e;"></div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">
                                ${new Date(act.timestamp).toLocaleString()}
                            </div>
                            <div style="font-weight: 500;">${act.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

export async function renderParentalControls(container, db) {
    const settings = await db.getParentalSettings();

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fa-solid fa-lock"></i> Parental Controls</h3>
            </div>
            <div style="padding: 20px;">
                <div style="display: grid; gap: 20px;">
                    <div class="control-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                        <div>
                            <div style="font-weight: 600; margin-bottom: 5px;">Screen Time Limit</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">Daily usage limit in minutes</div>
                        </div>
                        <input type="number" id="screenTimeLimit" value="${settings.screenTimeLimit}" style="width: 80px; padding: 8px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white;">
                    </div>

                    <div class="control-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                        <div>
                            <div style="font-weight: 600; margin-bottom: 5px;">Bedtime</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">App locks after this time</div>
                        </div>
                        <input type="time" id="bedtime" value="${settings.bedtime}" style="padding: 8px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white;">
                    </div>

                    <div class="control-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                        <div>
                            <div style="font-weight: 600; margin-bottom: 5px;">Weekend Relax Mode</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">Allow extra time on weekends</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="weekendRelax" ${settings.weekendRelax ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>

                    <div class="control-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                        <div>
                            <div style="font-weight: 600; margin-bottom: 5px;">Restrict Chat</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">Disable AI chat features</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="restrictChat" ${settings.restrictChat ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>

                    <button id="saveSettingsBtn" class="cta-btn" style="margin-top: 10px;">Save Settings</button>
                </div>
            </div>
        </div>
    `;

    // Add CSS for switch if not present
    if (!document.getElementById('switch-style')) {
        const style = document.createElement('style');
        style.id = 'switch-style';
        style.textContent = `
            .switch { position: relative; display: inline-block; width: 50px; height: 24px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: var(--primary); }
            input:checked + .slider:before { transform: translateX(26px); }
        `;
        document.head.appendChild(style);
    }

    document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
        const newSettings = {
            screenTimeLimit: parseInt(document.getElementById('screenTimeLimit').value),
            bedtime: document.getElementById('bedtime').value,
            weekendRelax: document.getElementById('weekendRelax').checked,
            restrictChat: document.getElementById('restrictChat').checked
        };

        await db.updateParentalSettings(newSettings);
        alert("Settings saved successfully!");
    });
}
