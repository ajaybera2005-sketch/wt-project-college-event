/**
 * Campus Event Management System
 * storage.js - Central Data Layer & LocalStorage Management
 */

const STORAGE_KEYS = {
  EVENTS: 'campus_events_data',
  USERS: 'campus_users_data',
  REGISTRATIONS: 'campus_registrations_data',
  CURRENT_USER: 'campus_current_session',
  SETTINGS: 'campus_system_settings'
};

// High-quality SVG banners / images for built-in visual beauty
const EVENT_POSTER_PRESETS = {
  hackathon: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  cultural: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
  ai_workshop: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
  seminar: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
  blood_drive: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
  robotics: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
  web3: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80"
};

// Seed sample events
const SEED_EVENTS = [
  {
    id: "evt-101",
    title: "HackCampus 2026: 36-Hour National Hackathon",
    category: "Technical Events",
    description: "Join over 500 collegiate developers, designers, and innovators for our flagship annual 36-hour hackathon. Build real-world solutions across AI, Web3, FinTech, and GreenTech with mentorship from top tech leaders. Winning teams receive ₹1,50,000 in cash prizes, incubator opportunities, and cloud credits.",
    poster: EVENT_POSTER_PRESETS.hackathon,
    date: "2026-12-15",
    time: "09:00 AM",
    venue: "Innovation Hub & Central Auditorium",
    organizer: "Campus Tech & Innovation Club",
    capacity: 120,
    deadline: "2026-12-10",
    featured: true,
    createdAt: "2026-11-10T09:00:00Z"
  },
  {
    id: "evt-102",
    title: "Spandan 2026: Annual Cultural Extravaganza",
    category: "Cultural Events",
    description: "Experience the grandest cultural celebration of the year! Featuring 18 inter-college competitions including battle of the bands, classical fusion dance, fashion symphony, stand-up comedy, and an electrifying celebrity star night on the main stage.",
    poster: EVENT_POSTER_PRESETS.cultural,
    date: "2026-12-22",
    time: "04:30 PM",
    venue: "Open Air Amphitheatre, Campus Ground",
    organizer: "Cultural Affairs Council",
    capacity: 350,
    deadline: "2026-12-20",
    featured: true,
    createdAt: "2026-11-12T11:30:00Z"
  },
  {
    id: "evt-103",
    title: "Campus Champions League: Annual Sports Meet",
    category: "Sports Events",
    description: "Get ready for high-octane collegiate athletics! The tournament includes Inter-Department 7-a-side Football, Basketball Shootouts, Badminton Singles & Doubles, and 100m/400m Track events. Register your squads before slots fill out.",
    poster: EVENT_POSTER_PRESETS.sports,
    date: "2026-12-18",
    time: "08:00 AM",
    venue: "University Sports Arena & Athletic Complex",
    organizer: "Department of Physical Education",
    capacity: 80,
    deadline: "2026-12-14",
    featured: true,
    createdAt: "2026-11-14T08:00:00Z"
  },
  {
    id: "evt-104",
    title: "Mastering Generative AI & LLM Systems Workshop",
    category: "Workshops",
    description: "An intensive full-day hands-on workshop guiding students through fine-tuning transformers, building RAG applications using vector databases, and deploying autonomous agent swarms. Participants must bring laptops with Python 3.10+ installed.",
    poster: EVENT_POSTER_PRESETS.ai_workshop,
    date: "2026-12-08",
    time: "10:00 AM",
    venue: "Turing Lab 402, Computer Science Wing",
    organizer: "Google Developer Student Club (GDSC)",
    capacity: 50,
    deadline: "2026-12-06",
    featured: true,
    createdAt: "2026-11-15T14:00:00Z"
  },
  {
    id: "evt-105",
    title: "Global Leadership & Deep Tech Summit 2026",
    category: "Seminars",
    description: "Keynote talks, panel discussions, and founder fireside chats on Quantum Computing, Neurotechnology, and Ethics of Frontier AI. Key speakers include industry veterans from DeepMind, Microsoft Research, and prominent venture capitals.",
    poster: EVENT_POSTER_PRESETS.seminar,
    date: "2026-12-28",
    time: "02:00 PM",
    venue: "Dr. APJ Abdul Kalam Convention Hall",
    organizer: "Office of Career Services & Alumni Affairs",
    capacity: 200,
    deadline: "2026-12-26",
    featured: false,
    createdAt: "2026-11-16T16:00:00Z"
  },
  {
    id: "evt-106",
    title: "Youth for Life: Blood Donation & Health Camp",
    category: "Other Events",
    description: "Join hands in saving lives! Annual voluntary blood donation drive organized in association with the Red Cross Society and City General Hospital. Donors will receive certified certificates, refreshments, and free health checkups.",
    poster: EVENT_POSTER_PRESETS.blood_drive,
    date: "2026-12-12",
    time: "09:30 AM",
    venue: "Student Activity Center (SAC) Lounge",
    organizer: "National Service Scheme (NSS) Unit",
    capacity: 100,
    deadline: "2026-12-11",
    featured: false,
    createdAt: "2026-11-17T10:00:00Z"
  },
  {
    id: "evt-107",
    title: "Autonomous Robotics Challenge (Capacity Full Demo)",
    category: "Technical Events",
    description: "A fast-paced line follower and maze solving obstacle challenge. Fully booked demonstration event to showcase maximum capacity handling on registration system.",
    poster: EVENT_POSTER_PRESETS.robotics,
    date: "2026-12-30",
    time: "11:00 AM",
    venue: "Robotics Core Lab 105",
    organizer: "Robotics & Automation Society",
    capacity: 2, // Low capacity to demo capacity lock
    deadline: "2026-12-29",
    featured: false,
    createdAt: "2026-11-18T12:00:00Z"
  },
  {
    id: "evt-108",
    title: "Web3 Smart Contracts Bootcamp (Past Deadline Demo)",
    category: "Workshops",
    description: "Deep dive into Solidity and smart contract security auditing. This event is a demo for past registration deadline validation.",
    poster: EVENT_POSTER_PRESETS.web3,
    date: "2026-11-20",
    time: "10:00 AM",
    venue: "Lab 201, Block B",
    organizer: "Blockchain Research Collective",
    capacity: 40,
    deadline: "2026-11-18", // Already passed relative to 2026-11-22
    featured: false,
    createdAt: "2026-11-01T10:00:00Z"
  }
];

