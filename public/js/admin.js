// ── Admin session check ──
async function checkAdminSession() {
  try {
    const res = await fetch('/api/auth/admin-session');
    const data = await res.json();
    if (data.authenticated) showDashboard();
    else showAdminLogin();
  } catch {
    showAdminLogin();
  }
}

function showAdminLogin() {
  document.getElementById('admin-login-view').style.display = 'flex';
  document.getElementById('admin-dashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('admin-login-view').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  switchTab('users');
}

// ── Tab switching ──
async function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(content =>
    content.classList.toggle('active', content.id === `tab-${tab}`));

  if (tab === 'users') await loadUsers();
  else if (tab === 'apps') await loadAdminApps();
  else if (tab === 'activity') await loadActivity();
  else if (tab === 'pqp') await loadPQP();
  else if (tab === 'changelog') await loadChangelog();
}

// ── Users tab ──
async function loadUsers() {
  const el = document.getElementById('tab-users');
  el.innerHTML = '<div class="empty-state">Loading…</div>';
  try {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error('Failed');
    const users = await res.json();
    if (!users.length) { el.innerHTML = '<div class="empty-state">No users yet.</div>'; return; }

    el.innerHTML = `
      <table class="admin-table">
        <thead><tr>
          <th>ID</th><th>Class</th><th>Name</th><th>Role</th><th>Created</th>
        </tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td class="mono">${u.id}</td>
              <td>${u.class_name}</td>
              <td>${u.student_name}</td>
              <td><span class="badge ${u.role === 'admin' ? 'badge-active' : 'badge-wip'}">${u.role}</span></td>
              <td class="mono">${u.created_at}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch { el.innerHTML = '<div class="empty-state">Failed to load users.</div>'; }
}

// ── App Directory tab (CRUD) ──
async function loadAdminApps() {
  const el = document.getElementById('tab-apps');
  el.innerHTML = '<div class="empty-state">Loading…</div>';
  try {
    const res = await fetch('/api/apps/all');
    if (!res.ok) throw new Error('Failed');
    const apps = await res.json();
    if (!apps.length) { el.innerHTML = '<div class="empty-state">No apps. Click "Add App" to create one.</div>'; return; }

    el.innerHTML = `
      <button class="add-btn" onclick="openAppModal()">+ Add App</button>
      <table class="admin-table">
        <thead><tr>
          <th>ID</th><th>Title</th><th>Category</th><th>URL</th><th>Status</th><th>Active</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${apps.map(a => `
            <tr>
              <td class="mono">${a.id}</td>
              <td>${a.title}</td>
              <td>${a.category}</td>
              <td class="truncate mono">${a.url}</td>
              <td><span class="badge badge-${a.status}">${a.status}</span></td>
              <td><span class="badge ${a.is_active ? 'badge-active' : 'badge-inactive'}">${a.is_active ? 'Yes' : 'No'}</span></td>
              <td>
                <button class="action-btn" onclick="openAppModal(${a.id})">Edit</button>
                <button class="action-btn" onclick="toggleApp(${a.id})">Toggle</button>
                <button class="action-btn danger" onclick="deleteApp(${a.id})">Delete</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch { el.innerHTML = '<div class="empty-state">Failed to load apps.</div>'; }
}

// ── App modal (add/edit) ──
let editingAppId = null;

async function openAppModal(id) {
  editingAppId = id || null;
  const modal = document.getElementById('app-modal');
  document.getElementById('app-modal-title').textContent = id ? 'Edit App' : 'Add App';
  document.getElementById('app-form').reset();

  if (id) {
    try {
      const res = await fetch('/api/apps/all');
      const apps = await res.json();
      const app = apps.find(a => a.id === id);
      if (app) {
        document.getElementById('app-id').value = app.id;
        document.getElementById('app-title').value = app.title;
        document.getElementById('app-category').value = app.category;
        document.getElementById('app-url').value = app.url;
        document.getElementById('app-description').value = app.description || '';
        document.getElementById('app-icon').value = app.icon || 'app-window';
        document.getElementById('app-status').value = app.status || 'wip';
        document.getElementById('app-tags').value = app.tags || '';
        document.getElementById('app-featured').checked = !!app.featured;
      }
    } catch { /* ignore */ }
  }

  modal.style.display = 'flex';
}

function closeAppModal() {
  document.getElementById('app-modal').style.display = 'none';
  editingAppId = null;
}

document.getElementById('app-cancel').addEventListener('click', closeAppModal);

document.getElementById('app-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('app-title').value,
    category: document.getElementById('app-category').value,
    url: document.getElementById('app-url').value,
    description: document.getElementById('app-description').value,
    icon: document.getElementById('app-icon').value,
    status: document.getElementById('app-status').value,
    tags: document.getElementById('app-tags').value,
    featured: document.getElementById('app-featured').checked,
    is_active: 1
  };

  try {
    if (editingAppId) {
      const res = await fetch(`/api/apps/${editingAppId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed');
    } else {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed');
    }
    closeAppModal();
    await loadAdminApps();
  } catch {
    alert('Failed to save app.');
  }
});

async function toggleApp(id) {
  try {
    await fetch(`/api/apps/${id}`, { method: 'PATCH' });
    await loadAdminApps();
  } catch { alert('Failed to toggle app.'); }
}

async function deleteApp(id) {
  if (!confirm('Delete this app?')) return;
  try {
    await fetch(`/api/apps/${id}`, { method: 'DELETE' });
    await loadAdminApps();
  } catch { alert('Failed to delete app.'); }
}

// ── Cross-App Activity tab ──
async function loadActivity() {
  const el = document.getElementById('tab-activity');
  el.innerHTML = '<div class="empty-state">Loading…</div>';
  try {
    const res = await fetch('/api/admin/activity');
    if (!res.ok) throw new Error('Failed');
    const activity = await res.json();
    if (!activity.length) { el.innerHTML = '<div class="empty-state">No activity recorded yet.</div>'; return; }

    el.innerHTML = `
      <table class="admin-table">
        <thead><tr>
          <th>ID</th><th>Class</th><th>Student</th><th>Source App</th><th>Details</th><th>Timestamp</th>
        </tr></thead>
        <tbody>
          ${activity.map(a => `
            <tr>
              <td class="mono">${a.id}</td>
              <td>${a.class_name}</td>
              <td>${a.student_name}</td>
              <td class="truncate mono">${a.source_app_url || '—'}</td>
              <td class="truncate">${a.activity_details || '—'}</td>
              <td class="mono">${a.timestamp}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch { el.innerHTML = '<div class="empty-state">Failed to load activity.</div>'; }
}

// ── PQP Submissions tab ──
async function loadPQP() {
  const el = document.getElementById('tab-pqp');
  el.innerHTML = '<div class="empty-state">Loading…</div>';
  try {
    const res = await fetch('/api/admin/pqp');
    if (!res.ok) throw new Error('Failed');
    const { submissions, feedback } = await res.json();

    if (!submissions.length && !feedback.length) {
      el.innerHTML = '<div class="empty-state">No PQP submissions or feedback yet.</div>';
      return;
    }

    let html = '';

    if (submissions.length) {
      html += `<div class="pqp-section"><h4>Submissions (${submissions.length})</h4>`;
      submissions.map(s => {
        const relatedFeedback = feedback.filter(f => f.target_submission_id === s.id);
        html += `
          <div class="pqp-item">
            <div class="pqp-item-title">${s.title || 'Untitled'}</div>
            <div class="pqp-item-meta">${s.student_name || 'Unknown'} · ${s.class_name || '—'} · ${s.timestamp}</div>
            <div class="pqp-item-content">${(s.content || '').substring(0, 500)}${s.content && s.content.length > 500 ? '…' : ''}</div>
            ${relatedFeedback.length ? `
              <div class="pqp-feedback-block">
                ${relatedFeedback.map(f => `
                  <div class="pqp-feedback-row">
                    <span class="pqp-feedback-label">Praise:</span> ${f.praise_text || '—'}<br>
                    <span class="pqp-feedback-label">Question:</span> ${f.question_text || '—'}<br>
                    <span class="pqp-feedback-label">Polish:</span> ${f.polish_text || '—'}
                  </div>`).join('')}
              </div>` : ''}
          </div>`;
      });
      html += '</div>';
    }

    if (feedback.length && !submissions.length) {
      html += `<div class="pqp-section"><h4>Feedback (${feedback.length})</h4>`;
      feedback.map(f => `
        <div class="pqp-item">
          <div class="pqp-item-meta">Submission #${f.target_submission_id} · ${f.timestamp}</div>
          <div class="pqp-feedback-row">
            <span class="pqp-feedback-label">Praise:</span> ${f.praise_text || '—'}<br>
            <span class="pqp-feedback-label">Question:</span> ${f.question_text || '—'}<br>
            <span class="pqp-feedback-label">Polish:</span> ${f.polish_text || '—'}
          </div>
        </div>`).join('');
      html += '</div>';
    }

    el.innerHTML = html;
  } catch { el.innerHTML = '<div class="empty-state">Failed to load PQP data.</div>'; }
}

// ── Changelog tab ──
async function loadChangelog() {
  const el = document.getElementById('tab-changelog');
  el.innerHTML = '<div class="empty-state">Loading…</div>';
  try {
    const res = await fetch('/api/admin/changelog');
    if (!res.ok) throw new Error('Failed');
    const log = await res.json();
    if (!log.length) { el.innerHTML = '<div class="empty-state">No changelog entries yet.</div>'; return; }

    el.innerHTML = `
      <table class="admin-table">
        <thead><tr>
          <th>ID</th><th>Admin ID</th><th>Action</th><th>Table</th><th>Timestamp</th>
        </tr></thead>
        <tbody>
          ${log.map(c => `
            <tr>
              <td class="mono">${c.id}</td>
              <td class="mono">${c.admin_id ?? '—'}</td>
              <td><span class="badge badge-${c.action_type === 'delete' ? 'wip' : 'active'}">${c.action_type}</span></td>
              <td class="mono">${c.table_affected}</td>
              <td class="mono">${c.timestamp}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch { el.innerHTML = '<div class="empty-state">Failed to load changelog.</div>'; }
}

// ── Admin login form ──
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;
  try {
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      showDashboard();
    } else {
      alert('Incorrect password.');
    }
  } catch {
    alert('Network error. Please try again.');
  }
});

// ── Admin logout ──
document.getElementById('admin-logout').addEventListener('click', async () => {
  await fetch('/api/auth/admin-logout', { method: 'POST' });
  showAdminLogin();
});

// ── Tab click handlers ──
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

checkAdminSession();
