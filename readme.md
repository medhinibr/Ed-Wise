# Ed-Wise | Next Gen Learning Platform

An AI-powered, gamified, and collaborative learning management system designed to empower students, connect teachers, and engage parents.

**Live Demo:** [https://ed-wise.netlify.app/](https://ed-wise.netlify.app/)

## Key Features

*   **AI-Powered Tutor:** Integrated AI study assistant (Groq/LLaMA 3) for instant doubt resolution and personalized study plans.
*   **Role-Based Access:** tailored dashboards for **Students**, **Teachers**, and **Parents**.
*   **Gamification:** Earn XP, badges, and compete on leaderboards to make learning addictive.
*   **Smart Tools:** Pomodoro timer, dynamic scheduler, task manager, and collaborative whiteboard.
*   **Parental Insights:** Real-time tracking of child's progress, attendance, and activity.
*   **Secure Authentication:** Powered by Firebase (Firestore & Auth).

##  Technology Stack

*   **Frontend:** HTML5, CSS3 (Glassmorphism UI), Vanilla JavaScript (ES6+ Modules)
*   **Backend / Database:** Firebase Firestore (NoSQL), LocalStorage for caching
*   **AI Integration:** Groq API (LLaMA 3 model)
*   **Deployment:** Netlify
*   **Icons/Fonts:** FontAwesome, Google Fonts (Outfit)

##  Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/medhinibr/Ed-Wise.git
    cd Ed-Wise
    ```

2.  **Configuration:**
    *   Duplicate `js/config.example.js` and rename it to `js/config.js`.
    *   Add your API keys to `js/config.js`:
    ```javascript
    const CONFIG = {
        GROQ_API_KEY: 'YOUR_GROQ_API_KEY',
        FIREBASE: {
            apiKey: "YOUR_FIREBASE_API_KEY",
            // ... other firebase config
        }
    };
    export default CONFIG;
    ```
    *   *(Optional)* Verify `.env` file structure if handling secrets externally (see `.env` for reference).

3.  **Run Locally:**
    *   You need a local server to handle ES6 modules.
    *   **Option A (Python):**
        ```bash
        # Windows
        start_server.bat
        
        # Or manually
        python -m http.server 8080
        ```
    *   **Option B (Node/NPM):**
        ```bash
        npx serve .
        ```
    *   Open `http://localhost:8080` in your browser.

##  Security Note

*   **API Keys:** This project uses `js/config.js` to manage API keys. This file is added to `.gitignore` to prevent secret leakage.
*   **Firebase Rules:** Ensure Firestore security rules are configured to protect user data (read/write access limited to `users` collection).

## Deployment

This project is configured for **Netlify**.
1.  Connect your repository.
2.  Set the publish directory to `.` (root).
3.  Deploy!

---
© 2025 Ed-Wise. All Rights Reserved.
