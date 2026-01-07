export async function renderHobbies(container, db) {
    const userHobbies = await db.getUserHobbies();

    const allHobbies = [
        { id: 'drawing', name: 'Drawing & Painting', icon: 'fa-palette' },
        { id: 'music', name: 'Music & Instruments', icon: 'fa-music' },
        { id: 'coding', name: 'Coding & Robotics', icon: 'fa-code' },
        { id: 'reading', name: 'Reading & Writing', icon: 'fa-book-open' },
        { id: 'sports', name: 'Sports & Fitness', icon: 'fa-running' },
        { id: 'chess', name: 'Chess & Strategy', icon: 'fa-chess' }
    ];

    const competitions = [
        { title: "National Art Contest 2025", hobby: "drawing", date: "Dec 15, 2025", prize: "₹5000", link: "#" },
        { title: "Junior Coder Hackathon", hobby: "coding", date: "Dec 20, 2025", prize: "₹10000", link: "#" },
        { title: "Inter-School Chess Championship", hobby: "chess", date: "Jan 5, 2026", prize: "Trophy", link: "#" }
    ];

    container.innerHTML = `
        <div style="display: grid; gap: 20px;">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-shapes"></i> Select Your Hobbies</h3>
                </div>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
                        ${allHobbies.map(hobby => `
                            <div class="hobby-card ${userHobbies.includes(hobby.id) ? 'selected' : ''}" 
                                 data-id="${hobby.id}"
                                 style="padding: 15px; border-radius: 12px; border: 1px solid ${userHobbies.includes(hobby.id) ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; background: ${userHobbies.includes(hobby.id) ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)'}; cursor: pointer; text-align: center; transition: all 0.2s;">
                                <i class="fa-solid ${hobby.icon}" style="font-size: 2rem; margin-bottom: 10px; color: ${userHobbies.includes(hobby.id) ? 'var(--primary)' : 'var(--text-muted)'};"></i>
                                <div style="font-weight: 500;">${hobby.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-trophy"></i> Upcoming Competitions</h3>
                </div>
                <div style="padding: 20px;">
                    <div style="display: grid; gap: 15px;">
                        ${competitions.filter(c => userHobbies.includes(c.hobby) || userHobbies.length === 0).map(comp => `
                            <div style="padding: 15px; border-radius: 12px; background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 5px;">${comp.title}</div>
                                    <div style="font-size: 0.9rem; color: var(--text-muted);">
                                        <i class="fa-regular fa-calendar"></i> ${comp.date} • <i class="fa-solid fa-award"></i> Prize: ${comp.prize}
                                    </div>
                                </div>
                                <button class="cta-btn register-btn" data-competition="${comp.title}" style="padding: 8px 20px; font-size: 0.9rem;">Register</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll('.hobby-card').forEach(card => {
        card.addEventListener('click', async () => {
            const id = card.dataset.id;
            if (card.classList.contains('selected')) {
                await db.removeUserHobby(id);
            } else {
                await db.addUserHobby(id);
            }
            renderHobbies(container, db);
        });
    });

    // Register button functionality
    document.querySelectorAll('.register-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const competition = btn.dataset.competition;

            // Show registration modal
            const modalContainer = document.getElementById('modalContainer');
            modalContainer.innerHTML = `
                <div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;">
                    <div class="modal-content" style="background: #1a1a2e; padding: 30px; border-radius: 20px; width: 90%; max-width: 500px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <i class="fa-solid fa-trophy" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
                            <h3 style="margin-bottom: 10px;">Register for Competition</h3>
                            <p style="color: var(--text-muted);">${competition}</p>
                        </div>
                        
                        <div style="background: rgba(76, 175, 80, 0.1); border-left: 3px solid #4CAF50; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="margin: 0; color: #4CAF50; font-weight: 500;">
                                <i class="fa-solid fa-check-circle"></i> Registration Successful!
                            </p>
                            <p style="margin: 10px 0 0 0; font-size: 0.9rem; color: var(--text-muted);">
                                You will receive confirmation details via email shortly.
                            </p>
                        </div>

                        <div style="display: grid; gap: 10px;">
                            <button id="closeModalBtn" class="cta-btn" style="width: 100%;">
                                <i class="fa-solid fa-check"></i> Got it!
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('closeModalBtn').addEventListener('click', () => {
                modalContainer.innerHTML = '';
            });
        });
    });
}

export async function renderBadges(container, db) {
    const userBadges = await db.getUserBadges();

    const allBadges = [
        { id: 'welcome_explorer', name: 'Explorer', icon: 'fa-compass', desc: 'Welcome to Ed-Wise!' },
        { id: 'early_bird', name: 'Early Bird', icon: 'fa-sun', desc: 'Login before 6 AM for 7 days' },
        { id: 'task_master', name: 'Task Master', icon: 'fa-check-double', desc: 'Complete 50 tasks' },
        { id: 'focus_king', name: 'Focus King', icon: 'fa-brain', desc: 'Complete 20 focus sessions' },
        { id: 'scholar', name: 'Scholar', icon: 'fa-graduation-cap', desc: 'Score 90%+ in 3 tests' },
        { id: 'helpful', name: 'Helpful Hand', icon: 'fa-hand-holding-heart', desc: 'Help 10 classmates' },
        { id: 'consistency', name: 'Consistency', icon: 'fa-fire', desc: '30-day study streak' },
        { id: 'social', name: 'Social Butterfly', icon: 'fa-users', desc: 'Join 5 discussion groups' }
    ];

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fa-solid fa-medal"></i> My Achievements</h3>
            </div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 20px;">
                    ${allBadges.map(badge => {
        const isUnlocked = userBadges.includes(badge.id);
        return `
                            <div style="text-align: center; opacity: ${isUnlocked ? '1' : '0.5'}; filter: ${isUnlocked ? 'none' : 'grayscale(100%)'};">
                                <div style="width: 80px; height: 80px; margin: 0 auto 10px; border-radius: 50%; background: ${isUnlocked ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 'rgba(255,255,255,0.1)'}; display: flex; align-items: center; justify-content: center; box-shadow: ${isUnlocked ? '0 0 20px rgba(255, 215, 0, 0.4)' : 'none'};">
                                    <i class="fa-solid ${badge.icon}" style="font-size: 2rem; color: ${isUnlocked ? 'white' : 'rgba(255,255,255,0.3)'};"></i>
                                </div>
                                <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 5px;">${badge.name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.3;">${badge.desc}</div>
                            </div>
                        `;
    }).join('')}
                </div>
            </div>
        </div>
    `;
}

export async function renderLeaderboard(container, db) {
    const leaderboard = await db.getLeaderboard();

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fa-solid fa-trophy"></i> Class Leaderboard</h3>
            </div>
            <div style="padding: 0;">
                ${leaderboard.map((user, index) => `
                    <div style="display: flex; align-items: center; padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); background: ${index === 0 ? 'rgba(255, 215, 0, 0.1)' : 'transparent'};">
                        <div style="font-weight: bold; font-size: 1.2rem; width: 40px; color: ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-muted)'};">
                            ${index + 1}
                        </div>
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">
                            ${user.avatar}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 500;">${user.name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Level ${Math.floor(user.points / 1000) + 1}</div>
                        </div>
                        <div style="font-weight: bold; color: var(--secondary);">
                            ${user.points} XP
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
