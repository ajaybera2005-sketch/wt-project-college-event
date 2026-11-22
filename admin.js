/**
 * Campus Event Management System
 * admin.js - Admin Dashboard, Event CRUD & Registration Moderation
 */

document.addEventListener('DOMContentLoaded', () => {
  // Enforce admin security check on all admin pages
  protectAdminRoute();

  initAdminCommonUI();

  // Page specific initializations
  if (document.getElementById('admin-dashboard-view')) {
    initAdminDashboard();
  }

  if (document.getElementById('manage-events-table-body')) {
    initManageEventsPage();
  }

  if (document.getElementById('manage-registrations-table-body')) {
    initManageRegistrationsPage();
  }
});

/* ==========================================================================
   COMMON ADMIN UI & SIDEBAR
   ========================================================================== */
function initAdminCommonUI() {
  const user = getCurrentUser();
  if (user) {
    const adminNameEl = document.getElementById('admin-display-name');
    const adminEmailEl = document.getElementById('admin-display-email');
    const adminAvatarEl = document.getElementById('admin-display-avatar');

    if (adminNameEl) adminNameEl.textContent = user.name || 'Admin Officer';
    if (adminEmailEl) adminEmailEl.textContent = user.email || 'admin@campus.com';
    if (adminAvatarEl) {
      const initials = (user.name || 'Admin')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      adminAvatarEl.textContent = initials;
    }
  }

  // Sidebar toggle for mobile/tablets
  const sidebarToggle = document.getElementById('admin-sidebar-toggle');
  const adminSidebar = document.getElementById('admin-sidebar');
  if (sidebarToggle && adminSidebar) {
    sidebarToggle.addEventListener('click', () => {
      adminSidebar.classList.toggle('collapsed');
      adminSidebar.classList.toggle('show');
    });
  }

  // Admin Logout buttons
  const logoutButtons = document.querySelectorAll('.btn-admin-logout');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showConfirmModal({
        title: "Sign Out of Admin Panel?",
        message: "You will be returned to the campus login page.",
        confirmText: "Sign Out",
        cancelText: "Stay",
        isDanger: false,
        onConfirm: () => {
          clearSession();
          window.location.href = '../login.html';
        }
      });
    });
  });
}

/* ==========================================================================
   ADMIN DASHBOARD OVERVIEW
   ========================================================================== */
function initAdminDashboard() {
  updateDashboardMetrics();
  renderDashboardCharts();
  renderDashboardRecentRegistrations();
  renderDashboardUpcomingEvents();
}

function updateDashboardMetrics() {
  const events = getEvents();
  const users = getUsers();
  const registrations = getRegistrations();

  const totalEvents = events.length;
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalRegistrations = registrations.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => e.date >= todayStr).length;
  const pendingRegistrations = registrations.filter(r => r.status === 'Pending').length;

  const elTotalEvents = document.getElementById('stat-total-events');
  const elTotalStudents = document.getElementById('stat-total-students');
  const elTotalRegistrations = document.getElementById('stat-total-registrations');
  const elUpcomingEvents = document.getElementById('stat-upcoming-events');
  const elPendingRegistrations = document.getElementById('stat-pending-registrations');

  if (elTotalEvents) elTotalEvents.textContent = totalEvents;
  if (elTotalStudents) elTotalStudents.textContent = totalStudents;
  if (elTotalRegistrations) elTotalRegistrations.textContent = totalRegistrations;
  if (elUpcomingEvents) elUpcomingEvents.textContent = upcomingEvents;
  if (elPendingRegistrations) {
    elPendingRegistrations.textContent = pendingRegistrations;
    if (pendingRegistrations > 0) {
      elPendingRegistrations.classList.add('badge-pulse');
    }
  }
}

