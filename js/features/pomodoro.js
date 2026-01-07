export class PomodoroTimer {
    constructor() {
        this.state = 'IDLE';
        this.timeLeft = 25 * 60;
        this.interval = null;
        this.sequence = [
            { state: 'FOCUS_1', duration: 25, label: 'Focus Session 1', msg: 'Focus Mode Started. 25 minutes.' },
            { state: 'BREAK_1', duration: 5, label: 'Short Break', msg: 'Time for a 5 minute break.' },
            { state: 'FOCUS_2', duration: 25, label: 'Focus Session 2', msg: 'Back to Focus. 25 minutes.' },
            { state: 'BREAK_2', duration: 10, label: 'Long Break', msg: 'Great job! Take a 10 minute break.' }
        ];
        this.currentIndex = 0;
        this.db = null;
        this.isPaused = false;
    }

    attachToDOM(display, status, startBtn, pauseBtn, resetBtn, db) {
        this.displayElement = display;
        this.statusElement = status;
        this.startBtn = startBtn;
        this.pauseBtn = pauseBtn;
        this.resetBtn = resetBtn;
        this.db = db;

        this.startBtn.onclick = () => {
            if (this.state === 'IDLE') {
                this.startTimer();
            } else {
                this.stopTimer();
            }
        };

        this.pauseBtn.onclick = () => {
            if (this.isPaused) {
                this.resumeTimer();
            } else {
                this.pauseTimer();
            }
        };

        this.resetBtn.onclick = () => this.resetPomodoro();

        this.updateUI();
        this.updateTimerDisplay();
    }

    startTimer() {
        if (this.state === 'IDLE') {
            this.startStage(0);
        }
        this.updateUI();
    }

    stopTimer() {
        this.resetPomodoro();
        this.updateUI();
    }

    pauseTimer() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            this.isPaused = true;
            this.updateUI();
        }
    }

    resumeTimer() {
        if (this.isPaused) {
            this.isPaused = false;
            this.runTimer();
            this.updateUI();
        }
    }

    startStage(index) {
        this.currentIndex = index;
        const stage = this.sequence[index];
        this.state = stage.state;
        this.timeLeft = stage.duration * 60;
        this.isPaused = false;

        this.updateStatusDisplay();
        this.speak(stage.msg);
        this.runTimer();
        this.updateUI();
    }

    runTimer() {
        if (this.interval) clearInterval(this.interval);

        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            // 5 Minute Warning
            if (this.timeLeft === 5 * 60) {
                this.speak("5 minutes remaining.");
            }

            // Stage Complete
            if (this.timeLeft <= 0) {
                clearInterval(this.interval);
                this.interval = null;
                this.completeStage();
            }
        }, 1000);
    }

    completeStage() {
        // Award XP if it was a focus session
        if (this.state.startsWith('FOCUS')) {
            this.awardXP();
        }

        const nextIndex = this.currentIndex + 1;
        if (nextIndex < this.sequence.length) {
            this.startStage(nextIndex);
        } else {
            this.speak("Pomodoro cycle complete. Well done!");
            alert("Cycle Complete!");
            this.resetPomodoro();
        }
    }

    resetPomodoro() {
        clearInterval(this.interval);
        this.interval = null;
        this.state = 'IDLE';
        this.currentIndex = 0;
        this.timeLeft = 25 * 60;
        this.isPaused = false;

        this.updateTimerDisplay();
        this.updateStatusDisplay();
        this.updateUI();
    }

    updateUI() {
        if (!this.startBtn || !this.pauseBtn) return;

        if (this.state === 'IDLE') {
            this.startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Cycle';
            this.startBtn.classList.remove('btn-danger'); // Assuming we might add a red style for Stop
            this.pauseBtn.style.display = 'none';
        } else {
            this.startBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop';
            this.startBtn.classList.add('btn-danger'); // Add red style for Stop

            this.pauseBtn.style.display = 'inline-block';
            if (this.isPaused) {
                this.pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
            } else {
                this.pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
            }
        }
    }

    updateTimerDisplay() {
        if (this.displayElement) {
            this.displayElement.textContent = this.formatTime(this.timeLeft);
        }
    }

    updateStatusDisplay() {
        if (this.statusElement) {
            const currentStage = this.sequence[this.currentIndex];
            this.statusElement.textContent = this.state === 'IDLE' ? 'Ready to Start' : currentStage.label;
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    }

    async awardXP() {
        if (this.db) {
            await this.db.updateUserStats(25, 0);
            if (this.db.addNotification) {
                await this.db.addNotification({
                    text: "Focus session completed! +25 XP",
                    icon: "fa-clock",
                    color: "#4CAF50"
                });
            }
        }
    }
}
