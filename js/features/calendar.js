export async function renderCalendar(container, db) {
    const events = await db.getCalendarEvents() || [];
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    function renderCalendarView() {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentYear === currentDate.getFullYear() && currentMonth === currentDate.getMonth() ? currentMonth + 1 : currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        // Get events for current month
        const monthEvents = events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
        });

        container.innerHTML = `
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3><i class="fa-solid fa-calendar-days"></i> My Calendar</h3>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button id="prevMonth" class="control-btn btn-secondary" style="padding: 8px 12px;">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <span style="font-size: 1.1rem; font-weight: 600; min-width: 150px; text-align: center;">
                            ${monthNames[currentMonth]} ${currentYear}
                        </span>
                        <button id="nextMonth" class="control-btn btn-secondary" style="padding: 8px 12px;">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                        <button id="todayBtn" class="control-btn btn-primary" style="padding: 8px 16px; margin-left: 10px;">
                            Today
                        </button>
                    </div>
                </div>
                
                <div style="padding: 20px;">
                    <!-- Calendar Grid -->
                    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 10px;">
                            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
                                <div style="text-align: center; font-weight: 600; color: var(--primary); padding: 10px;">
                                    ${day}
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">
                            ${Array.from({ length: startingDayOfWeek }, (_, i) => `
                                <div style="aspect-ratio: 1; background: transparent;"></div>
                            `).join('')}
                            
                            ${Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEvent = monthEvents.some(e => e.date === dateStr);
            const isToday = day === currentDate.getDate() &&
                currentMonth === currentDate.getMonth() &&
                currentYear === currentDate.getFullYear();

            return `
                                    <div class="calendar-day" data-date="${dateStr}" 
                                         style="aspect-ratio: 1; background: ${isToday ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)'}; 
                                                border-radius: 8px; display: flex; flex-direction: column; 
                                                align-items: center; justify-content: center; cursor: pointer; 
                                                transition: all 0.2s; border: ${isToday ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)'}; 
                                                position: relative;">
                                        <span style="font-weight: ${isToday ? '700' : '500'}; font-size: 1.1rem;">
                                            ${day}
                                        </span>
                                        ${hasEvent ? `<div style="width: 6px; height: 6px; background: var(--primary); border-radius: 50%; position: absolute; bottom: 5px;"></div>` : ''}
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>

                    <!-- Add Event Section -->
                    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 15px;"><i class="fa-solid fa-plus-circle"></i> Add New Event</h4>
                        <div style="display: grid; gap: 12px;">
                            <input type="date" id="eventDate" value="${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}" 
                                   style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white;">
                            <input type="text" id="eventTitle" placeholder="Event Title" 
                                   style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white;">
                            <textarea id="eventDescription" placeholder="Description (optional)" 
                                      style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; min-height: 60px; font-family: inherit;"></textarea>
                            <button id="addEventBtn" class="cta-btn">
                                <i class="fa-solid fa-plus"></i> Add Event
                            </button>
                        </div>
                    </div>

                    <!-- Events List -->
                    <div>
                        <h4 style="margin-bottom: 15px;"><i class="fa-solid fa-list"></i> Upcoming Events</h4>
                        <div style="display: grid; gap: 12px;">
                            ${events.sort((a, b) => new Date(a.date) - new Date(b.date)).map(event => {
            const eventDate = new Date(event.date);
            const isPast = eventDate < new Date().setHours(0, 0, 0, 0);
            return `
                                    <div style="padding: 15px; border-radius: 12px; background: rgba(255,255,255,0.05); 
                                                border-left: 4px solid ${isPast ? '#666' : 'var(--primary)'}; 
                                                opacity: ${isPast ? '0.6' : '1'};">
                                        <div style="display: flex; justify-content: space-between; align-items: start;">
                                            <div style="flex: 1;">
                                                <div style="font-weight: 600; margin-bottom: 5px; ${isPast ? 'text-decoration: line-through;' : ''}">
                                                    ${event.title}
                                                </div>
                                                ${event.description ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">${event.description}</div>` : ''}
                                                <div style="font-size: 0.85rem; color: var(--text-muted);">
                                                    <i class="fa-regular fa-calendar"></i> 
                                                    ${eventDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                    ${isPast ? '<span style="color: #ff6b6b; margin-left: 10px;"><i class="fa-solid fa-clock-rotate-left"></i> Past</span>' : ''}
                                                </div>
                                            </div>
                                            <button class="icon-btn delete-event-btn" data-id="${event.id}" 
                                                    style="color: #ff4757; opacity: 0.7; transition: opacity 0.2s;">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
        }).join('')}
                            ${events.length === 0 ? '<p style="text-align: center; color: var(--text-muted); padding: 30px 0;">No events scheduled. Add one above!</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Event Listeners
        document.getElementById('prevMonth').addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendarView();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendarView();
        });

        document.getElementById('todayBtn').addEventListener('click', () => {
            currentMonth = currentDate.getMonth();
            currentYear = currentDate.getFullYear();
            renderCalendarView();
        });

        // Calendar day click - auto-fill date
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('mouseenter', (e) => {
                e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
            });
            day.addEventListener('mouseleave', (e) => {
                const isToday = e.currentTarget.dataset.date === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                e.currentTarget.style.background = isToday ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'scale(1)';
            });
            day.addEventListener('click', (e) => {
                const selectedDate = e.currentTarget.dataset.date;
                document.getElementById('eventDate').value = selectedDate;
                document.getElementById('eventTitle').focus();
            });
        });

        document.getElementById('addEventBtn').addEventListener('click', async () => {
            const date = document.getElementById('eventDate').value;
            const title = document.getElementById('eventTitle').value.trim();
            const description = document.getElementById('eventDescription').value.trim();

            if (!date) {
                alert('Please select a date');
                return;
            }
            if (!title) {
                alert('Please enter an event title');
                return;
            }

            const btn = document.getElementById('addEventBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';
            btn.disabled = true;

            try {
                await db.addCalendarEvent({ date, title, description });

                // Add notification
                if (db.addNotification) {
                    await db.addNotification({
                        text: `New event added: ${title}`,
                        icon: 'fa-calendar-plus',
                        color: '#2196F3'
                    });
                }

                document.getElementById('eventTitle').value = '';
                document.getElementById('eventDescription').value = '';
                await renderCalendar(container, db);
                alert('Event added successfully!');
            } catch (error) {
                console.error("Error adding event:", error);
                alert("Failed to add event. Please try again.");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });

        document.querySelectorAll('.delete-event-btn').forEach(btn => {
            btn.addEventListener('mouseenter', (e) => {
                e.currentTarget.style.opacity = '1';
            });
            btn.addEventListener('mouseleave', (e) => {
                e.currentTarget.style.opacity = '0.7';
            });
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                if (confirm('Delete this event?')) {
                    await db.deleteCalendarEvent(id);
                    await renderCalendar(container, db);
                }
            });
        });
    }

    renderCalendarView();
}