// Seed sample users
const SEED_USERS = [
  {
    id: "usr-admin",
    name: "Admin Officer",
    email: "admin@campus.com",
    password: "admin123",
    role: "admin",
    department: "Dean Office & Event Cell",
    studentId: "ADM-001",
    phone: "+91 98765 00000",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "usr-101",
    name: "Alex Johnson",
    email: "alex@student.campus.edu",
    password: "student123",
    role: "student",
    department: "Computer Science & Engineering",
    studentId: "CS-2024-042",
    phone: "+91 98765 43210",
    createdAt: "2026-11-01T10:00:00Z"
  },
  {
    id: "usr-102",
    name: "Priya Sharma",
    email: "priya@student.campus.edu",
    password: "student123",
    role: "student",
    department: "Electronics & Communication",
    studentId: "EC-2023-108",
    phone: "+91 98765 43211",
    createdAt: "2026-11-02T11:00:00Z"
  },
  {
    id: "usr-103",
    name: "Rohan Varma",
    email: "rohan@student.campus.edu",
    password: "student123",
    role: "student",
    department: "Mechanical Engineering",
    studentId: "ME-2024-019",
    phone: "+91 98765 43212",
    createdAt: "2026-11-03T12:00:00Z"
  }
];

// Seed sample registrations
const SEED_REGISTRATIONS = [
  {
    id: "reg-501",
    eventId: "evt-101",
    eventTitle: "HackCampus 2026: 36-Hour National Hackathon",
    eventDate: "2026-12-15",
    studentId: "usr-101",
    studentName: "Alex Johnson",
    studentEmail: "alex@student.campus.edu",
    studentDepartment: "Computer Science & Engineering",
    studentRollNo: "CS-2024-042",
    phone: "+91 98765 43210",
    status: "Approved", // Approved
    registeredAt: "2026-11-15T14:20:00Z",
    adminNotes: "Team leader confirmed"
  },
  {
    id: "reg-502",
    eventId: "evt-102",
    eventTitle: "Spandan 2026: Annual Cultural Extravaganza",
    eventDate: "2026-12-22",
    studentId: "usr-101",
    studentName: "Alex Johnson",
    studentEmail: "alex@student.campus.edu",
    studentDepartment: "Computer Science & Engineering",
    studentRollNo: "CS-2024-042",
    phone: "+91 98765 43210",
    status: "Pending", // Pending
    registeredAt: "2026-11-18T16:45:00Z",
    adminNotes: ""
  },
  {
    id: "reg-503",
    eventId: "evt-104",
    eventTitle: "Mastering Generative AI & LLM Systems Workshop",
    eventDate: "2026-12-08",
    studentId: "usr-102",
    studentName: "Priya Sharma",
    studentEmail: "priya@student.campus.edu",
    studentDepartment: "Electronics & Communication",
    studentRollNo: "EC-2023-108",
    phone: "+91 98765 43211",
    status: "Approved",
    registeredAt: "2026-11-16T09:15:00Z",
    adminNotes: "Prerequisites verified"
  },
  {
    id: "reg-504",
    eventId: "evt-103",
    eventTitle: "Campus Champions League: Annual Sports Meet",
    eventDate: "2026-12-18",
    studentId: "usr-103",
    studentName: "Rohan Varma",
    studentEmail: "rohan@student.campus.edu",
    studentDepartment: "Mechanical Engineering",
    studentRollNo: "ME-2024-019",
    phone: "+91 98765 43212",
    status: "Pending",
    registeredAt: "2026-11-19T10:30:00Z",
    adminNotes: ""
  },
  {
    id: "reg-505",
    eventId: "evt-107",
    eventTitle: "Autonomous Robotics Challenge (Capacity Full Demo)",
    eventDate: "2026-12-30",
    studentId: "usr-102",
    studentName: "Priya Sharma",
    studentEmail: "priya@student.campus.edu",
    studentDepartment: "Electronics & Communication",
    studentRollNo: "EC-2023-108",
    phone: "+91 98765 43211",
    status: "Approved",
    registeredAt: "2026-11-19T11:00:00Z",
    adminNotes: ""
  },
  {
    id: "reg-506",
    eventId: "evt-107",
    eventTitle: "Autonomous Robotics Challenge (Capacity Full Demo)",
    eventDate: "2026-12-30",
    studentId: "usr-103",
    studentName: "Rohan Varma",
    studentEmail: "rohan@student.campus.edu",
    studentDepartment: "Mechanical Engineering",
    studentRollNo: "ME-2024-019",
    phone: "+91 98765 43212",
    status: "Approved",
    registeredAt: "2026-11-19T11:05:00Z",
    adminNotes: ""
  },
  {
    id: "reg-507",
    eventId: "evt-105",
    eventTitle: "Global Leadership & Deep Tech Summit 2026",
    eventDate: "2026-12-28",
    studentId: "usr-103",
    studentName: "Rohan Varma",
    studentEmail: "rohan@student.campus.edu",
    studentDepartment: "Mechanical Engineering",
    studentRollNo: "ME-2024-019",
    phone: "+91 98765 43212",
    status: "Rejected",
    registeredAt: "2026-11-17T15:20:00Z",
    adminNotes: "Duplicate request or schedule conflict"
  }
];

