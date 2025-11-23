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

    // Role  for Signup
    const roleBtns = document.querySelectorAll('.role-btn');
    let selectedRole = 'student'; 

    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRole = btn.dataset.role;
        });
    });

    // Login 
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

            try {
                // Normalize username to ID format used in signup
                const userId = username.toLowerCase().replace(/\s+/g, '_');
                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();

                    // password check 
                    if (userData.password === password) {
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
                alert("Error connecting to database.");
                submitBtn.innerHTML = 'Login <i class="fa-solid fa-arrow-right"></i>';
                submitBtn.disabled = false;
            }
        });
    }

    // Signup 
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const username = document.getElementById('signup-username').value.trim();
            const password = document.getElementById('signup-password').value; 
            const submitBtn = signupForm.querySelector('button[type="submit"]');

            if (!name || !username) return;

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
                    isFirstLogin: true, 
                    joined: new Date().toISOString(),
                    stats: {
                        points: 0,
                        streak: 0,
                        tasksCompleted: 0
                    }
                };

                await setDoc(userRef, userData);

                // Auto login after signup
                localStorage.setItem('edwise_user', JSON.stringify(userData));
                window.location.href = 'dashboard.html';

            } catch (error) {
                console.error("Signup Error:", error);
                alert("Error creating account.");
                submitBtn.innerHTML = 'Sign Up <i class="fa-solid fa-user-plus"></i>';
                submitBtn.disabled = false;
            }
        });
    }
});
