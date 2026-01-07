export async function renderTimetable(container, db) {
    // Standard Karnataka State Board Subjects
    const timetables = {
        "1-5": [
            { day: "Monday", periods: ["Kannada", "English", "Maths", "Break", "EVS", "Games"] },
            { day: "Tuesday", periods: ["English", "Kannada", "Maths", "Break", "EVS", "Library"] },
            { day: "Wednesday", periods: ["Maths", "EVS", "Kannada", "Break", "English", "Art"] },
            { day: "Thursday", periods: ["Kannada", "English", "Maths", "Break", "EVS", "PT"] },
            { day: "Friday", periods: ["EVS", "Maths", "Kannada", "Break", "English", "Activity"] },
            { day: "Saturday", periods: ["Kannada", "Maths", "English", "Break", "Club", "Half Day"] }
        ],
        "6-10": [
            { day: "Monday", periods: ["Kannada", "English", "Maths", "Break", "Science", "Social Science", "Hindi"] },
            { day: "Tuesday", periods: ["English", "Hindi", "Science", "Break", "Maths", "Social Science", "Kannada"] },
            { day: "Wednesday", periods: ["Maths", "Science", "Social Science", "Break", "Kannada", "English", "PET"] },
            { day: "Thursday", periods: ["Science", "Maths", "Hindi", "Break", "Social Science", "Kannada", "Library"] },
            { day: "Friday", periods: ["Social Science", "Kannada", "English", "Break", "Science", "Maths", "Computer"] },
            { day: "Saturday", periods: ["Maths", "Science", "Kannada", "Break", "English", "Social Science", "Club"] }
        ]
    };

    let selectedClass = localStorage.getItem('edwise_selected_class') || '10';
    let currentTimetable = parseInt(selectedClass) <= 5 ? timetables["1-5"] : timetables["6-10"];

    function renderView() {
        container.innerHTML = `
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <h3><i class="fa-solid fa-table"></i> Class Timetable (Karnataka State Board)</h3>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label for="classSelect" style="color: var(--text-muted);">Class:</label>
                        <select id="classSelect" style="padding: 8px; border-radius: 6px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.2);">
                            ${Array.from({ length: 10 }, (_, i) => i + 1).map(num => `
                                <option value="${num}" ${selectedClass == num ? 'selected' : ''}>Class ${num}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div style="padding: 20px; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.05);">
                                <th style="padding: 15px; text-align: left; border: 1px solid rgba(255,255,255,0.1);">Day</th>
                                ${currentTimetable[0].periods.map((_, i) => `
                                    <th style="padding: 15px; text-align: left; border: 1px solid rgba(255,255,255,0.1);">
                                        ${currentTimetable[0].periods[i] === 'Break' ? 'Break' : `Period ${i + 1}`}
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${currentTimetable.map(day => `
                                <tr>
                                    <td style="padding: 12px; border: 1px solid rgba(255,255,255,0.1); font-weight: 600; color: var(--primary);">${day.day}</td>
                                    ${day.periods.map(period => `
                                        <td style="padding: 12px; border: 1px solid rgba(255,255,255,0.1); 
                                                   background: ${period === 'Break' ? 'rgba(255, 193, 7, 0.1)' : 'transparent'};
                                                   color: ${period === 'Break' ? '#ffc107' : 'inherit'};
                                                   text-align: ${period === 'Break' ? 'center' : 'left'};
                                                   font-weight: ${period === 'Break' ? 'bold' : 'normal'};">
                                            ${period}
                                        </td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top: 20px; font-size: 0.9rem; color: var(--text-muted);">
                        <i class="fa-solid fa-info-circle"></i> This is a standard template for Karnataka State Board. 
                    </div>
                </div>
            </div>
        `;

        document.getElementById('classSelect').addEventListener('change', (e) => {
            selectedClass = e.target.value;
            localStorage.setItem('edwise_selected_class', selectedClass);
            currentTimetable = parseInt(selectedClass) <= 5 ? timetables["1-5"] : timetables["6-10"];
            renderView();
        });
    }

    renderView();
}