/**
 * Initialize storage with default datasets if empty
 */
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(SEED_EVENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(SEED_REGISTRATIONS));
  }
}

// Automatically invoke initialization
initStorage();

/* ==========================================================================
   EVENT DATA ACCESS METHODS
   ========================================================================== */

function getEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading events from storage:", err);
    return [];
  }
}

function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return true;
  } catch (err) {
    console.error("Error saving events to storage:", err);
    return false;
  }
}

function getEventById(id) {
  const events = getEvents();
  return events.find(e => e.id === id) || null;
}

function addEvent(eventData) {
  const events = getEvents();
  const newEvent = {
    id: "evt-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    createdAt: new Date().toISOString(),
    featured: eventData.featured || false,
    ...eventData
  };
  events.unshift(newEvent);
  saveEvents(events);
  return newEvent;
}

function updateEvent(id, updatedFields) {
  const events = getEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...updatedFields, updatedAt: new Date().toISOString() };
  saveEvents(events);
  return events[idx];
}

function deleteEvent(id) {
  const events = getEvents();
  const filtered = events.filter(e => e.id !== id);
  if (filtered.length === events.length) return false;
  saveEvents(filtered);

  // Also remove or flag associated registrations
  const regs = getRegistrations();
  const updatedRegs = regs.filter(r => r.eventId !== id);
  saveRegistrations(updatedRegs);
  return true;
}

