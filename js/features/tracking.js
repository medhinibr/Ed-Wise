export async function renderStudentTracking(container, db, teacher) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fa-solid fa-users"></i> Student Tracking</h3>
                <div class="search-bar" style="width: 300px;">
                    <i class="fa-solid fa-search"></i>
                    <input type="text" id="studentSearch" placeholder="Search students...">
                </div>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); text-align: left;">
                            <th style="padding: 15px;">Student</th>
                            <th style="padding: 15px;">Roll No</th>
                            <th style="padding: 15px;">School</th>
                            <th style="padding: 15px;">XP Points</th>
                            <th style="padding: 15px;">Tasks Done</th>
                            <th style="padding: 15px;">Streak</th>
                        </tr>
                    </thead>
                    <tbody id="studentTableBody">
                        <tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    let students = await db.getAllStudents();

    // Filter students by teacher's school if available
    if (teacher && teacher.school) {
        students = students.filter(s => s.school && s.school.toLowerCase() === teacher.school.toLowerCase());
    }

    const tableBody = document.getElementById('studentTableBody');

    function renderTable(filter = '') {
        tableBody.innerHTML = '';
        const filtered = students.filter(s =>
            s.name.toLowerCase().includes(filter.toLowerCase()) ||
            (s.roll && s.roll.toLowerCase().includes(filter.toLowerCase()))
        );

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">No students found for your school.</td></tr>`;
            return;
        }

        filtered.forEach(s => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                <td style="padding: 15px; display: flex; align-items: center; gap: 10px;">
                    <div style="width: 30px; height: 30px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">
                        ${s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: 600;">${s.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">@${s.username}</div>
                    </div>
                </td>
                <td style="padding: 15px;">${s.roll || '-'}</td>
                <td style="padding: 15px;">${s.school || '-'}</td>
                <td style="padding: 15px; color: #f1c40f; font-weight: bold;">${s.stats?.points || 0}</td>
                <td style="padding: 15px;">${s.stats?.tasksCompleted || 0}</td>
                <td style="padding: 15px;">${s.stats?.streak || 0} 🔥</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    renderTable();

    document.getElementById('studentSearch').addEventListener('input', (e) => {
        renderTable(e.target.value);
    });
}
