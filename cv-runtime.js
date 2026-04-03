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

function isBlank(val) {
  if (val == null) return true;
  if (typeof val === 'string') return val.trim() === '';
  return false;
}

function mergeWithFallback(primary, fallback) {
  if (!fallback) return primary || null;
  if (!primary) return fallback;

  // Strings / scalars: prefer primary if non-blank, else fallback
  if (typeof primary !== 'object' || typeof fallback !== 'object') {
    return isBlank(primary) ? fallback : primary;
  }

  // Arrays: merge by index
  if (Array.isArray(primary) && Array.isArray(fallback)) {
    const maxLen = Math.max(primary.length, fallback.length);
    const result = [];
    for (let i = 0; i < maxLen; i++) {
      result[i] = mergeWithFallback(primary[i], fallback[i]);
    }
    return result;
  }

  // Objects: merge each key with fallback
  const out = {};
  const keys = new Set([...Object.keys(fallback), ...Object.keys(primary)]);
  keys.forEach((key) => {
    const p = primary[key];
    const f = fallback[key];
    if (typeof p === 'object' && p !== null) {
      out[key] = mergeWithFallback(p, f);
    } else if (isBlank(p)) {
      out[key] = f;
    } else {
      out[key] = p;
    }
  });
  return out;
}

async function loadAndApplyContent(lang) {
  const safeLang = lang === 'de' ? 'de' : 'en';
  try {
    // Always make sure English base is loaded
    if (!CONTENT.en) {
      const resEn = await fetch('cv-content.en.json');
      if (!resEn.ok) throw new Error('Failed to load content for en');
      CONTENT.en = await resEn.json();
    }

    if (safeLang === 'en') {
      applyContent(CONTENT.en, 'en');
      return;
    }

    // For German, load overrides and merge with English as fallback
    if (!CONTENT.de) {
      const resDe = await fetch('cv-content.de.json');
      if (!resDe.ok) throw new Error('Failed to load content for de');
      CONTENT.de = await resDe.json();
    }

    const merged = mergeWithFallback(CONTENT.de, CONTENT.en);
    applyContent(merged, 'de');
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
  const btnEN = document.getElementById('btnEN');
  const btnDE = document.getElementById('btnDE');
  if (btnEN) btnEN.classList.toggle('active', currentLang === 'en');
  if (btnDE) btnDE.classList.toggle('active', currentLang === 'de');

  const toolbarEN = document.getElementById('toolbarEN');
  const toolbarDE = document.getElementById('toolbarDE');
  if (toolbarEN) toolbarEN.classList.toggle('lang-toggle-btn--active', currentLang === 'en');
  if (toolbarDE) toolbarDE.classList.toggle('lang-toggle-btn--active', currentLang === 'de');

  const badge = document.getElementById('langBadge');
  if (badge) badge.textContent = currentLang.toUpperCase();

  const tailored = document.getElementById('tailoredBadge');
  if (tailored) tailored.style.display = 'none';
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

