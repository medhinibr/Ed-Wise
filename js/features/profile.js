export async function renderProfile(container, db, user, app) {
    const userData = await db.getData();
    // Merge local user object with latest DB data
    const fullUser = { ...user, ...userData };

    // Get profile image from localStorage
    const profileImage = localStorage.getItem(`edwise_profile_img_${user.id}`);

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fa-solid fa-user-circle"></i> My Profile</h3>
            </div>
            <div style="padding: 30px;">
                <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                    <!-- Avatar Section -->
                    <div style="flex: 1; min-width: 250px; text-align: center; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 15px;">
                        <div style="position: relative; width: 120px; height: 120px; margin: 0 auto 20px auto;">
                            ${profileImage ?
            `<img id="profileImageDisplay" src="${profileImage}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);">` :
            `<div id="profileImageDisplay" style="width: 120px; height: 120px; border-radius: 50%; background: var(--primary); color: white; font-size: 3rem; display: flex; align-items: center; justify-content: center;">
                                    ${fullUser.name.charAt(0).toUpperCase()}
                                </div>`
        }
                            <button id="uploadImageBtn" style="position: absolute; bottom: 0; right: 0; width: 35px; height: 35px; border-radius: 50%; background: var(--primary); border: 2px solid #1a1a2e; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <i class="fa-solid fa-camera"></i>
                            </button>
                            <input type="file" id="profileImageInput" accept="image/*" style="display: none;">
                        </div>
                        <h2 style="margin-bottom: 5px;">${fullUser.name}</h2>
                        <p style="color: var(--text-muted); margin-bottom: 20px;">@${fullUser.username} • ${fullUser.role.charAt(0).toUpperCase() + fullUser.role.slice(1)}</p>
                        
                        <div style="display: grid; gap: 10px; text-align: left;">
                            <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                                <small style="color: var(--text-muted);">Joined</small>
                                <div>${new Date(fullUser.joined).toLocaleDateString()}</div>
                            </div>
                            ${(fullUser.stats?.points || 0) > 0 ? `
                            <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                                <small style="color: var(--text-muted);">Points</small>
                                <div>${fullUser.stats?.points} XP</div>
                            </div>` : ''}
                        </div>
                    </div>

                    <!-- Edit Details Section -->
                    <div style="flex: 2; min-width: 300px;">
                        <h4 style="margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Edit Details</h4>
                        <form id="profileForm" style="display: grid; gap: 20px;">
                            <div class="input-group">
                                <label style="display: block; margin-bottom: 8px; color: var(--text-muted);">Full Name</label>
                                <input type="text" id="profileName" value="${fullUser.name}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
                            </div>

                            ${getRoleSpecificFields(fullUser)}

                            <div style="display: flex; gap: 15px; margin-top: 10px;">
                                <button type="submit" class="cta-btn">Save Changes</button>
                                <button type="button" id="changePassBtn" class="cta-btn btn-secondary">Change Password</button>
                                <button type="button" id="profileLogoutBtn" class="cta-btn" style="background: #ff4757;">Logout</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Profile Image Upload Handler
    const uploadBtn = document.getElementById('uploadImageBtn');
    const imageInput = document.getElementById('profileImageInput');
    const imageDisplay = document.getElementById('profileImageDisplay');

    uploadBtn.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;
                // Save to localStorage
                localStorage.setItem(`edwise_profile_img_${user.id}`, imageData);

                // Update display
                if (imageDisplay.tagName === 'IMG') {
                    imageDisplay.src = imageData;
                } else {
                    imageDisplay.outerHTML = `<img id="profileImageDisplay" src="${imageData}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);">`;
                }

                // Update sidebar avatar if exists
                updateSidebarAvatar(imageData);
            };
            reader.readAsDataURL(file);
        }
    });

    function updateSidebarAvatar(imageData) {
        const sidebarAvatar = document.querySelector('.user-mini-profile .avatar');
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = `<img src="${imageData}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
    }

    // Load existing image in sidebar if available
    if (profileImage) {
        updateSidebarAvatar(profileImage);
    }

    document.getElementById('profileLogoutBtn').addEventListener('click', () => {
        if (app && app.showLogoutModal) {
            app.showLogoutModal();
        } else {
            // Fallback
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('edwise_user');
                window.location.href = 'index.html';
            }
        }
    });

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const updates = {
            name: document.getElementById('profileName').value.trim()
        };

        // Collect role specific updates
        if (fullUser.role === 'student') {
            updates.school = document.getElementById('profileSchool').value.trim();
            updates.class = document.getElementById('profileClass').value.trim();
        } else if (fullUser.role === 'teacher') {
            updates.email = document.getElementById('profileEmail').value.trim();
            updates.school = document.getElementById('profileSchool').value.trim();
        } else if (fullUser.role === 'parent') {
            updates.childName = document.getElementById('profileChildName').value.trim();
            updates.childClass = document.getElementById('profileChildClass').value.trim();
            updates.childSchool = document.getElementById('profileChildSchool').value.trim();
        }

        try {
            await db.updateUserProfile(updates);
            alert("Profile updated successfully!");
            // Update local storage user object name if changed
            const localUser = JSON.parse(localStorage.getItem('edwise_user'));
            localUser.name = updates.name;
            localStorage.setItem('edwise_user', JSON.stringify(localUser));
            // Reload to reflect changes
            renderProfile(container, db, localUser, app);
        } catch (err) {
            console.error(err);
            alert("Failed to update profile.");
        }
    });

    document.getElementById('changePassBtn').addEventListener('click', () => {
        if (app && app.showChangePasswordModal) {
            app.showChangePasswordModal();
        } else {
            // Fallback if app instance is not available
            const newPass = prompt("Enter new password:");
            if (newPass && newPass.length >= 6) {
                db.updateUserPassword(newPass).then(() => alert("Password changed!"));
            } else if (newPass) {
                alert("Password must be at least 6 characters.");
            }
        }
    });
}

function getRoleSpecificFields(user) {
    if (user.role === 'student') {
        return `
            <div class="input-group">
                <label style="display: block; margin-bottom: 8px; color: var(--text-muted);">School</label>
                <input type="text" id="profileSchool" value="${user.school || ''}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
            </div>
            <div class="input-group">
                <label style="display: block; margin-bottom: 8px; color: var(--text-muted);">Class/Grade</label>
                <input type="text" id="profileClass" value="${user.class || ''}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
            </div>
        `;
    } else if (user.role === 'teacher') {
        return `
             <div class="input-group">
                <label style="display: block; margin-bottom: 8px; color: var(--text-muted);">Email</label>
                <input type="email" id="profileEmail" value="${user.email || ''}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
            </div>
            <div class="input-group">
                <label style="display: block; margin-bottom: 8px; color: var(--text-muted);">School</label>
                <input type="text" id="profileSchool" value="${user.school || ''}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
            </div>
        `;
    } else if (user.role === 'parent') {
        return `
            <div class="input-group">
                <label style="display: block; margin-bottom: 8px; color: var(--text-muted);">Child's Name</label>
                <input type="text" id="profileChildName" value="${user.childName || ''}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
            </div>
            <div class="input-group">
                <label style="display: block; margin-bottom: 8px; color: var(--text-muted);">Child's Class</label>
                <input type="text" id="profileChildClass" value="${user.childClass || ''}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
            </div>
            <div class="input-group">
                <label style="display: block; margin-bottom: 8px; color: var(--text-muted);">Child's School</label>
                <input type="text" id="profileChildSchool" value="${user.childSchool || ''}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
            </div>
        `;
    }
    return '';
}