function renderDashboardCharts() {
  const events = getEvents();
  const registrations = getRegistrations();

  // Category breakdown
  const categoryCounts = {
    'Technical Events': 0,
    'Cultural Events': 0,
    'Sports Events': 0,
    'Workshops': 0,
    'Seminars': 0,
    'Other Events': 0
  };

  events.forEach(e => {
    if (categoryCounts.hasOwnProperty(e.category)) {
      categoryCounts[e.category]++;
    } else {
      categoryCounts['Other Events']++;
    }
  });

  const catChartContainer = document.getElementById('dashboard-category-chart');
  if (catChartContainer) {
    const total = events.length || 1;
    catChartContainer.innerHTML = Object.entries(categoryCounts).map(([cat, count]) => {
      const pct = Math.round((count / total) * 100);
      return `
        <div class="chart-bar-item">
          <div class="chart-label-row">
            <span class="chart-category-name">${cat}</span>
            <span class="chart-category-count"><strong>${count}</strong> (${pct}%)</span>
          </div>
          <div class="chart-progress-bg">
            <div class="chart-progress-fill cat-fill-${cat.toLowerCase().split(' ')[0]}" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Registration Status Breakdown
  const statusCounts = {
    Approved: registrations.filter(r => r.status === 'Approved').length,
    Pending: registrations.filter(r => r.status === 'Pending').length,
    Rejected: registrations.filter(r => r.status === 'Rejected').length
  };
  const regTotal = registrations.length || 1;

  const statusContainer = document.getElementById('dashboard-status-distribution');
  if (statusContainer) {
    const appPct = Math.round((statusCounts.Approved / regTotal) * 100);
    const penPct = Math.round((statusCounts.Pending / regTotal) * 100);
    const rejPct = Math.round((statusCounts.Rejected / regTotal) * 100);

    statusContainer.innerHTML = `
      <div class="status-summary-pills">
        <div class="status-pill-item approved">
          <div class="pill-title"><i class="fa-solid fa-circle-check"></i> Approved</div>
          <div class="pill-number">${statusCounts.Approved}</div>
          <div class="pill-sub">${appPct}% of total</div>
        </div>
        <div class="status-pill-item pending">
          <div class="pill-title"><i class="fa-solid fa-clock"></i> Pending</div>
          <div class="pill-number">${statusCounts.Pending}</div>
          <div class="pill-sub">${penPct}% of total</div>
        </div>
        <div class="status-pill-item rejected">
          <div class="pill-title"><i class="fa-solid fa-circle-xmark"></i> Rejected</div>
          <div class="pill-number">${statusCounts.Rejected}</div>
          <div class="pill-sub">${rejPct}% of total</div>
        </div>
      </div>
    `;
  }
}

function renderDashboardRecentRegistrations() {
  const container = document.getElementById('dashboard-recent-registrations-tbody');
  if (!container) return;

  const registrations = getRegistrations();
  const recent = registrations.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No student registrations recorded yet.</td></tr>`;
    return;
  }

  container.innerHTML = recent.map(r => {
    const statusClasses = {
      Approved: 'badge-status-approved',
      Pending: 'badge-status-pending',
      Rejected: 'badge-status-rejected'
    };

    return `
      <tr>
        <td>
          <div class="student-cell">
            <span class="student-name font-semibold">${r.studentName}</span>
            <small class="student-email text-muted">${r.studentEmail}</small>
          </div>
        </td>
        <td>
          <span class="event-title-cell font-medium">${r.eventTitle}</span>
        </td>
        <td>
          <span class="badge ${statusClasses[r.status] || 'badge-status-pending'}">${r.status}</span>
        </td>
        <td>
          <small class="text-muted">${formatDate(r.eventDate)}</small>
        </td>
        <td>
          <small class="text-muted">${formatDateTime(r.registeredAt)}</small>
        </td>
        <td>
          <div class="action-btn-group">
            ${r.status === 'Pending' ? `
              <button type="button" class="btn btn-icon btn-action-approve" title="Approve Registration" onclick="quickDashboardStatusUpdate('${r.id}', 'Approved')">
                <i class="fa-solid fa-check"></i>
              </button>
              <button type="button" class="btn btn-icon btn-action-reject" title="Reject Registration" onclick="quickDashboardStatusUpdate('${r.id}', 'Rejected')">
                <i class="fa-solid fa-xmark"></i>
              </button>
            ` : `
              <a href="manage-registrations.html" class="btn btn-icon btn-ghost" title="Manage in Registrations Tab">
                <i class="fa-solid fa-arrow-right"></i>
              </a>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderDashboardUpcomingEvents() {
  const container = document.getElementById('dashboard-upcoming-events-list');
  if (!container) return;

  const events = getEvents();
  const upcoming = events.slice(0, 4);

  if (upcoming.length === 0) {
    container.innerHTML = `<div class="empty-state py-3">No events created. Add an event to begin.</div>`;
    return;
  }

  container.innerHTML = upcoming.map(e => {
    const regCount = getEventConfirmedCount(e.id);
    return `
      <div class="mini-event-item">
        <img src="${e.poster || '../assets/images/default-event.jpg'}" alt="" class="mini-event-thumb" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=120&q=80'">
        <div class="mini-event-info">
          <h4 class="mini-event-title"><a href="manage-events.html">${e.title}</a></h4>
          <div class="mini-event-sub">
            <span><i class="fa-regular fa-calendar"></i> ${formatDate(e.date)}</span>
            <span><i class="fa-solid fa-users"></i> ${regCount}/${e.capacity}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function quickDashboardStatusUpdate(regId, newStatus) {
  const res = updateRegistrationStatus(regId, newStatus);
  if (res.success) {
    showToast(`Registration marked as ${newStatus}.`, "success");
    updateDashboardMetrics();
    renderDashboardCharts();
    renderDashboardRecentRegistrations();
  }
}

/* ==========================================================================
   MANAGE EVENTS PAGE
   ========================================================================== */
let manageEventsState = [];
let eventSearchQuery = '';
let eventCategoryFilter = 'all';

function initManageEventsPage() {
  manageEventsState = getEvents();
  renderManageEventsTable();
  setupManageEventsListeners();
}

function setupManageEventsListeners() {
  const searchInput = document.getElementById('manage-event-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      eventSearchQuery = e.target.value.trim().toLowerCase();
      renderManageEventsTable();
    });
  }

  const catSelect = document.getElementById('manage-event-category-filter');
  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      eventCategoryFilter = e.target.value;
      renderManageEventsTable();
    });
  }

  const btnAddNew = document.getElementById('btn-open-add-event-modal');
  if (btnAddNew) {
    btnAddNew.addEventListener('click', () => {
      openEventModal();
    });
  }
}

function renderManageEventsTable() {
  const tbody = document.getElementById('manage-events-table-body');
  const countBadge = document.getElementById('events-table-count');
  if (!tbody) return;

  manageEventsState = getEvents();

  let filtered = manageEventsState.filter(e => {
    if (eventCategoryFilter !== 'all' && e.category !== eventCategoryFilter) return false;
    if (eventSearchQuery) {
      return e.title.toLowerCase().includes(eventSearchQuery) ||
             e.organizer.toLowerCase().includes(eventSearchQuery) ||
             e.venue.toLowerCase().includes(eventSearchQuery);
    }
    return true;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} total`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="empty-state">
            <i class="fa-solid fa-calendar-xmark text-muted fa-2x mb-2"></i>
            <h4>No Events Found</h4>
            <p class="text-muted">No events matching your search or filter.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(e => {
    const regCount = getEventConfirmedCount(e.id);
    const capacity = parseInt(e.capacity, 10) || 100;
    const fillPct = Math.min(100, Math.round((regCount / capacity) * 100));

    const posterUrl = e.poster || '../assets/images/default-event.jpg';

    return `
      <tr data-id="${e.id}">
        <td>
          <div class="table-event-cell">
            <img src="${posterUrl}" alt="" class="table-event-thumb" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=120&q=80'">
            <div class="table-event-info">
              <span class="font-semibold event-title-text">${e.title}</span>
              <small class="text-muted"><i class="fa-solid fa-building-columns"></i> ${e.organizer}</small>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${getCategoryBadgeClass(e.category)}">${e.category}</span>
        </td>
        <td>
          <div class="event-datetime-cell">
            <span><i class="fa-regular fa-calendar"></i> ${formatDate(e.date)}</span>
            <small class="text-muted"><i class="fa-regular fa-clock"></i> ${e.time || 'TBA'}</small>
          </div>
        </td>
        <td>
          <span class="venue-cell-text"><i class="fa-solid fa-location-dot"></i> ${e.venue}</span>
        </td>
        <td>
          <div class="capacity-bar-cell">
            <div class="capacity-text">
              <span><strong>${regCount}</strong> / ${capacity}</span>
              <small>${fillPct}%</small>
            </div>
            <div class="mini-progress-bar">
              <div class="mini-progress-fill ${fillPct >= 90 ? 'fill-danger' : fillPct >= 70 ? 'fill-warning' : ''}" style="width: ${fillPct}%"></div>
            </div>
          </div>
        </td>
        <td>
          <small class="text-muted">${formatDate(e.deadline)}</small>
        </td>
        <td>
          <div class="action-btn-group">
            <a href="../event-details.html?id=${e.id}" target="_blank" class="btn btn-icon btn-ghost" title="Preview Student View">
              <i class="fa-solid fa-eye"></i>
            </a>
            <button type="button" class="btn btn-icon btn-ghost" title="Edit Event" onclick="openEventModal('${e.id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn btn-icon btn-action-delete" title="Delete Event" onclick="handleDeleteEventClick('${e.id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openEventModal(eventId = null) {
  const isEdit = !!eventId;
  const event = isEdit ? getEventById(eventId) : null;

  if (isEdit && !event) {
    showToast("Event not found.", "error");
    return;
  }

  const existing = document.getElementById('admin-event-modal');
  if (existing) existing.remove();

  const modalBackdrop = document.createElement('div');
  modalBackdrop.id = 'admin-event-modal';
  modalBackdrop.className = 'modal-backdrop active';

  modalBackdrop.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">${isEdit ? '<i class="fa-solid fa-pen-to-square text-primary"></i> Edit Event' : '<i class="fa-solid fa-calendar-plus text-primary"></i> Create New Campus Event'}</h3>
            <p class="modal-subtitle">${isEdit ? 'Update details for this college event' : 'Fill in the information below to publish an upcoming event for students'}</p>
          </div>
          <button class="btn-close-modal" id="btn-close-event-modal">&times;</button>
        </div>

        <form id="admin-event-form">
          <div class="modal-body modal-scrollable">
            <div class="form-group">
              <label for="event-modal-title">Event Title <span class="required">*</span></label>
              <input type="text" id="event-modal-title" class="form-control" placeholder="e.g. National Hackathon 2026" value="${event ? event.title : ''}" required>
            </div>

            <div class="form-row">
              <div class="form-group col-half">
                <label for="event-modal-category">Category <span class="required">*</span></label>
                <select id="event-modal-category" class="form-control" required>
                  <option value="">Select Category</option>
                  <option value="Technical Events" ${event && event.category === 'Technical Events' ? 'selected' : ''}>Technical Events</option>
                  <option value="Cultural Events" ${event && event.category === 'Cultural Events' ? 'selected' : ''}>Cultural Events</option>
                  <option value="Sports Events" ${event && event.category === 'Sports Events' ? 'selected' : ''}>Sports Events</option>
                  <option value="Workshops" ${event && event.category === 'Workshops' ? 'selected' : ''}>Workshops</option>
                  <option value="Seminars" ${event && event.category === 'Seminars' ? 'selected' : ''}>Seminars</option>
                  <option value="Other Events" ${event && event.category === 'Other Events' ? 'selected' : ''}>Other Events</option>
                </select>
              </div>

              <div class="form-group col-half">
                <label for="event-modal-organizer">Organizing Club / Dept <span class="required">*</span></label>
                <input type="text" id="event-modal-organizer" class="form-control" placeholder="e.g. Computer Science Department" value="${event ? event.organizer : ''}" required>
              </div>
            </div>

            <div class="form-group">
              <label for="event-modal-desc">Event Description <span class="required">*</span></label>
              <textarea id="event-modal-desc" class="form-control" rows="4" placeholder="Provide full details, eligibility, schedule and guidelines..." required>${event ? event.description : ''}</textarea>
            </div>

            <div class="form-row">
              <div class="form-group col-third">
                <label for="event-modal-date">Event Date <span class="required">*</span></label>
                <input type="date" id="event-modal-date" class="form-control" value="${event ? event.date : ''}" required>
              </div>

              <div class="form-group col-third">
                <label for="event-modal-time">Start Time <span class="required">*</span></label>
                <input type="text" id="event-modal-time" class="form-control" placeholder="e.g. 10:00 AM" value="${event ? (event.time || '10:00 AM') : '10:00 AM'}" required>
              </div>

              <div class="form-group col-third">
                <label for="event-modal-deadline">Registration Deadline <span class="required">*</span></label>
                <input type="date" id="event-modal-deadline" class="form-control" value="${event ? event.deadline : ''}" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col-half">
                <label for="event-modal-venue">Venue / Location <span class="required">*</span></label>
                <input type="text" id="event-modal-venue" class="form-control" placeholder="e.g. Main Auditorium / Lab 301" value="${event ? event.venue : ''}" required>
              </div>

              <div class="form-group col-half">
                <label for="event-modal-capacity">Maximum Capacity (Seats) <span class="required">*</span></label>
                <input type="number" id="event-modal-capacity" class="form-control" min="1" max="5000" placeholder="e.g. 150" value="${event ? event.capacity : 100}" required>
              </div>
            </div>

            <!-- Poster Image Upload & Presets -->
            <div class="form-group poster-upload-section">
              <label>Event Poster Image</label>
              <div class="poster-input-grid">
                <div class="poster-file-dropzone">
                  <input type="file" id="event-modal-file-input" accept="image/*" class="file-input-hidden">
                  <label for="event-modal-file-input" class="file-drop-label">
                    <i class="fa-solid fa-cloud-arrow-up fa-2x mb-2 text-primary"></i>
                    <span>Click to Upload Poster from Device</span>
                    <small class="text-muted">Supports JPG, PNG, WebP (Converted to Base64)</small>
                  </label>
                </div>

                <div class="poster-preview-box">
                  <div class="preview-label">Poster Preview</div>
                  <img id="event-modal-preview-img" src="${event ? (event.poster || EVENT_POSTER_PRESETS.hackathon) : EVENT_POSTER_PRESETS.hackathon}" alt="Preview" class="preview-img-tag">
                  <input type="hidden" id="event-modal-poster-url" value="${event ? (event.poster || EVENT_POSTER_PRESETS.hackathon) : EVENT_POSTER_PRESETS.hackathon}">
                </div>
              </div>

              <!-- Preset Selectors -->
              <div class="preset-selector-row mt-2">
                <span class="text-xs text-muted">Or pick an curated theme image:</span>
                <div class="preset-chips">
                  <button type="button" class="preset-btn" data-url="${EVENT_POSTER_PRESETS.hackathon}">Tech / Coding</button>
                  <button type="button" class="preset-btn" data-url="${EVENT_POSTER_PRESETS.cultural}">Cultural Fest</button>
                  <button type="button" class="preset-btn" data-url="${EVENT_POSTER_PRESETS.sports}">Sports Meet</button>
                  <button type="button" class="preset-btn" data-url="${EVENT_POSTER_PRESETS.ai_workshop}">Workshop</button>
                  <button type="button" class="preset-btn" data-url="${EVENT_POSTER_PRESETS.seminar}">Seminar</button>
                </div>
              </div>
            </div>

            <div class="form-check-group mt-3">
              <input type="checkbox" id="event-modal-featured" ${event && event.featured ? 'checked' : ''}>
              <label for="event-modal-featured">Feature this event on the student home page spotlight</label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btn-cancel-event-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-save-event">
              <i class="fa-solid fa-floppy-disk"></i> ${isEdit ? 'Save Changes' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modalBackdrop);

  // Setup file input FileReader
  const fileInput = modalBackdrop.querySelector('#event-modal-file-input');
  const previewImg = modalBackdrop.querySelector('#event-modal-preview-img');
  const hiddenPosterInput = modalBackdrop.querySelector('#event-modal-poster-url');

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        showToast("Image file size should be less than 2.5MB for browser storage.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImg.src = event.target.result;
        hiddenPosterInput.value = event.target.result;
        showToast("Poster uploaded successfully!", "success");
      };
      reader.readAsDataURL(file);
    }
  });

  // Preset buttons
  const presetBtns = modalBackdrop.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      previewImg.src = url;
      hiddenPosterInput.value = url;
    });
  });

  const closeModal = () => {
    modalBackdrop.classList.remove('active');
    setTimeout(() => modalBackdrop.remove(), 250);
  };

  modalBackdrop.querySelector('#btn-close-event-modal').addEventListener('click', closeModal);
  modalBackdrop.querySelector('#btn-cancel-event-modal').addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // Submit event form
  const form = modalBackdrop.querySelector('#admin-event-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('event-modal-title').value.trim();
    const category = document.getElementById('event-modal-category').value;
    const organizer = document.getElementById('event-modal-organizer').value.trim();
    const description = document.getElementById('event-modal-desc').value.trim();
    const date = document.getElementById('event-modal-date').value;
    const time = document.getElementById('event-modal-time').value.trim();
    const deadline = document.getElementById('event-modal-deadline').value;
    const venue = document.getElementById('event-modal-venue').value.trim();
    const capacity = parseInt(document.getElementById('event-modal-capacity').value, 10);
    const poster = hiddenPosterInput.value;
    const featured = document.getElementById('event-modal-featured').checked;

    if (!title || !category || !organizer || !description || !date || !venue || !capacity || !deadline) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    if (new Date(deadline) > new Date(date)) {
      showToast("Registration deadline cannot be after the event date.", "warning");
      return;
    }

    const eventPayload = {
      title,
      category,
      organizer,
      description,
      date,
      time,
      deadline,
      venue,
      capacity,
      poster,
      featured
    };

    if (isEdit) {
      updateEvent(eventId, eventPayload);
      showToast("Event updated successfully!", "success", "Event Saved");
    } else {
      addEvent(eventPayload);
      showToast("New event published successfully!", "success", "Event Created");
    }

    closeModal();
    renderManageEventsTable();
  });
}

function handleDeleteEventClick(eventId) {
  const event = getEventById(eventId);
  if (!event) return;

  const regCount = getEventConfirmedCount(eventId);

  showConfirmModal({
    title: "Delete Campus Event?",
    message: `Are you sure you want to delete "${event.title}"? ${regCount > 0 ? `This will also remove ${regCount} associated student registration(s).` : ''}`,
    confirmText: "Delete Event",
    cancelText: "Keep Event",
    isDanger: true,
    onConfirm: () => {
      deleteEvent(eventId);
      showToast("Event and associated registrations deleted.", "info", "Event Removed");
      renderManageEventsTable();
    }
  });
}

/* ==========================================================================
   MANAGE REGISTRATIONS PAGE
   ========================================================================== */
let manageRegsState = [];
let regAdminSearchQuery = '';
let regAdminStatusFilter = 'all';
let regAdminEventFilter = 'all';

function initManageRegistrationsPage() {
  populateEventFilterDropdown();
  manageRegsState = getRegistrations();
  renderManageRegistrationsTable();
  setupManageRegistrationsListeners();
}

function populateEventFilterDropdown() {
  const select = document.getElementById('filter-reg-event');
  if (!select) return;

  const events = getEvents();
  select.innerHTML = `<option value="all">All Events (${events.length})</option>` +
    events.map(e => `<option value="${e.id}">${e.title}</option>`).join('');
}

function setupManageRegistrationsListeners() {
  // Search input
  const searchInput = document.getElementById('search-registrations-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      regAdminSearchQuery = e.target.value.trim().toLowerCase();
      renderManageRegistrationsTable();
    });
  }

  // Status Filter
  const statusSelect = document.getElementById('filter-reg-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      regAdminStatusFilter = e.target.value;
      renderManageRegistrationsTable();
    });
  }

  // Event Filter
  const eventSelect = document.getElementById('filter-reg-event');
  if (eventSelect) {
    eventSelect.addEventListener('change', (e) => {
      regAdminEventFilter = e.target.value;
      renderManageRegistrationsTable();
    });
  }

  // Export to CSV button
  const exportBtn = document.getElementById('btn-export-registrations');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportRegistrationsToCSV();
    });
  }
}

function renderManageRegistrationsTable() {
  const tbody = document.getElementById('manage-registrations-table-body');
  const countBadge = document.getElementById('registrations-table-count');
  if (!tbody) return;

  manageRegsState = getRegistrations();

  let filtered = manageRegsState.filter(r => {
    // Status filter
    if (regAdminStatusFilter !== 'all' && r.status !== regAdminStatusFilter) return false;
    // Event filter
    if (regAdminEventFilter !== 'all' && r.eventId !== regAdminEventFilter) return false;
    // Search
    if (regAdminSearchQuery) {
      const q = regAdminSearchQuery;
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.studentEmail.toLowerCase().includes(q) ||
        (r.studentRollNo && r.studentRollNo.toLowerCase().includes(q)) ||
        r.eventTitle.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} registration${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="empty-state">
            <i class="fa-solid fa-users-slash text-muted fa-2x mb-2"></i>
            <h4>No Registrations Found</h4>
            <p class="text-muted">No student registrations match the selected filter criteria.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const statusClasses = {
    Approved: 'badge-status-approved',
    Pending: 'badge-status-pending',
    Rejected: 'badge-status-rejected'
  };

  tbody.innerHTML = filtered.map(r => {
    return `
      <tr data-id="${r.id}">
        <td>
          <div class="student-profile-cell">
            <div class="student-avatar-mini">${r.studentName.charAt(0).toUpperCase()}</div>
            <div>
              <div class="student-name font-semibold">${r.studentName}</div>
              <small class="text-muted"><i class="fa-regular fa-envelope"></i> ${r.studentEmail}</small>
            </div>
          </div>
        </td>
        <td>
          <div class="student-acad-cell">
            <span class="roll-badge font-mono">${r.studentRollNo || 'N/A'}</span>
            <small class="text-muted dept-cell-text">${r.studentDepartment || 'General'}</small>
          </div>
        </td>
        <td>
          <div class="reg-event-cell">
            <span class="font-medium">${r.eventTitle}</span>
            <small class="text-muted"><i class="fa-regular fa-calendar"></i> ${formatDate(r.eventDate)}</small>
          </div>
        </td>
        <td>
          <span class="badge ${statusClasses[r.status] || 'badge-status-pending'}">${r.status}</span>
        </td>
        <td>
          <small class="text-muted">${formatDateTime(r.registeredAt)}</small>
        </td>
        <td>
          <span class="admin-notes-preview text-muted">${r.adminNotes || '—'}</span>
        </td>
        <td>
          <div class="action-btn-group">
            <button type="button" class="btn btn-icon btn-action-approve ${r.status === 'Approved' ? 'active-status' : ''}" title="Approve Registration" onclick="handleRegistrationStatusChange('${r.id}', 'Approved')">
              <i class="fa-solid fa-check"></i>
            </button>
            <button type="button" class="btn btn-icon btn-action-reject ${r.status === 'Rejected' ? 'active-status' : ''}" title="Reject Registration" onclick="handleRegistrationStatusChange('${r.id}', 'Rejected')">
              <i class="fa-solid fa-xmark"></i>
            </button>
            <button type="button" class="btn btn-icon btn-action-delete" title="Delete Entry" onclick="handleDeleteRegistrationClick('${r.id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function handleRegistrationStatusChange(regId, newStatus) {
  const reg = getRegistrations().find(r => r.id === regId);
  if (!reg) return;

  if (reg.status === newStatus) {
    showToast(`Registration is already marked as ${newStatus}.`, "info");
    return;
  }

  // Prompt for optional note if rejecting
  let note = reg.adminNotes || "";
  if (newStatus === 'Rejected') {
    const inputNote = prompt("Enter an optional rejection reason (visible to student):", "Schedule conflict or eligibility requirements not met");
    if (inputNote === null) return; // User cancelled prompt
    note = inputNote;
  }

  const res = updateRegistrationStatus(regId, newStatus, note);
  if (res.success) {
    showToast(`Registration for ${reg.studentName} updated to ${newStatus}.`, "success", "Status Updated");
    renderManageRegistrationsTable();
  }
}

function handleDeleteRegistrationClick(regId) {
  const reg = getRegistrations().find(r => r.id === regId);
  if (!reg) return;

  showConfirmModal({
    title: "Delete Student Registration?",
    message: `Are you sure you want to remove registration #${reg.id} for ${reg.studentName}?`,
    confirmText: "Delete",
    cancelText: "Cancel",
    isDanger: true,
    onConfirm: () => {
      deleteRegistration(regId);
      showToast("Registration entry removed.", "info");
      renderManageRegistrationsTable();
    }
  });
}

function exportRegistrationsToCSV() {
  const regs = getRegistrations();
  if (regs.length === 0) {
    showToast("No registrations available to export.", "warning");
    return;
  }

  const headers = ["Registration ID", "Student Name", "Student Email", "Roll No", "Department", "Phone", "Event Title", "Event Date", "Status", "Registered At", "Admin Notes"];
  const rows = regs.map(r => [
    `"${r.id}"`,
    `"${r.studentName}"`,
    `"${r.studentEmail}"`,
    `"${r.studentRollNo || ''}"`,
    `"${r.studentDepartment || ''}"`,
    `"${r.phone || ''}"`,
    `"${r.eventTitle.replace(/"/g, '""')}"`,
    `"${r.eventDate}"`,
    `"${r.status}"`,
    `"${r.registeredAt}"`,
    `"${(r.adminNotes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `campus_registrations_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();

  showToast("CSV file exported successfully!", "success");
}
