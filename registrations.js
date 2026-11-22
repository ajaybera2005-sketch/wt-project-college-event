/**
 * Campus Event Management System
 * registrations.js - Student's Personal Registrations Portal
 */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('my-registrations-container')) {
    initMyRegistrationsPage();
  }
});

let myRegistrationsState = [];
let activeRegStatusFilter = 'all';
let regSearchQuery = '';

function initMyRegistrationsPage() {
  const user = getCurrentUser();
  if (!user) {
    protectStudentRoute();
    return;
  }

  loadAndRenderRegistrations();
  setupRegistrationFilterListeners();
}

function loadAndRenderRegistrations() {
  const user = getCurrentUser();
  if (!user) return;

  const allRegs = getRegistrations();
  // Filter for this student
  myRegistrationsState = allRegs.filter(r => 
    r.studentEmail?.toLowerCase() === user.email.toLowerCase() || 
    r.studentId === user.id
  );

  updateRegistrationSummaryStats();
  renderRegistrationsList();
}

function updateRegistrationSummaryStats() {
  const totalEl = document.getElementById('stat-my-total');
  const approvedEl = document.getElementById('stat-my-approved');
  const pendingEl = document.getElementById('stat-my-pending');
  const rejectedEl = document.getElementById('stat-my-rejected');

  const total = myRegistrationsState.length;
  const approved = myRegistrationsState.filter(r => r.status === 'Approved').length;
  const pending = myRegistrationsState.filter(r => r.status === 'Pending').length;
  const rejected = myRegistrationsState.filter(r => r.status === 'Rejected').length;

  if (totalEl) totalEl.textContent = total;
  if (approvedEl) approvedEl.textContent = approved;
  if (pendingEl) pendingEl.textContent = pending;
  if (rejectedEl) rejectedEl.textContent = rejected;
}

function setupRegistrationFilterListeners() {
  // Status tab buttons
  const tabs = document.querySelectorAll('.reg-filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeRegStatusFilter = tab.getAttribute('data-status');
      renderRegistrationsList();
    });
  });

  // Search input
  const searchInput = document.getElementById('reg-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      regSearchQuery = e.target.value.trim().toLowerCase();
      renderRegistrationsList();
    });
  }
}

