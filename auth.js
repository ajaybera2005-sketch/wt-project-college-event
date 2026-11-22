/**
 * Campus Event Management System
 * auth.js - Authentication, Authorization & Session Management
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbarAuth();
  setupAuthForms();
});

/**
 * Update modern navbar with authentication state
 */
function initNavbarAuth() {
  const user = getCurrentUser();
  const authNavContainer = document.getElementById('navbar-auth-section');
  const myRegsLink = document.getElementById('nav-my-registrations');
  const adminLink = document.getElementById('nav-admin-link');

  if (myRegsLink) {
    if (user && user.role === 'student') {
      myRegsLink.style.display = 'inline-flex';
      const myCount = getRegistrationsByStudent(user.email).length;
      const countBadge = document.getElementById('nav-reg-badge');
      if (countBadge) {
        countBadge.textContent = myCount;
        countBadge.style.display = myCount > 0 ? 'inline-flex' : 'none';
      }
    } else {
      myRegsLink.style.display = 'none';
    }
  }

  if (adminLink) {
    if (user && user.role === 'admin') {
      adminLink.style.display = 'inline-flex';
    } else {
      adminLink.style.display = 'none';
    }
  }

  if (authNavContainer) {
    if (user) {
      // User is logged in
      const initials = (user.name || 'User')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const roleBadge = user.role === 'admin' 
        ? `<span class="badge badge-admin">Admin</span>` 
        : `<span class="badge badge-student">Student</span>`;

      authNavContainer.innerHTML = `
        <div class="user-profile-menu">
          <div class="user-chip" id="user-chip-toggle">
            <div class="user-avatar">${initials}</div>
            <div class="user-meta">
              <span class="user-name">${user.name}</span>
              ${roleBadge}
            </div>
            <i class="fa-solid fa-chevron-down chip-arrow"></i>
          </div>
          <div class="dropdown-menu" id="user-dropdown">
            <div class="dropdown-header">
              <strong>${user.name}</strong>
              <small>${user.email}</small>
              <div class="dept-text">${user.department || (user.role === 'admin' ? 'Event Administration' : 'Student')}</div>
            </div>
            <hr class="dropdown-divider">
            ${user.role === 'admin' ? `
              <a href="admin/dashboard.html" class="dropdown-item">
                <i class="fa-solid fa-gauge"></i> Admin Dashboard
              </a>
              <a href="admin/manage-events.html" class="dropdown-item">
                <i class="fa-solid fa-calendar-check"></i> Manage Events
              </a>
              <a href="admin/manage-registrations.html" class="dropdown-item">
                <i class="fa-solid fa-users-viewfinder"></i> Manage Registrations
              </a>
            ` : `
              <a href="my-registrations.html" class="dropdown-item">
                <i class="fa-solid fa-ticket"></i> My Registrations
              </a>
              <a href="events.html" class="dropdown-item">
                <i class="fa-solid fa-compass"></i> Explore Events
              </a>
            `}
            <hr class="dropdown-divider">
            <button type="button" class="dropdown-item text-danger" id="btn-navbar-logout">
              <i class="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
          </div>
        </div>
      `;

      // Setup dropdown toggle
      const toggle = authNavContainer.querySelector('#user-chip-toggle');
      const dropdown = authNavContainer.querySelector('#user-dropdown');
      if (toggle && dropdown) {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => {
          dropdown.classList.remove('show');
        });
      }

      // Setup logout
      const logoutBtn = authNavContainer.querySelector('#btn-navbar-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          logoutUser();
        });
      }
    } else {
      // Guest view
      authNavContainer.innerHTML = `
        <div class="auth-buttons-group">
          <a href="login.html" class="btn btn-ghost">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> Log In
          </a>
          <a href="signup.html" class="btn btn-primary">
            <i class="fa-solid fa-user-plus"></i> Sign Up
          </a>
        </div>
      `;
    }
  }

  // Mobile menu hamburger toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav-drawer');
  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      mobileToggle.classList.toggle('active');
    });
  }
}

/**
 * Handle Login Form and Signup Form bindings if present on page
 */
