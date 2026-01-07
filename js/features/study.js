export async function renderStudyMaterials(container, db) {
    const materials = {
        "1": ["Kannada", "English", "Mathematics", "EVS"],
        "2": ["Kannada", "English", "Mathematics", "EVS"],
        "3": ["Kannada", "English", "Mathematics", "EVS"],
        "4": ["Kannada", "English", "Mathematics", "EVS"],
        "5": ["Kannada", "English", "Mathematics", "EVS"],
        "6": ["Kannada", "English", "Hindi", "Mathematics", "Science", "Social Science"],
        "7": ["Kannada", "English", "Hindi", "Mathematics", "Science", "Social Science"],
        "8": ["Kannada", "English", "Hindi", "Mathematics", "Science", "Social Science"],
        "9": ["Kannada", "English", "Hindi", "Mathematics", "Science", "Social Science"],
        "10": ["Kannada", "English", "Hindi", "Mathematics", "Science", "Social Science"]
    };

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fa-solid fa-book-open"></i> Study Materials - Karnataka State Board (KTBS)</h3>
            </div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                    ${Object.keys(materials).map(standard => `
                        <div class="study-standard-card" style="padding: 20px; border-radius: 15px; background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(var(--secondary-rgb), 0.1)); border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s;">
                            <div style="font-size: 2rem; font-weight: 700; margin-bottom: 10px; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                                ${standard}${standard == '1' ? 'st' : standard == '2' ? 'nd' : standard == '3' ? 'rd' : 'th'} Standard
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${materials[standard].map(subject => `
                                    <button class="subject-btn" data-standard="${standard}" data-subject="${subject}" style="padding: 10px 15px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; cursor: pointer; text-align: left; transition: all 0.2s;">
                                        <i class="fa-solid fa-book"></i> ${subject}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // Add hover effects
    document.querySelectorAll('.study-standard-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 30px rgba(var(--primary-rgb), 0.3)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });
    });

    document.querySelectorAll('.subject-btn').forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
            e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.2)';
            e.currentTarget.style.borderColor = 'var(--primary)';
        });
        btn.addEventListener('mouseleave', (e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        });
        btn.addEventListener('click', (e) => {
            const standard = e.currentTarget.dataset.standard;
            const subject = e.currentTarget.dataset.subject;
            showMaterialContent(standard, subject);
        });
    });
}

function showMaterialContent(standard, subject) {
    const modalContainer = document.getElementById('modalContainer');
    const ktbsLink = "http://ktbs.kar.nic.in/New/index.html#!/textbook";

    modalContainer.innerHTML = `
        <div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div class="modal-content" style="background: #1a1a2e; padding: 30px; border-radius: 20px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>${subject} - ${standard}${standard == '1' ? 'st' : standard == '2' ? 'nd' : standard == '3' ? 'rd' : 'th'} Standard</h3>
                    <button id="closeModalBtn" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                
                <div style="color: var(--text-muted); line-height: 1.8;">
                    <p><i class="fa-solid fa-info-circle"></i> Access official Karnataka State Board (KTBS) textbooks and materials below.</p>
                    
                    <div style="margin-top: 20px; display: grid; gap: 15px;">
                        <div style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0 0 5px 0;">Official Textbook (PDF)</h4>
                                <p style="margin: 0; font-size: 0.8rem;">Karnataka Textbook Society</p>
                            </div>
                            <a href="https://www.google.com/search?q=Karnataka+State+Board+${standard}+Standard+${subject}+Textbook+PDF+Download" target="_blank" class="cta-btn" style="text-decoration: none; font-size: 0.9rem;">
                                <i class="fa-solid fa-download"></i> Download
                            </a>
                        </div>

                        <div style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0 0 5px 0;">Model Question Papers</h4>
                                <p style="margin: 0; font-size: 0.8rem;">Previous Year & Sample Papers</p>
                            </div>
                            <a href="https://www.google.com/search?q=Karnataka+State+Board+${standard}+Standard+${subject}+Model+Question+Papers" target="_blank" class="cta-btn btn-secondary" style="text-decoration: none; font-size: 0.9rem;">
                                <i class="fa-solid fa-file-alt"></i> View
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('closeModalBtn').addEventListener('click', () => {
        modalContainer.innerHTML = '';
    });

    document.querySelector('.modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            modalContainer.innerHTML = '';
        }
    });
}