function renderRegistrationsList() {
  const container = document.getElementById('my-registrations-container');
  if (!container) return;

  let filtered = myRegistrationsState.filter(reg => {
    if (activeRegStatusFilter === 'all') return true;
    return reg.status === activeRegStatusFilter;
  });

  if (regSearchQuery) {
    filtered = filtered.filter(reg => 
      reg.eventTitle.toLowerCase().includes(regSearchQuery) ||
      (reg.id && reg.id.toLowerCase().includes(regSearchQuery))
    );
  }

  if (filtered.length === 0) {
    if (myRegistrationsState.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card col-span-all">
          <div class="empty-icon"><i class="fa-solid fa-ticket-simple"></i></div>
          <h3>No Registrations Yet</h3>
          <p>You haven't registered for any campus events yet. Explore upcoming hackathons, sports meets, cultural fests, and workshops!</p>
          <a href="events.html" class="btn btn-primary">
            <i class="fa-solid fa-compass"></i> Explore Campus Events
          </a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state-card col-span-all">
          <div class="empty-icon"><i class="fa-solid fa-filter"></i></div>
          <h3>No Matching Registrations</h3>
          <p>No registrations found matching the "${activeRegStatusFilter}" filter or search query.</p>
          <button class="btn btn-outline" onclick="document.querySelector('.reg-filter-tab[data-status=\\'all\\']').click()">
            Show All Registrations
          </button>
        </div>
      `;
    }
    return;
  }

  container.innerHTML = filtered.map(reg => {
    const event = getEventById(reg.eventId);
    const statusClasses = {
      Approved: 'badge-status-approved',
      Pending: 'badge-status-pending',
      Rejected: 'badge-status-rejected'
    };

    const statusIcons = {
      Approved: 'fa-circle-check',
      Pending: 'fa-clock',
      Rejected: 'fa-circle-xmark'
    };

    return `
      <div class="ticket-card" id="ticket-${reg.id}">
        <div class="ticket-status-strip strip-${reg.status.toLowerCase()}"></div>
        <div class="ticket-body">
          <div class="ticket-header">
            <div>
              <span class="ticket-id">PASS #${reg.id.toUpperCase()}</span>
              <h3 class="ticket-title">${reg.eventTitle}</h3>
            </div>
            <div class="badge ${statusClasses[reg.status]}">
              <i class="fa-solid ${statusIcons[reg.status]}"></i> ${reg.status}
            </div>
          </div>

          <div class="ticket-details-grid">
            <div class="ticket-detail-item">
              <span class="detail-label"><i class="fa-regular fa-calendar"></i> Event Date</span>
              <span class="detail-value font-semibold">${formatDate(reg.eventDate)}</span>
            </div>
            <div class="ticket-detail-item">
              <span class="detail-label"><i class="fa-solid fa-location-dot"></i> Venue</span>
              <span class="detail-value">${event ? event.venue : 'Campus Premises'}</span>
            </div>
            <div class="ticket-detail-item">
              <span class="detail-label"><i class="fa-solid fa-user"></i> Attendee</span>
              <span class="detail-value">${reg.studentName} (${reg.studentRollNo || 'ID: ' + reg.studentId})</span>
            </div>
            <div class="ticket-detail-item">
              <span class="detail-label"><i class="fa-regular fa-clock"></i> Applied On</span>
              <span class="detail-value">${formatDateTime(reg.registeredAt)}</span>
            </div>
          </div>

          ${reg.adminNotes ? `
            <div class="ticket-admin-note">
              <i class="fa-solid fa-message text-muted"></i>
              <span><strong>Admin Note:</strong> ${reg.adminNotes}</span>
            </div>
          ` : ''}

          <div class="ticket-footer">
            <div class="ticket-actions-left">
              ${event ? `
                <a href="event-details.html?id=${event.id}" class="btn btn-ghost btn-sm">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Event Page
                </a>
              ` : ''}
              ${reg.status === 'Approved' ? `
                <button type="button" class="btn btn-outline btn-sm" onclick="printTicketPass('${reg.id}')">
                  <i class="fa-solid fa-print"></i> Print Campus Pass
                </button>
              ` : ''}
            </div>

            <div class="ticket-actions-right">
              ${reg.status === 'Pending' ? `
                <button type="button" class="btn btn-danger-outline btn-sm" onclick="cancelRegistrationClick('${reg.id}')">
                  <i class="fa-solid fa-xmark"></i> Cancel Registration
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function cancelRegistrationClick(regId) {
  showConfirmModal({
    title: "Cancel Event Registration?",
    message: "Are you sure you want to cancel this registration? You will lose your spot and will need to register again if seats remain available.",
    confirmText: "Yes, Cancel",
    cancelText: "Keep Registration",
    isDanger: true,
    onConfirm: () => {
      deleteRegistration(regId);
      showToast("Registration cancelled successfully.", "info", "Cancelled");
      loadAndRenderRegistrations();
    }
  });
}

function printTicketPass(regId) {
  const reg = getRegistrations().find(r => r.id === regId);
  const event = reg ? getEventById(reg.eventId) : null;
  if (!reg) return;

  const printWindow = window.open('', '_blank', 'width=750,height=600');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Campus Event Pass - ${reg.eventTitle}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; background: #f8fafc; }
        .pass-card { max-width: 600px; margin: 0 auto; background: white; border: 2px dashed #4f46e5; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .pass-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
        .pass-badge { background: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 13px; }
        .title { font-size: 22px; font-weight: 800; color: #1e1b4b; margin: 0 0 8px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
        .item-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .item-val { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px; }
        .qr-placeholder { text-align: center; margin: 20px 0; padding: 15px; background: #f1f5f9; border-radius: 8px; font-family: monospace; font-size: 13px; }
        .footer-note { font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="pass-card">
        <div class="pass-header">
          <div>
            <div style="font-weight: 800; color: #4f46e5; font-size: 16px;">CAMPUS EVENTS ENTRY PASS</div>
            <div style="font-size: 12px; color: #64748b;">REF: ${reg.id.toUpperCase()}</div>
          </div>
          <span class="pass-badge">VERIFIED & APPROVED</span>
        </div>
        <h1 class="title">${reg.eventTitle}</h1>
        <div class="grid">
          <div><div class="item-label">Student Name</div><div class="item-val">${reg.studentName}</div></div>
          <div><div class="item-label">Student ID / Roll No</div><div class="item-val">${reg.studentRollNo || 'N/A'}</div></div>
          <div><div class="item-label">Department</div><div class="item-val">${reg.studentDepartment}</div></div>
          <div><div class="item-label">Student Email</div><div class="item-val">${reg.studentEmail}</div></div>
          <div><div class="item-label">Event Date</div><div class="item-val">${formatDate(reg.eventDate)}</div></div>
          <div><div class="item-label">Event Venue</div><div class="item-val">${event ? event.venue : 'Main Campus'}</div></div>
        </div>
        <div class="qr-placeholder">
          [ VALID CAMPUS EVENT DIGITAL ENTRY TOKEN: ${reg.id}-${Date.now().toString(36)} ]
        </div>
        <div class="footer-note">
          Please carry your physical College ID along with this pass to the entrance. Entry closes 10 minutes prior to scheduled start.
        </div>
      </div>
      <script>
        window.print();
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
