/**
 * Campus Event Management System
 * events.js - Student Event Catalog, Filters & Event Details
 */

document.addEventListener('DOMContentLoaded', () => {
  // Determine which page we are on
  const path = window.location.pathname;

  if (document.getElementById('featured-events-grid')) {
    initHomePageFeatured();
  }

  if (document.getElementById('explore-events-grid')) {
    initExploreEventsPage();
  }

  if (document.getElementById('event-detail-container')) {
    initEventDetailsPage();
  }
});

/* ==========================================================================
   CATEGORY COLOR HELPER
   ========================================================================== */
function getCategoryBadgeClass(category) {
  switch (category) {
    case 'Technical Events': return 'cat-technical';
    case 'Cultural Events': return 'cat-cultural';
    case 'Sports Events': return 'cat-sports';
    case 'Workshops': return 'cat-workshops';
    case 'Seminars': return 'cat-seminars';
    case 'Other Events': return 'cat-other';
    default: return 'cat-default';
  }
}

function getCategoryIcon(category) {
  switch (category) {
    case 'Technical Events': return 'fa-laptop-code';
    case 'Cultural Events': return 'fa-masks-theater';
    case 'Sports Events': return 'fa-medal';
    case 'Workshops': return 'fa-screwdriver-wrench';
    case 'Seminars': return 'fa-chalkboard-user';
    case 'Other Events': return 'fa-bullhorn';
    default: return 'fa-calendar-days';
  }
}

/* ==========================================================================
   HOME PAGE FEATURED EVENTS
   ========================================================================== */
function initHomePageFeatured() {
  const container = document.getElementById('featured-events-grid');
  if (!container) return;

  const events = getEvents();
  // Filter featured or upcoming events, pick first 3
  const featured = events.filter(e => e.featured).slice(0, 3);
  const displayList = featured.length >= 3 ? featured : events.slice(0, 3);

  if (displayList.length === 0) {
    container.innerHTML = `<div class="empty-state">No upcoming events scheduled right now. Check back soon!</div>`;
    return;
  }

  container.innerHTML = displayList.map(event => createEventCardHTML(event)).join('');
}

/* ==========================================================================
   EXPLORE EVENTS PAGE
   ========================================================================== */
let allEventsState = [];
let activeCategoryFilter = 'all';
let searchQuery = '';
let activeSortOrder = 'date-asc';

function initExploreEventsPage() {
  allEventsState = getEvents();
  renderEventsGrid();
  setupFilterListeners();

  // Check URL params for preselected category
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('category');
  if (catParam) {
    setCategoryFilter(catParam);
  }
}

function setupFilterListeners() {
  // Category Pill Buttons
  const catButtons = document.querySelectorAll('.cat-pill');
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategoryFilter = btn.getAttribute('data-category');
      renderEventsGrid();
    });
  });

  // Search Input
  const searchInput = document.getElementById('event-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderEventsGrid();
    });
  }

  // Sort Dropdown
  const sortSelect = document.getElementById('event-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSortOrder = e.target.value;
      renderEventsGrid();
    });
  }

  // Reset Filters Button
  const resetBtn = document.getElementById('btn-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeCategoryFilter = 'all';
      searchQuery = '';
      activeSortOrder = 'date-asc';
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'date-asc';
      catButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-category') === 'all'));
      renderEventsGrid();
    });
  }
}

function setCategoryFilter(category) {
  const catButtons = document.querySelectorAll('.cat-pill');
  catButtons.forEach(btn => {
    if (btn.getAttribute('data-category') === category) {
      btn.classList.add('active');
      activeCategoryFilter = category;
    } else {
      btn.classList.remove('active');
    }
  });
  renderEventsGrid();
}

