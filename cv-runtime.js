/**
 * CV Builder runtime
 * - Reads content from cv-content.en.json / cv-content.de.json
 * - Renders About, Experience, Education, Skills, Languages, Highlights
 * - Provides setLang / resetCV / printInstructions hooks for existing HTML
 *
 * NOTE: Online translation/tailoring via external APIs is intentionally disabled.
 */

const CONTENT = { en: null, de: null };
let currentLang = 'en';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadAndApplyContent(lang) {
  const safeLang = lang === 'de' ? 'de' : 'en';
  if (CONTENT[safeLang]) {
    applyContent(CONTENT[safeLang], safeLang);
    return;
  }
  try {
    const res = await fetch(`cv-content.${safeLang}.json`);
    if (!res.ok) throw new Error(`Failed to load content for ${safeLang}`);
    const data = await res.json();
    CONTENT[safeLang] = data;
    applyContent(data, safeLang);
  } catch (e) {
    console.error(e);
    showStatus('translateStatus', 'error', `Content load failed for ${safeLang}.`);
  }
}

function applyContent(data, lang) {
  if (!data) return;

  // Header
  if (data.meta) {
    const nameEl = document.querySelector('.cv-name');
    if (nameEl && data.meta.name) nameEl.textContent = data.meta.name;
    const titleEl = document.getElementById('cvJobTitle');
    if (titleEl && data.meta.jobTitle) titleEl.textContent = data.meta.jobTitle;
  }

  // About — keep as a single plain paragraph to avoid print quirks
  if (data.about) {
    const aboutP = document.querySelector('.about-bio .about-single');
    if (aboutP) {
      aboutP.textContent = String(data.about).trim();
    }
  }

  // Contact
  if (data.contact) {
    const c = data.contact;
    // Website
    const websiteLink = document.querySelector('.about-contact-stack a[href^="http"]');
    if (websiteLink && c.website) {
      websiteLink.href = c.website;
      websiteLink.textContent = c.website.replace(/^https?:\/\//, '');
    }
    // Leave email link as-is (managed by Cloudflare script in HTML)
    // Phone is hidden via CSS; runtime still updates the text in case you re-enable it later.
    const phoneSpan = document.querySelector('.about-contact-stack .phone-number');
    if (phoneSpan && c.phone !== undefined) phoneSpan.textContent = c.phone;
    // Icons
    const links = document.querySelectorAll('.about-links .about-icon-link');
    links.forEach(link => {
      const label = link.getAttribute('aria-label');
      if (label === 'LinkedIn' && c.linkedin) link.href = c.linkedin;
      if (label === 'GitHub' && c.github) link.href = c.github;
    });
  }

  // Experience
  if (Array.isArray(data.experience)) {
    const expTitle = document.getElementById('expTitle');
    if (expTitle) expTitle.textContent = data.expTitle || (lang === 'de' ? 'Berufserfahrung' : 'Work experience');
    const expBlock = document.getElementById('expBlock');
    if (expBlock) {
      expBlock.innerHTML = data.experience.map(e => {
        const body = e.body ? escapeHtml(e.body) : '';
        return `<div class="job">
  <div class="job-meta">
    <div class="job-company">${escapeHtml(e.company || '')}</div>
    <div class="job-role">${escapeHtml(e.role || '')}</div>
    <div class="job-period">${escapeHtml(e.period || '')}</div>
    <div class="job-location">${escapeHtml(e.location || '')}</div>
  </div>
  <div class="job-desc">${body ? `<p>${body}</p>` : ''}</div>
</div>`;
      }).join('');
    }
  }

  // Education
  if (Array.isArray(data.education)) {
    const eduTitle = document.getElementById('eduTitle');
    if (eduTitle) eduTitle.textContent = data.eduTitle || (lang === 'de' ? 'Ausbildung' : 'Education');
    const eduBlock = document.getElementById('eduBlock');
    if (eduBlock) {
      eduBlock.innerHTML = data.education.map(e => `
  <div class="edu-entry">
    <div><div class="edu-year">${escapeHtml(e.years || '')}</div></div>
    <div><div class="edu-inst">${escapeHtml(e.institution || '')}</div><div class="edu-deg">${escapeHtml(e.degree || '')}</div></div>
  </div>
`).join('');
    }
  }

  // Skills
  if (Array.isArray(data.skills)) {
    const skillsTitle = document.getElementById('skillsTitle');
    if (skillsTitle) skillsTitle.textContent = data.skillsTitle || (lang === 'de' ? 'Kenntnisse' : 'Skills');
    const skillsBlock = document.getElementById('skillsBlock');
    if (skillsBlock) {
      skillsBlock.innerHTML = data.skills.map(s => `
  <div class="skill-entry">
    <div class="skill-cat">${escapeHtml(s.category || '')}</div>
    <div class="skill-items">${escapeHtml(s.items || '')}</div>
  </div>
`).join('');
    }
  }

  // Languages
  if (Array.isArray(data.languages)) {
    const langTitle = document.getElementById('langTitle');
    if (langTitle) langTitle.textContent = data.langTitle || (lang === 'de' ? 'Sprachen' : 'Languages');
    const langRow = document.querySelector('.lang-row');
    if (langRow) {
      langRow.innerHTML = data.languages.map(l => `
  <div class="lang-e"><span class="lang-n">${escapeHtml(l.name || '')}</span><span class="lang-l">${escapeHtml(l.level || '')}</span></div>
`).join('');
    }
  }

  // Highlights
  if (Array.isArray(data.highlights)) {
    const awardsTitle = document.getElementById('awardsTitle');
    if (awardsTitle) awardsTitle.textContent = data.awardsTitle || (lang === 'de' ? 'Highlights' : 'Highlights');
    const awardsBlock = document.getElementById('awardsBlock');
    if (awardsBlock) {
      awardsBlock.innerHTML = data.highlights.map(h => `
  <li>${escapeHtml(h)}</li>
`).join('');
    }
  }
}

// Language toggle — wired to existing buttons
function setLang(lang) {
  currentLang = lang === 'de' ? 'de' : 'en';
  document.getElementById('btnEN').classList.toggle('active', currentLang === 'en');
  document.getElementById('btnDE').classList.toggle('active', currentLang === 'de');
  document.getElementById('langBadge').textContent = currentLang.toUpperCase();
  document.getElementById('tailoredBadge').style.display = 'none';
  loadAndApplyContent(currentLang);
}

// Translation / tailoring placeholders — keep UI but no external calls
async function translateCV() {
  showStatus('translateStatus', 'error', 'Automatic online translation is disabled. Maintain German text in cv-content.de.json.');
}

async function tailorCV() {
  showStatus('tailorStatus', 'error', 'ATS tailoring via API is disabled in this setup.');
}

function resetCV() {
  loadAndApplyContent(currentLang);
}

function printInstructions() {
  const hint = document.getElementById('printHint');
  if (hint) hint.style.display = 'inline';
  window.print();
}

function showLoading(msg) {
  const el = document.getElementById('loadingMsg');
  if (el) el.textContent = msg;
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.add('show');
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('show');
}

function showStatus(id, kind, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'status-msg show';
  if (kind === 'error') el.classList.add('error');
  if (kind === 'success') el.classList.add('success');
}

// Initial render (English)
document.addEventListener('DOMContentLoaded', () => {
  loadAndApplyContent('en');
});

