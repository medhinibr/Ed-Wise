export async function renderWeekendFun(container, db) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fa-solid fa-umbrella-beach"></i> Weekend Fun</h3>
            </div>
            <div style="padding: 20px; text-align: center;">
                <p>Relax and recharge! Here are some fun activities for your weekend.</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
                        <i class="fa-solid fa-film" style="font-size: 2rem; color: #ff6b6b; margin-bottom: 10px;"></i>
                        <h4>Movie Night</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">Watch a documentary or a sci-fi movie.</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
                        <i class="fa-solid fa-gamepad" style="font-size: 2rem; color: #4ecdc4; margin-bottom: 10px;"></i>
                        <h4>Gaming</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">Play your favorite educational or strategy games.</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
                        <i class="fa-solid fa-book-open" style="font-size: 2rem; color: #ffe66d; margin-bottom: 10px;"></i>
                        <h4>Reading</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">Read a book for pleasure, not for school.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}
