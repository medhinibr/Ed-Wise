# Contributing to Ed-Wise

We welcome contributions that improve the project, fix bugs, enhance performance, or add new features.

## Getting Started

### 1. Fork the Repository
Click on the **Fork** button at the top right of the repository page.

### 2. Clone Your Fork
```bash
git clone https://github.com/medhinibr/Ed-Wise.git
cd Ed-Wise
```

### 3. Create a Branch
Create a new branch for your feature or bug fix:
```bash
git checkout -b feature/your-feature-name
```

### 4. Configuration
1.  Duplicate `js/config.example.js` and rename it to `js/config.js`.
2.  Add your API keys to `js/config.js`.

### 5. Run the Project
Since this project uses ES6 Modules, you must run it on a local server (opening `index.html` directly will not work).

*   **VS Code:** Right-click `index.html` and select **"Open with Live Server"**.
*   **Terminal:**
    ```bash
    npx serve .
    ```

### 6. Make Your Changes
Implement your feature or fix. Ensure your code follows the project's style guide (Glassmorphism CSS, ES6+ JS).

### 7. Commit and Push
```bash
git add .
git commit -m "Add a meaningful commit message"
git push origin feature/your-feature-name
```

### 8. Create a Pull Request
1.  Navigate to the original repository.
2.  Click on **New Pull Request**.
3.  Select your feature branch and submit.

## Code Style
*   **HTML/CSS:** Maintain semantic HTML and glassmorphism design consistency.
*   **JavaScript:** Use modular ES6 syntax.
*   **Commits:** Keep commits atomic and descriptive.