function setupAuthForms() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();
      const remember = document.getElementById('login-remember')?.checked;

      if (!email || !password) {
        showToast("Please enter both email and password.", "warning");
        return;
      }

      // Authenticate
      const user = getUserByEmail(email);
      if (!user) {
        showToast("No account found with this email. Please check your credentials or register.", "error", "Login Failed");
        return;
      }

      if (user.password !== password) {
        showToast("Incorrect password. Please try again.", "error", "Invalid Password");
        return;
      }

      // Successful login
      setCurrentUser(user);
      showToast(`Welcome back, ${user.name}!`, "success", "Login Successful");

      // Check redirect URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');

      setTimeout(() => {
        if (user.role === 'admin') {
          window.location.href = redirect ? redirect : 'admin/dashboard.html';
        } else {
          window.location.href = redirect ? redirect : 'events.html';
        }
      }, 700);
    });
  }

  // Quick fill demo buttons on login page
  const fillAdminBtn = document.getElementById('fill-demo-admin');
  if (fillAdminBtn) {
    fillAdminBtn.addEventListener('click', () => {
      const emailField = document.getElementById('login-email');
      const passField = document.getElementById('login-password');
      if (emailField && passField) {
        emailField.value = 'admin@campus.com';
        passField.value = 'admin123';
        showToast("Admin demo credentials loaded. Click 'Sign In' to enter.", "info");
      }
    });
  }

  const fillStudentBtn = document.getElementById('fill-demo-student');
  if (fillStudentBtn) {
    fillStudentBtn.addEventListener('click', () => {
      const emailField = document.getElementById('login-email');
      const passField = document.getElementById('login-password');
      if (emailField && passField) {
        emailField.value = 'alex@student.campus.edu';
        passField.value = 'student123';
        showToast("Student demo credentials loaded. Click 'Sign In' to enter.", "info");
      }
    });
  }

  // Student Signup Form
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim().toLowerCase();
      const studentId = document.getElementById('signup-studentid').value.trim();
      const department = document.getElementById('signup-department').value;
      const phone = document.getElementById('signup-phone').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      const agreeTerms = document.getElementById('signup-terms')?.checked;

      // Basic validations
      if (!name || !email || !studentId || !department || !password) {
        showToast("Please fill in all required fields.", "warning", "Validation Error");
        return;
      }

      if (password.length < 6) {
        showToast("Password must be at least 6 characters long.", "warning", "Weak Password");
        return;
      }

      if (password !== confirmPassword) {
        showToast("Passwords do not match. Please verify.", "error", "Password Mismatch");
        return;
      }

      if (agreeTerms === false) {
        showToast("Please accept the campus terms and conditions.", "warning");
        return;
      }

      const res = registerUser({
        name,
        email,
        studentId,
        department,
        phone,
        password,
        role: 'student'
      });

      if (!res.success) {
        showToast(res.message, "error", "Registration Failed");
        return;
      }

      // Auto sign in user
      setCurrentUser(res.user);
      showToast("Account created successfully! Welcome to Campus Events.", "success", "Welcome!");

      setTimeout(() => {
        window.location.href = 'events.html';
      }, 900);
    });
  }
}

/**
 * Logout user cleanly and redirect
 */
function logoutUser(redirectPath = '../index.html') {
  clearSession();
  showToast("You have been successfully logged out.", "info", "Signed Out");
  setTimeout(() => {
    // If inside admin subfolder or root
    const isInAdmin = window.location.pathname.includes('/admin/');
    window.location.href = isInAdmin ? '../login.html' : 'login.html';
  }, 600);
}

/**
 * Protect admin pages from unauthorized or student access
 */
function protectAdminRoute() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    // Save current path to redirect back after admin login
    const current = encodeURIComponent(window.location.pathname.split('/').pop());
    // Direct back to root login page
    window.location.href = `../login.html?redirect=admin/${current}&error=unauthorized`;
  }
}

/**
 * Protect student pages like my-registrations.html
 */
function protectStudentRoute() {
  const user = getCurrentUser();
  if (!user) {
    const current = encodeURIComponent(window.location.pathname.split('/').pop());
    window.location.href = `login.html?redirect=${current}&reason=login_required`;
  }
}