function renderEventsGrid() {
  const container = document.getElementById('explore-events-grid');
  const countIndicator = document.getElementById('events-count-badge');
  if (!container) return;

  // 1. Fetch fresh events from storage
  allEventsState = getEvents();

  // 2. Filter by Category
  let filtered = allEventsState.filter(event => {
    if (activeCategoryFilter === 'all') return true;
    return event.category === activeCategoryFilter;
  });

  // 3. Filter by Search Query
  if (searchQuery) {
    filtered = filtered.filter(event => 
      event.title.toLowerCase().includes(searchQuery) ||
      event.description.toLowerCase().includes(searchQuery) ||
      event.organizer.toLowerCase().includes(searchQuery) ||
      event.venue.toLowerCase().includes(searchQuery)
    );
  }

  // 4. Sort
  filtered.sort((a, b) => {
    if (activeSortOrder === 'date-asc') {
      return new Date(a.date) - new Date(b.date);
    } else if (activeSortOrder === 'date-desc') {
      return new Date(b.date) - new Date(a.date);
    } else if (activeSortOrder === 'title-asc') {
      return a.title.localeCompare(b.title);
    } else if (activeSortOrder === 'capacity') {
      return parseInt(b.capacity, 10) - parseInt(a.capacity, 10);
    }
    return 0;
  });

  if (countIndicator) {
    countIndicator.textContent = `${filtered.length} event${filtered.length === 1 ? '' : 's'} found`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card col-span-all">
        <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3>No Events Found</h3>
        <p>No campus events match your current filter criteria. Try adjusting your search or clear filters.</p>
        <button class="btn btn-outline" onclick="document.getElementById('btn-reset-filters').click()">
          <i class="fa-solid fa-rotate-left"></i> Reset All Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(event => createEventCardHTML(event)).join('');
}

/* ==========================================================================
   EVENT CARD COMPONENT BUILDER
   ========================================================================== */
function createEventCardHTML(event) {
  const confirmedCount = getEventConfirmedCount(event.id);
  const capacity = parseInt(event.capacity, 10) || 100;
  const seatsLeft = Math.max(0, capacity - confirmedCount);
  const fillPercentage = Math.min(100, Math.round((confirmedCount / capacity) * 100));

  // Check deadline
  const now = new Date();
  const deadlineDate = event.deadline ? new Date(event.deadline + 'T23:59:59') : null;
  const isDeadlinePassed = deadlineDate && now > deadlineDate;
  const isCapacityFull = seatsLeft === 0;

  // Status Badge
  let statusBadge = '';
  if (isDeadlinePassed) {
    statusBadge = `<span class="card-status-badge badge-closed"><i class="fa-solid fa-lock"></i> Deadline Passed</span>`;
  } else if (isCapacityFull) {
    statusBadge = `<span class="card-status-badge badge-full"><i class="fa-solid fa-circle-exclamation"></i> Sold Out</span>`;
  } else if (seatsLeft <= 10) {
    statusBadge = `<span class="card-status-badge badge-urgent"><i class="fa-solid fa-fire"></i> ${seatsLeft} Seats Left</span>`;
  } else {
    statusBadge = `<span class="card-status-badge badge-open"><i class="fa-solid fa-check"></i> Registration Open</span>`;
  }

  const categoryClass = getCategoryBadgeClass(event.category);
  const categoryIcon = getCategoryIcon(event.category);

  // Fallback poster image
  const posterUrl = event.poster || 'assets/images/default-event.jpg';

  return `
    <article class="event-card" data-id="${event.id}">
      <div class="event-card-img-wrap">
        <img src="${posterUrl}" alt="${event.title}" class="event-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'">
        <div class="event-card-badges">
          <span class="badge ${categoryClass}">
            <i class="fa-solid ${categoryIcon}"></i> ${event.category}
          </span>
          ${statusBadge}
        </div>
      </div>

      <div class="event-card-body">
        <div class="event-card-meta">
          <span class="meta-item"><i class="fa-regular fa-calendar"></i> ${formatDate(event.date)}</span>
          <span class="meta-item"><i class="fa-regular fa-clock"></i> ${event.time || 'TBA'}</span>
        </div>

        <h3 class="event-card-title">
          <a href="event-details.html?id=${event.id}">${event.title}</a>
        </h3>

        <div class="event-card-venue">
          <i class="fa-solid fa-location-dot"></i> <span>${event.venue}</span>
        </div>

        <p class="event-card-desc">
          ${event.description}
        </p>

        <!-- Seat availability progress bar -->
        <div class="event-card-capacity">
          <div class="capacity-labels">
            <span><i class="fa-solid fa-users"></i> Seats filled</span>
            <span class="capacity-numbers"><strong>${confirmedCount}</strong> / ${capacity}</span>
          </div>
          <div class="capacity-progress-bar">
            <div class="capacity-progress-fill ${fillPercentage >= 90 ? 'fill-danger' : fillPercentage >= 70 ? 'fill-warning' : ''}" style="width: ${fillPercentage}%"></div>
          </div>
        </div>

        <div class="event-card-footer">
          <a href="event-details.html?id=${event.id}" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-circle-info"></i> View Details
          </a>
          ${(isDeadlinePassed || isCapacityFull) 
            ? `<button class="btn btn-disabled btn-sm" disabled><i class="fa-solid fa-ban"></i> Closed</button>`
            : `<button class="btn btn-primary btn-sm btn-quick-register" onclick="handleQuickRegisterClick('${event.id}')">
                <i class="fa-solid fa-ticket"></i> Register Now
              </button>`
          }
        </div>
      </div>
    </article>
  `;
}

/* ==========================================================================
   EVENT DETAILS PAGE
   ========================================================================== */
function initEventDetailsPage() {
  const container = document.getElementById('event-detail-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  if (!eventId) {
    container.innerHTML = `
      <div class="error-container">
        <h2>Event Not Specified</h2>
        <p>Please browse our events directory to select an upcoming event.</p>
        <a href="events.html" class="btn btn-primary">Browse Events</a>
      </div>
    `;
    return;
  }

  const event = getEventById(eventId);
  if (!event) {
    container.innerHTML = `
      <div class="error-container">
        <h2>Event Not Found</h2>
        <p>The event you are looking for may have been removed or does not exist.</p>
        <a href="events.html" class="btn btn-primary">Back to Events</a>
      </div>
    `;
    return;
  }

  // Update page title
  document.title = `${event.title} - Campus Events`;

  // Calculate registrations and seats
  const confirmedCount = getEventConfirmedCount(event.id);
  const capacity = parseInt(event.capacity, 10) || 100;
  const seatsLeft = Math.max(0, capacity - confirmedCount);
  const fillPercentage = Math.min(100, Math.round((confirmedCount / capacity) * 100));

  const now = new Date();
  const deadlineDate = event.deadline ? new Date(event.deadline + 'T23:59:59') : null;
  const isDeadlinePassed = deadlineDate && now > deadlineDate;
  const isCapacityFull = seatsLeft === 0;

  const currentUser = getCurrentUser();
  const alreadyRegistered = currentUser ? hasStudentRegistered(event.id, currentUser.email) : false;
  let userRegInfo = null;
  if (alreadyRegistered) {
    const regs = getRegistrations();
    userRegInfo = regs.find(r => r.eventId === event.id && r.studentEmail === currentUser.email);
  }

  // Status message rendering
  let registrationStatusBox = '';
  if (alreadyRegistered && userRegInfo) {
    const statusClasses = {
      Approved: 'badge-status-approved',
      Pending: 'badge-status-pending',
      Rejected: 'badge-status-rejected'
    };
    registrationStatusBox = `
      <div class="reg-status-banner banner-${userRegInfo.status.toLowerCase()}">
        <div class="status-banner-icon">
          <i class="fa-solid ${userRegInfo.status === 'Approved' ? 'fa-circle-check' : userRegInfo.status === 'Pending' ? 'fa-clock' : 'fa-circle-xmark'}"></i>
        </div>
        <div class="status-banner-content">
          <h4>You are registered for this event!</h4>
          <p>Registration Status: <span class="badge ${statusClasses[userRegInfo.status]}">${userRegInfo.status}</span></p>
          <small>Registered on: ${formatDateTime(userRegInfo.registeredAt)}</small>
        </div>
        <a href="my-registrations.html" class="btn btn-sm btn-outline">
          <i class="fa-solid fa-ticket"></i> View Pass
        </a>
      </div>
    `;
  } else if (isDeadlinePassed) {
    registrationStatusBox = `
      <div class="reg-status-banner banner-closed">
        <div class="status-banner-icon"><i class="fa-solid fa-lock"></i></div>
        <div class="status-banner-content">
          <h4>Registration has Closed</h4>
          <p>The deadline to register for this event passed on ${formatDate(event.deadline)}.</p>
        </div>
      </div>
    `;
  } else if (isCapacityFull) {
    registrationStatusBox = `
      <div class="reg-status-banner banner-full">
        <div class="status-banner-icon"><i class="fa-solid fa-user-xmark"></i></div>
        <div class="status-banner-content">
          <h4>Event is Fully Booked</h4>
          <p>All ${capacity} seats for this event have been filled. You may look for other upcoming events.</p>
        </div>
      </div>
    `;
  }

  const categoryClass = getCategoryBadgeClass(event.category);
  const categoryIcon = getCategoryIcon(event.category);
  const posterUrl = event.poster || 'assets/images/default-event.jpg';

  container.innerHTML = `
    <!-- Breadcrumbs -->
    <nav class="breadcrumb-nav">
      <a href="index.html">Home</a>
      <i class="fa-solid fa-chevron-right breadcrumb-separator"></i>
      <a href="events.html">Events</a>
      <i class="fa-solid fa-chevron-right breadcrumb-separator"></i>
      <span class="breadcrumb-current">${event.title}</span>
    </nav>

    ${registrationStatusBox}

    <div class="event-details-layout">
      <!-- Left / Main Column -->
      <div class="event-main-content">
        <div class="event-poster-wrapper">
          <img src="${posterUrl}" alt="${event.title}" class="event-detail-poster" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'">
          <div class="poster-badge-overlay">
            <span class="badge ${categoryClass}">
              <i class="fa-solid ${categoryIcon}"></i> ${event.category}
            </span>
          </div>
        </div>

        <div class="event-header-info">
          <h1 class="event-page-title">${event.title}</h1>
          <div class="event-organizer-pill">
            <i class="fa-solid fa-building-columns"></i>
            <span>Organized by <strong>${event.organizer}</strong></span>
          </div>
        </div>

        <div class="event-description-card card-box">
          <h2 class="section-card-title"><i class="fa-solid fa-align-left"></i> About This Event</h2>
          <div class="event-full-description">
            <p>${event.description.replace(/\n/g, '<br><br>')}</p>
          </div>
        </div>

        <div class="event-highlights-card card-box">
          <h2 class="section-card-title"><i class="fa-solid fa-star"></i> Event Highlights & Guidelines</h2>
          <ul class="highlights-list">
            <li><i class="fa-solid fa-check text-success"></i> Open to all verified college students with valid College ID.</li>
            <li><i class="fa-solid fa-check text-success"></i> Official participation certificate awarded upon completion.</li>
            <li><i class="fa-solid fa-check text-success"></i> Refreshments and event kit will be provided to registered attendees.</li>
            <li><i class="fa-solid fa-check text-success"></i> Please arrive 15 minutes prior to the start time for physical check-in.</li>
          </ul>
        </div>
      </div>

      <!-- Right Column: Sidebar Action Card -->
      <aside class="event-sidebar-content">
        <div class="event-action-card card-box sticky-card">
          <div class="action-card-header">
            <h3>Event Quick Details</h3>
          </div>

          <div class="event-specs-list">
            <div class="spec-row">
              <div class="spec-icon"><i class="fa-regular fa-calendar"></i></div>
              <div class="spec-text">
                <span class="spec-label">Date</span>
                <span class="spec-val">${formatDate(event.date)}</span>
              </div>
            </div>

            <div class="spec-row">
              <div class="spec-icon"><i class="fa-regular fa-clock"></i></div>
              <div class="spec-text">
                <span class="spec-label">Time</span>
                <span class="spec-val">${event.time || '10:00 AM onwards'}</span>
              </div>
            </div>

            <div class="spec-row">
              <div class="spec-icon"><i class="fa-solid fa-location-dot"></i></div>
              <div class="spec-text">
                <span class="spec-label">Venue</span>
                <span class="spec-val">${event.venue}</span>
              </div>
            </div>

            <div class="spec-row">
              <div class="spec-icon"><i class="fa-solid fa-hourglass-end"></i></div>
              <div class="spec-text">
                <span class="spec-label">Registration Deadline</span>
                <span class="spec-val ${isDeadlinePassed ? 'text-danger font-bold' : ''}">
                  ${formatDate(event.deadline)} ${isDeadlinePassed ? '(Passed)' : ''}
                </span>
              </div>
            </div>

            <div class="spec-row">
              <div class="spec-icon"><i class="fa-solid fa-users"></i></div>
              <div class="spec-text">
                <span class="spec-label">Available Capacity</span>
                <span class="spec-val">${seatsLeft} remaining of ${capacity}</span>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="capacity-container-widget">
            <div class="widget-labels">
              <span>Registration Status</span>
              <span><strong>${fillPercentage}% Full</strong></span>
            </div>
            <div class="capacity-progress-bar">
              <div class="capacity-progress-fill ${fillPercentage >= 90 ? 'fill-danger' : fillPercentage >= 70 ? 'fill-warning' : ''}" style="width: ${fillPercentage}%"></div>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div class="action-card-actions">
            ${alreadyRegistered ? `
              <a href="my-registrations.html" class="btn btn-outline btn-block">
                <i class="fa-solid fa-ticket"></i> View My Registration
              </a>
            ` : (isDeadlinePassed || isCapacityFull) ? `
              <button class="btn btn-disabled btn-block" disabled>
                <i class="fa-solid fa-ban"></i> Registration Closed
              </button>
            ` : `
              <button class="btn btn-primary btn-block btn-lg" id="btn-open-register-modal">
                <i class="fa-solid fa-ticket"></i> Register For Event
              </button>
            `}

            <button class="btn btn-ghost btn-block" id="btn-share-event">
              <i class="fa-solid fa-share-nodes"></i> Share Event
            </button>
          </div>
        </div>
      </aside>
    </div>

    <!-- Related Events -->
    <section class="related-events-section mt-5">
      <h3 class="section-title"><i class="fa-solid fa-sparkles"></i> More Upcoming Events</h3>
      <div class="events-grid-responsive" id="related-events-grid"></div>
    </section>
  `;

  // Bind Share button
  const shareBtn = document.getElementById('btn-share-event');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        showToast("Event link copied to clipboard!", "success");
      } else {
        showToast("Share this link: " + window.location.href, "info");
      }
    });
  }

  // Bind Register Button
  const registerBtn = document.getElementById('btn-open-register-modal');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      openRegistrationModal(event);
    });
  }

  // Render related events
  renderRelatedEvents(event.id, event.category);
}

