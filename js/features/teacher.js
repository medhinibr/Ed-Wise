export async function renderAskTeacher(container, db, appInstance) {
    const questions = await db.getTeacherQuestions();

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
            await db.askTeacher({
                teacherName: teacherName,
                subject: subject,
                question: question
            });

            // Clear form
            document.getElementById('teacherName').value = '';
            document.getElementById('questionText').value = '';

            // Refresh view and XP
            await renderAskTeacher(container, db, appInstance);
            if (appInstance.updateUserInfo) appInstance.updateUserInfo();

            alert("Question submitted successfully! You earned 5 XP!");
        } catch (error) {
            console.error("Error submitting question:", error);
            alert("Failed to submit question. Please try again.");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

export async function renderTeacherQuestions(container, db) {
    const allQuestions = await db.getAllStudentQuestions();

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fa-solid fa-question-circle"></i> Student Questions</h3>
            </div>
            <div style="padding: 20px;">
                ${allQuestions.length === 0 ? '<p style="text-align: center; color: var(--text-muted);">No questions from students yet.</p>' : ''}
                <div style="display: grid; gap: 20px;">
                    ${allQuestions.sort((a, b) => b.id - a.id).map(q => `
                        <div class="question-card" style="padding: 20px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                <div>
                                    <div style="font-weight: 600; font-size: 1.1rem; color: var(--primary);">${q.studentName}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-muted);">${q.subject} • ${new Date(q.askedAt).toLocaleDateString()}</div>
                                </div>
                                <span class="status-badge" style="padding: 5px 12px; border-radius: 15px; font-size: 0.75rem; font-weight: 600; ${q.status === 'answered' ? 'background: rgba(76, 175, 80, 0.2); color: #4CAF50;' : 'background: rgba(255, 152, 0, 0.2); color: #FF9800;'}">
                                    ${q.status.toUpperCase()}
                                </span>
                            </div>
                            
                            <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <p style="margin: 0; line-height: 1.6;">${q.question}</p>
                            </div>

                            ${q.status === 'pending' ? `
                                <div class="answer-section">
                                    <textarea id="answer-${q.id}" placeholder="Type your answer here..." style="width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; min-height: 80px; font-family: inherit;"></textarea>
                                    <button class="cta-btn submit-answer-btn" data-id="${q.id}" data-student-id="${q.studentId}" style="padding: 8px 20px; font-size: 0.9rem;">Submit Answer</button>
                                </div>
                            ` : `
                                <div style="padding: 15px; border-radius: 8px; background: rgba(76, 175, 80, 0.1); border-left: 3px solid #4CAF50;">
                                    <div style="font-weight: 500; margin-bottom: 5px; color: #4CAF50;">Your Answer:</div>
                                    <p style="margin: 0;">${q.answer}</p>
                                </div>
                            `}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll('.submit-answer-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const studentId = e.currentTarget.dataset.studentId;
            const answer = document.getElementById(`answer-${id}`).value.trim();

            if (!answer) return;

            await db.answerStudentQuestion(id, studentId, answer);
            renderTeacherQuestions(container, db);
        });
    });
}
