export async function renderQnAManager(container, db, app) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fa-solid fa-comments"></i> QnA Manager</h3>
                <div class="filter-tabs" style="display: flex; gap: 10px;">
                    <button class="filter-btn active" data-filter="all" style="background: var(--primary); border: none; padding: 5px 15px; border-radius: 20px; color: white; cursor: pointer;">All</button>
                    <button class="filter-btn" data-filter="pending" style="background: rgba(255,255,255,0.1); border: none; padding: 5px 15px; border-radius: 20px; color: white; cursor: pointer;">Pending</button>
                    <button class="filter-btn" data-filter="answered" style="background: rgba(255,255,255,0.1); border: none; padding: 5px 15px; border-radius: 20px; color: white; cursor: pointer;">Answered</button>
                </div>
            </div>
            <div id="qnaList" style="display: flex; flex-direction: column; gap: 15px;">
                <div style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading questions...</div>
            </div>
        </div>
    `;

    const allQuestions = await db.getAllStudentQuestions();
    const qnaList = document.getElementById('qnaList');

    // Sort by date (newest first)
    allQuestions.sort((a, b) => new Date(b.askedAt) - new Date(a.askedAt));

    function renderList(filter = 'all') {
        qnaList.innerHTML = '';
        const filtered = allQuestions.filter(q => {
            if (filter === 'all') return true;
            return q.status === filter;
        });

        if (filtered.length === 0) {
            qnaList.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">No questions found.</div>`;
            return;
        }

        filtered.forEach(q => {
            const el = document.createElement('div');
            el.className = 'qna-item';
            el.style.cssText = `background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);`;

            el.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="background: rgba(108, 99, 255, 0.2); color: #a29bfe; padding: 2px 10px; border-radius: 12px; font-size: 0.8rem;">${q.subject}</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(q.askedAt).toLocaleDateString()}</span>
                </div>
                <h4 style="margin-bottom: 5px;">${q.studentName} asks:</h4>
                <p style="margin-bottom: 15px; font-size: 1.1rem;">${q.question}</p>
                
                ${q.status === 'answered' ? `
                    <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #2ecc71;">
                        <p style="font-size: 0.9rem; color: #2ecc71; margin-bottom: 5px;"><i class="fa-solid fa-check-circle"></i> Answered</p>
                        <p>${q.answer}</p>
                    </div>
                ` : `
                    <div class="answer-box">
                        <textarea placeholder="Type your answer here..." style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; color: white; margin-bottom: 10px; min-height: 80px;"></textarea>
                        <button class="submit-answer-btn" style="background: var(--primary); border: none; padding: 8px 20px; border-radius: 8px; color: white; cursor: pointer;">Submit Answer</button>
                    </div>
                `}
            `;

            if (q.status === 'pending') {
                const btn = el.querySelector('.submit-answer-btn');
                const textarea = el.querySelector('textarea');

                btn.addEventListener('click', async () => {
                    const answer = textarea.value.trim();
                    if (!answer) return;

                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    btn.disabled = true;

                    await db.answerStudentQuestion(q.id, q.studentId, answer);

                    // Update local data and re-render
                    q.status = 'answered';
                    q.answer = answer;
                    renderList(document.querySelector('.filter-btn.active').dataset.filter);
                });
            }

            qnaList.appendChild(el);
        });
    }

    renderList();

    // Filter logic
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = 'rgba(255,255,255,0.1)';
            });
            btn.classList.add('active');
            btn.style.background = 'var(--primary)';
            renderList(btn.dataset.filter);
        });
    });
}
