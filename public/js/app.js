let currentUser = null;

// ── Session check on load ──
async function checkSession() {
  try {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    if (data.authenticated) {
      currentUser = data.user;
      showDirectory();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-view').style.display = 'flex';
  document.getElementById('directory-view').style.display = 'none';
}

function showDirectory() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('directory-view').style.display = 'block';
  document.getElementById('user-display').textContent =
    `${currentUser.student_name} · ${currentUser.class_name}`;
  loadApps();
}

// ── SSO: append class & name to outbound URL ──
function appendSSO(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}class=${encodeURIComponent(currentUser.class_name)}&name=${encodeURIComponent(currentUser.student_name)}`;
}

// ── Build app card HTML ──
function buildCard(app) {
  const ssoUrl = appendSSO(app.url);
  const displayUrl = app.url.replace('https://', '');
  const statusClass = { live: 'status-live', beta: 'status-beta', wip: 'status-wip' }[app.status] || 'status-wip';
  const tags = (app.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const tagsHtml = tags.map(t => `<span class="tag">${t}</span>`).join('');
  const featuredClass = app.featured ? 'featured' : '';
  const searchableText = `${app.title} ${app.description || ''} ${tags.join(' ')} ${app.url}`.toLowerCase().replace(/"/g, '');

  return `
    <a class="app-card ${featuredClass}" href="${ssoUrl}" target="_blank" rel="noopener" data-searchable="${searchableText}">
      <div class="card-top">
        <div class="card-icon"><i class="ti ti-${app.icon || 'app-window'}"></i></div>
        <span class="card-status ${statusClass}">${app.status || 'wip'}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${app.title}</div>
        <p class="card-desc">${app.description || ''}</p>
        ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      </div>
      <div class="card-footer">
        <span class="card-url">${displayUrl}</span>
        <span class="card-arrow">↗</span>
      </div>
    </a>`;
}

// ── Load + render apps from API ──
async function loadApps() {
  const container = document.getElementById('ecosystem-container');
  const navContainer = document.getElementById('category-nav');
  const lastUpdated = document.getElementById('last-updated');

  try {
    const res = await fetch('/api/apps');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const apps = await res.json();

    if (!apps.length) {
      container.innerHTML = '<div class="state-msg">No apps deployed yet.</div>';
      return;
    }

    const grouped = {};
    apps.forEach(app => {
      const cat = app.category || 'General Tools';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(app);
    });

    container.innerHTML = '';
    navContainer.innerHTML = '';

    Object.keys(grouped).sort().forEach(category => {
      const categoryApps = grouped[category];
      const liveCount = categoryApps.filter(a => a.status === 'live').length;
      const sectionId = 'cat-' + category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      navContainer.insertAdjacentHTML('beforeend',
        `<a href="#${sectionId}" class="category-link">${category}</a>`);

      const sectionHtml = `
        <div class="category-section" id="${sectionId}">
          <div class="section-header">
            <span class="section-label">${category}</span>
            <span class="section-count">${categoryApps.length} Apps · ${liveCount} Live</span>
          </div>
          <div class="apps-grid">
            ${[...categoryApps].reverse().map(buildCard).join('')}
          </div>
        </div>`;

      container.insertAdjacentHTML('beforeend', sectionHtml);
    });

    lastUpdated.textContent = `urgentdesign.app · updated ${new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    setupScrollReveal();
    setupLiveSearch();

  } catch (err) {
    container.innerHTML = `<div class="state-msg">Could not load apps<br><span style="font-size:0.75rem;opacity:0.7">${err.message}</span></div>`;
  }
}

// ── Scroll reveal animation ──
function setupScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        setTimeout(() => { entry.target.style.transitionDelay = '0s'; }, 600);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.apps-grid').forEach(grid => {
    const cards = grid.querySelectorAll('.app-card');
    cards.forEach((card, index) => {
      card.style.transitionDelay = `${(index % 3) * 0.1}s`;
      observer.observe(card);
    });
  });
}

// ── Live search ──
function setupLiveSearch() {
  const searchInput = document.getElementById('app-search');

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();

    document.querySelectorAll('.category-section').forEach(section => {
      let hasVisibleCards = false;

      section.querySelectorAll('.app-card').forEach(card => {
        const searchableText = card.getAttribute('data-searchable');
        if (searchableText.includes(term)) {
          card.style.display = 'flex';
          hasVisibleCards = true;
          card.classList.add('revealed');
          card.style.transitionDelay = '0s';
        } else {
          card.style.display = 'none';
        }
      });

      section.style.display = hasVisibleCards ? 'block' : 'none';
    });
  });
}

// ── Login form ──
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const class_name = document.getElementById('class-select').value;
  const student_name = document.getElementById('name-input').value.trim();
  if (!class_name || !student_name) return;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_name, student_name })
    });

    if (res.ok) {
      currentUser = await res.json();
      showDirectory();
    } else {
      const error = await res.json();
      alert(error.error || 'Login failed');
    }
  } catch {
    alert('Network error. Please try again.');
  }
});

// ── Logout ──
document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  showLogin();
});

checkSession();
