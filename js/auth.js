import { db } from './firebase-config.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching
    const loginTab = document.getElementById('tab-login');
    const signupTab = document.getElementById('tab-signup');
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');

    if (loginTab && signupTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginView.style.display = 'block';
            signupView.style.display = 'none';
        });

        signupTab.addEventListener('click', () => {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupView.style.display = 'block';
            loginView.style.display = 'none';
        });
    }

    // Role Selection for Signup
    const roleBtns = document.querySelectorAll('.role-btn');
    let selectedRole = 'student'; // Default

    function updateFieldVisibility(role) {
        document.querySelectorAll('.role-specific-fields').forEach(el => el.style.display = 'none');
        const fields = document.getElementById(`${role}-fields`);
        if (fields) fields.style.display = 'block';
    }

    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRole = btn.dataset.role;
            updateFieldVisibility(selectedRole);
        });
    });

    // Forgot Password Logic
    const forgotLink = document.getElementById('forgotPasswordLink');
    const forgotModal = document.getElementById('forgotPasswordModal');
    const closeForgotBtn = document.getElementById('closeForgotModal');
    const forgotForm = document.getElementById('forgotPasswordForm');

    if (forgotLink && forgotModal) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotModal.style.display = 'flex';
        });

        closeForgotBtn.addEventListener('click', () => {
            forgotModal.style.display = 'none';
        });

        forgotModal.addEventListener('click', (e) => {
            if (e.target === forgotModal) {
                forgotModal.style.display = 'none';
            }
        });

        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('reset-email').value;
            // Simulate sending email
            const btn = forgotForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Sending...';
            btn.disabled = true;

            setTimeout(() => {
                alert(`Password reset link has been sent to ${email}. Please check your inbox.`);
                btn.innerText = originalText;
                btn.disabled = false;
                forgotModal.style.display = 'none';
                document.getElementById('reset-email').value = '';
            }, 1500);
        });
    }

    // Login Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if (!username || !password) return;

            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
            submitBtn.disabled = true;

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out")), 10000)
            );

            try {
                // Normalize username to ID format used in signup
                const userId = username.toLowerCase().replace(/\s+/g, '_');
                const userRef = doc(db, "users", userId);

                // Race between fetch and timeout
                const userSnap = await Promise.race([getDoc(userRef), timeoutPromise]);

                if (userSnap.exists()) {
                    const userData = userSnap.data();

                    // Simple password check (In production, NEVER store plain text passwords)
                    if (userData.password === password) {
                        // Success
                        localStorage.setItem('edwise_user', JSON.stringify(userData));
                        window.location.href = 'dashboard.html';
                    } else {
                        alert("Invalid password.");
                        submitBtn.innerHTML = 'Login <i class="fa-solid fa-arrow-right"></i>';
                        submitBtn.disabled = false;
                    }
                } else {
                    alert("User not found. Please sign up first.");
                    submitBtn.innerHTML = 'Login <i class="fa-solid fa-arrow-right"></i>';
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error("Login Error:", error);
                if (error.message === "Request timed out") {
                    alert("Login timed out. Please check your internet connection.");
                } else {
                    alert("Error connecting to database. Please try again.");
                }
                submitBtn.innerHTML = 'Login <i class="fa-solid fa-arrow-right"></i>';
                submitBtn.disabled = false;
            }
        });
    }

    // Signup Logic
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const username = document.getElementById('signup-username').value.trim();
            const password = document.getElementById('signup-password').value;
            const submitBtn = signupForm.querySelector('button[type="submit"]');

            if (!name || !username || !password) {
                alert("Please fill in all required fields.");
                return;
            }

            // Role specific validation
            let extraData = {};
            if (selectedRole === 'student') {
                const roll = document.getElementById('signup-roll').value.trim();
                const school = document.getElementById('signup-school').value.trim();
                if (!roll || !school) {
                    alert("Please fill in Roll Number and School Name.");
                    return;
                }
                extraData = { roll, school };
            } else if (selectedRole === 'teacher') {
                const email = document.getElementById('signup-email').value.trim();
                const school = document.getElementById('signup-teacher-school').value.trim();
                if (!email || !school) {
                    alert("Please fill in Email and School Name.");
                    return;
                }
                extraData = { email, school };
            } else if (selectedRole === 'parent') {
                const childName = document.getElementById('signup-child-name').value.trim();
                const childRoll = document.getElementById('signup-child-roll').value.trim();
                const childSchool = document.getElementById('signup-child-school').value.trim();
                if (!childName || !childRoll || !childSchool) {
                    alert("Please fill in all child details.");
                    return;
                }
                extraData = { childName, childRoll, childSchool };
            }

            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;

            try {
                const userId = username.toLowerCase().replace(/\s+/g, '_');
                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    alert("Username already taken. Please choose another.");
                    submitBtn.innerHTML = 'Sign Up <i class="fa-solid fa-user-plus"></i>';
                    submitBtn.disabled = false;
                    return;
                }

                const userData = {
                    id: userId,
                    name: name,
                    username: username,
                    role: selectedRole,
                    password: password,
                    isFirstLogin: false,
                    joined: new Date().toISOString(),
                    stats: {
                        points: 0,
                        streak: 0,
                        tasksCompleted: 0
                    },
                    ...extraData
                };

                await setDoc(userRef, userData);

                // Auto-login after signup
                localStorage.setItem('edwise_user', JSON.stringify(userData));
                window.location.href = 'dashboard.html';

            } catch (error) {
                console.error("Signup Error:", error);
                alert("Error creating account: " + error.message);
                submitBtn.innerHTML = 'Sign Up <i class="fa-solid fa-user-plus"></i>';
                submitBtn.disabled = false;
            }
        });
    }
});