function renderRelatedEvents(currentId, category) {
  const container = document.getElementById('related-events-grid');
  if (!container) return;

  const events = getEvents();
  const related = events
    .filter(e => e.id !== currentId && e.category === category)
    .slice(0, 3);

  // If not enough in same category, pad with other upcoming
  if (related.length < 3) {
    const others = events.filter(e => e.id !== currentId && !related.some(r => r.id === e.id)).slice(0, 3 - related.length);
    related.push(...others);
  }

  if (related.length === 0) {
    container.innerHTML = `<p class="text-muted">No other upcoming events at the moment.</p>`;
    return;
  }

  container.innerHTML = related.map(e => createEventCardHTML(e)).join('');
}

/* ==========================================================================
   REGISTRATION MODAL WORKFLOW
   ========================================================================== */
function handleQuickRegisterClick(eventId) {
  const event = getEventById(eventId);
  if (!event) return;

  const user = getCurrentUser();
  if (!user) {
    showToast("Please log in or create a student account to register for events.", "info", "Sign In Required");
    setTimeout(() => {
      window.location.href = `login.html?redirect=event-details.html?id=${eventId}`;
    }, 1200);
    return;
  }

  openRegistrationModal(event);
}

function openRegistrationModal(event) {
  const user = getCurrentUser();

  // If not logged in, prompt to log in
  if (!user) {
    showToast("Please log in to complete your event registration.", "info", "Authentication Required");
    setTimeout(() => {
      window.location.href = `login.html?redirect=event-details.html?id=${event.id}`;
    }, 1000);
    return;
  }

  // Check if admin is trying to register
  if (user.role === 'admin') {
    showToast("Administrators can manage events and registrations from the Admin Panel.", "info", "Admin Mode");
  }

  // Pre-check duplicate
  if (hasStudentRegistered(event.id, user.email)) {
    showToast("You are already registered for this event!", "warning", "Already Registered");
    return;
  }

  // Pre-check capacity & deadline
  const confirmedCount = getEventConfirmedCount(event.id);
  const capacity = parseInt(event.capacity, 10);
  if (confirmedCount >= capacity) {
    showToast("This event has reached full capacity.", "error", "Registration Closed");
    return;
  }

  const deadlineDate = event.deadline ? new Date(event.deadline + 'T23:59:59') : null;
  if (deadlineDate && new Date() > deadlineDate) {
    showToast("The registration deadline for this event has passed.", "error", "Deadline Passed");
    return;
  }

  // Remove existing modal if any
  const existing = document.getElementById('registration-modal-dialog');
  if (existing) existing.remove();

  const modalBackdrop = document.createElement('div');
  modalBackdrop.id = 'registration-modal-dialog';
  modalBackdrop.className = 'modal-backdrop active';

  modalBackdrop.innerHTML = `
    <div class="modal-dialog modal-md">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h3 class="modal-title"><i class="fa-solid fa-ticket text-primary"></i> Confirm Registration</h3>
            <p class="modal-subtitle">Register for: <strong>${event.title}</strong></p>
          </div>
          <button class="btn-close-modal" id="btn-close-reg-modal">&times;</button>
        </div>

        <form id="event-registration-form">
          <div class="modal-body">
            <div class="event-reg-summary-box">
              <div class="summary-line">
                <span><i class="fa-regular fa-calendar"></i> ${formatDate(event.date)}</span>
                <span><i class="fa-regular fa-clock"></i> ${event.time || '10:00 AM'}</span>
              </div>
              <div class="summary-line">
                <span><i class="fa-solid fa-location-dot"></i> ${event.venue}</span>
                <span><i class="fa-solid fa-building-columns"></i> ${event.organizer}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="reg-student-name">Full Student Name <span class="required">*</span></label>
              <input type="text" id="reg-student-name" class="form-control" value="${user.name || ''}" required>
            </div>

            <div class="form-row">
              <div class="form-group col-half">
                <label for="reg-student-email">Email Address <span class="required">*</span></label>
                <input type="email" id="reg-student-email" class="form-control" value="${user.email || ''}" required readonly>
                <small class="form-hint">Linked to your student account</small>
              </div>

              <div class="form-group col-half">
                <label for="reg-student-id">Student ID / Roll No <span class="required">*</span></label>
                <input type="text" id="reg-student-id" class="form-control" value="${user.studentId || ''}" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col-half">
                <label for="reg-student-dept">Department <span class="required">*</span></label>
                <select id="reg-student-dept" class="form-control" required>
                  <option value="">Select Department</option>
                  <option value="Computer Science & Engineering" ${user.department === 'Computer Science & Engineering' ? 'selected' : ''}>Computer Science & Eng</option>
                  <option value="Information Technology" ${user.department === 'Information Technology' ? 'selected' : ''}>Information Technology</option>
                  <option value="Electronics & Communication" ${user.department === 'Electronics & Communication' ? 'selected' : ''}>Electronics & Communication</option>
                  <option value="Mechanical Engineering" ${user.department === 'Mechanical Engineering' ? 'selected' : ''}>Mechanical Engineering</option>
                  <option value="Civil Engineering" ${user.department === 'Civil Engineering' ? 'selected' : ''}>Civil Engineering</option>
                  <option value="Business Administration (MBA/BBA)" ${user.department === 'Business Administration (MBA/BBA)' ? 'selected' : ''}>Business Administration</option>
                  <option value="Sciences & Humanities" ${user.department === 'Sciences & Humanities' ? 'selected' : ''}>Sciences & Humanities</option>
                </select>
              </div>

              <div class="form-group col-half">
                <label for="reg-student-phone">Contact Mobile Number <span class="required">*</span></label>
                <input type="tel" id="reg-student-phone" class="form-control" value="${user.phone || '+91 '}" placeholder="+91 98765 43210" required>
              </div>
            </div>

            <div class="form-check-group">
              <input type="checkbox" id="reg-student-consent" checked required>
              <label for="reg-student-consent">I confirm that all details provided are accurate and I will follow campus event guidelines.</label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btn-cancel-reg-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-registration">
              <i class="fa-solid fa-check"></i> Submit Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modalBackdrop);

  const closeModal = () => {
    modalBackdrop.classList.remove('active');
    setTimeout(() => modalBackdrop.remove(), 250);
  };

  modalBackdrop.querySelector('#btn-close-reg-modal').addEventListener('click', closeModal);
  modalBackdrop.querySelector('#btn-cancel-reg-modal').addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // Handle form submission
  const form = modalBackdrop.querySelector('#event-registration-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('reg-student-name').value.trim();
    const email = document.getElementById('reg-student-email').value.trim();
    const studentId = document.getElementById('reg-student-id').value.trim();
    const department = document.getElementById('reg-student-dept').value;
    const phone = document.getElementById('reg-student-phone').value.trim();

    if (!name || !email || !studentId || !department || !phone) {
      showToast("Please complete all required fields.", "warning");
      return;
    }

    const result = createRegistration({
      eventId: event.id,
      studentId: user.id,
      studentName: name,
      studentEmail: email,
      studentRollNo: studentId,
      studentDepartment: department,
      phone: phone
    });

    if (!result.success) {
      showToast(result.message, "error", "Registration Unsuccessful");
      return;
    }

    closeModal();
    showToast("Registration submitted successfully! Your status is currently Pending review.", "success", "Registered!");

    // Re-render event details page if on event-details.html
    setTimeout(() => {
      if (document.getElementById('event-detail-container')) {
        initEventDetailsPage();
      } else {
        renderEventsGrid();
      }
    }, 600);
  });
}