/* ==========================================================================
   USER DATA ACCESS METHODS
   ========================================================================== */

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading users:", err);
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  } catch (err) {
    console.error("Error saving users:", err);
    return false;
  }
}

function getUserByEmail(email) {
  if (!email) return null;
  const users = getUsers();
  return users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase()) || null;
}

function getUserById(id) {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

function registerUser(userData) {
  const users = getUsers();
  const existing = getUserByEmail(userData.email);
  if (existing) {
    return { success: false, message: "An account with this email address already exists." };
  }

  const newUser = {
    id: "usr-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    role: userData.role || 'student',
    createdAt: new Date().toISOString(),
    ...userData
  };

  users.push(newUser);
  saveUsers(users);
  return { success: true, user: newUser };
}

/* ==========================================================================
   CURRENT SESSION / AUTH STATE
   ========================================================================== */

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Error reading current user:", err);
    return null;
  }
}

function setCurrentUser(user) {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      // Don't save password in session storage
      const safeUser = { ...user };
      delete safeUser.password;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    }
    return true;
  } catch (err) {
    console.error("Error setting session user:", err);
    return false;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

function isAdmin() {
  const user = getCurrentUser();
  return !!(user && user.role === 'admin');
}

function isStudent() {
  const user = getCurrentUser();
  return !!(user && user.role === 'student');
}

/* ==========================================================================
   REGISTRATIONS MANAGEMENT
   ========================================================================== */

function getRegistrations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading registrations:", err);
    return [];
  }
}

function saveRegistrations(registrations) {
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
    return true;
  } catch (err) {
    console.error("Error saving registrations:", err);
    return false;
  }
}

function getRegistrationsByStudent(studentEmailOrId) {
  const regs = getRegistrations();
  return regs.filter(r => 
    r.studentEmail?.toLowerCase() === studentEmailOrId?.toLowerCase() || 
    r.studentId === studentEmailOrId
  );
}

function getRegistrationsByEvent(eventId) {
  const regs = getRegistrations();
  return regs.filter(r => r.eventId === eventId);
}

function getEventConfirmedCount(eventId) {
  // Approved + Pending both consume or hold a seat
  const regs = getRegistrations();
  return regs.filter(r => r.eventId === eventId && (r.status === 'Approved' || r.status === 'Pending')).length;
}

function hasStudentRegistered(eventId, studentEmail) {
  if (!studentEmail) return false;
  const regs = getRegistrations();
  return regs.some(r => 
    r.eventId === eventId && 
    r.studentEmail.toLowerCase() === studentEmail.toLowerCase()
  );
}

function createRegistration(regData) {
  const events = getEvents();
  const event = events.find(e => e.id === regData.eventId);

  if (!event) {
    return { success: false, message: "Target event does not exist." };
  }

  // Check deadline
  if (event.deadline) {
    const deadlineDate = new Date(event.deadline + 'T23:59:59');
    const now = new Date();
    if (now > deadlineDate) {
      return { success: false, message: "Registration is closed. The deadline for this event has passed." };
    }
  }

  // Check duplicate
  if (hasStudentRegistered(event.id, regData.studentEmail)) {
    return { success: false, message: "You are already registered for this event." };
  }

  // Check capacity
  const confirmedCount = getEventConfirmedCount(event.id);
  if (confirmedCount >= parseInt(event.capacity, 10)) {
    return { success: false, message: "Registration is closed. This event has reached maximum capacity." };
  }

  const newReg = {
    id: "reg-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.date,
    studentId: regData.studentId || "guest",
    studentName: regData.studentName,
    studentEmail: regData.studentEmail,
    studentDepartment: regData.studentDepartment || "General",
    studentRollNo: regData.studentRollNo || "N/A",
    phone: regData.phone || "",
    status: "Pending", // Default status per prompt requirement
    registeredAt: new Date().toISOString(),
    adminNotes: ""
  };

  const regs = getRegistrations();
  regs.unshift(newReg);
  saveRegistrations(regs);

  return { success: true, registration: newReg };
}

function updateRegistrationStatus(regId, newStatus, adminNotes = "") {
  const regs = getRegistrations();
  const idx = regs.findIndex(r => r.id === regId);
  if (idx === -1) return { success: false, message: "Registration not found" };

  regs[idx].status = newStatus;
  if (adminNotes) {
    regs[idx].adminNotes = adminNotes;
  }
  regs[idx].updatedAt = new Date().toISOString();

  saveRegistrations(regs);
  return { success: true, registration: regs[idx] };
}

function deleteRegistration(regId) {
  const regs = getRegistrations();
  const filtered = regs.filter(r => r.id !== regId);
  if (filtered.length === regs.length) return false;
  saveRegistrations(filtered);
  return true;
}

/* ==========================================================================
   UI UTILITIES: TOAST NOTIFICATIONS & MODALS
   ========================================================================== */

/**
 * Modern floating Toast notification
 * @param {string} message - Message text
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {string} [title] - Optional title
 * @param {number} [duration=3500] - Duration in ms
 */
function showToast(message, type = 'info', title = '', duration = 3800) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };
  const icon = iconMap[type] || iconMap.info;

  const defaultTitles = {
    success: 'Success',
    error: 'Error',
    warning: 'Attention',
    info: 'Information'
  };

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fa-solid ${icon}"></i>
    </div>
    <div class="toast-body">
      <div class="toast-title">${title || defaultTitles[type]}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close">&times;</button>
    <div class="toast-progress">
      <div class="toast-progress-bar" style="animation-duration: ${duration}ms"></div>
    </div>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  const removeToast = () => {
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  };

  closeBtn.addEventListener('click', removeToast);
  container.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  setTimeout(removeToast, duration);
}

/**
 * Custom Confirmation Modal dialog
 */
function showConfirmModal({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false,
  onConfirm = () => {}
}) {
  const existing = document.getElementById('custom-confirm-modal');
  if (existing) existing.remove();

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'custom-confirm-modal';
  modalOverlay.className = 'modal-backdrop active';

  modalOverlay.innerHTML = `
    <div class="modal-dialog modal-confirm-box">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-icon-badge ${isDanger ? 'badge-danger' : 'badge-primary'}">
            <i class="fa-solid ${isDanger ? 'fa-triangle-exclamation' : 'fa-circle-question'}"></i>
          </div>
          <h3 class="modal-title">${title}</h3>
          <button class="btn-close-modal" id="modal-close-x">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-text">${message}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="modal-cancel-btn">${cancelText}</button>
          <button type="button" class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm-btn">${confirmText}</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const cleanup = () => {
    modalOverlay.classList.remove('active');
    setTimeout(() => modalOverlay.remove(), 250);
  };

  modalOverlay.querySelector('#modal-close-x').addEventListener('click', cleanup);
  modalOverlay.querySelector('#modal-cancel-btn').addEventListener('click', cleanup);
  modalOverlay.querySelector('#modal-confirm-btn').addEventListener('click', () => {
    cleanup();
    onConfirm();
  });

  // Close on backdrop click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) cleanup();
  });
}

/**
 * Format date for friendly human display (e.g. "Dec 15, 2026")
 */
function formatDate(dateStr) {
  if (!dateStr) return 'TBA';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format ISO datetime for friendly human display
 */
function formatDateTime(isoStr) {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? isoStr : d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoStr;
  }
}
