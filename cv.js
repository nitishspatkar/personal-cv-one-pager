/**
 * CV Builder — CV data, language toggle, translation/tailor API, print
 * Expects markup from cv.html and styles from cv.css
 */

const CV_DATA = {
  en: {
    expTitle:"Work experience", eduTitle:"Education", awardsTitle:"Highlights",
    skillsTitle:"Skills", langTitle:"Languages", jobTitle:"Senior Researcher",
    experience:[
      { company:"FHNW", role:"Senior Researcher", period:"Mar 2022 – Present", location:"Brugg, CH",
        bullets:["Led applied innovation projects with SMEs and startups across energy, mobility, and AI — from roadmap to delivery.","Coached Product Owners and Agile teams on backlog prioritisation, cross-team coordination, and value delivery across Agile Release Trains.","Secured research funding; managed stakeholder relationships and coordinated release plans with internal and external partners."]},
      { company:"University of Bern", role:"Research Assistant", period:"Feb 2018 – Feb 2022", location:"Bern, CH",
        bullets:["Mentored 50+ students/year through full software project lifecycle; taught SE seminar and supervised BSc/MSc theses."]},
      { company:"ActiDo GmbH", role:"Web Developer", period:"Jan 2017 – Jan 2018", location:"Paderborn, DE",
        bullets:["Built React front-ends from UI/UX specs; responsible for HTML, CSS, and frontend logic."]},
      { company:"University of Paderborn", role:"Research Assistant", period:"Jan 2016 – Jan 2018", location:"Paderborn, DE",
        bullets:["Elicited requirements from Volksbank clients; developed a single-page sports app using Angular and Django REST."]},
      { company:"Infosys Ltd.", role:"Systems Engineer", period:"Jan 2012 – Jan 2014", location:"Pune, IN",
        bullets:["PLM development on Windchill; delivered enterprise web apps for Cox Communications and other telecom clients."]}
    ]
  },
  de: null, tailored: null
};
let currentLang = 'en';

function renderExperience(arr, title) {
  document.getElementById('expTitle').textContent = title;
  document.getElementById('expBlock').innerHTML = arr.map((e) => {
    const text = (e.bullets || []).map(b => String(b).trim()).filter(Boolean).join(' ');
    const items = text ? `<p>${text}</p>` : '';
    return `<div class="job">
      <div class="job-meta">
        <div class="job-company">${e.company}</div>
        <div class="job-role">${e.role}</div>
        <div class="job-period">${e.period}</div>
        <div class="job-location">${e.location}</div>
      </div>
      <div class="job-desc">${items}</div>
    </div>`;
  }).join('');
}

function applyTranslation(d) {
  ['expTitle','eduTitle','awardsTitle','skillsTitle','langTitle'].forEach(id=>{if(d[id])document.getElementById(id).textContent=d[id];});
  if(d.jobTitle) document.getElementById('cvJobTitle').textContent=d.jobTitle;
  if(d.experience) renderExperience(d.experience, d.expTitle||'Berufserfahrung');
  if(d.eduBlock) document.getElementById('eduBlock').innerHTML=d.eduBlock;
  if(d.awardsBlock) document.getElementById('awardsBlock').innerHTML=d.awardsBlock;
}

function resetToEN() {
  ['expTitle','eduTitle','awardsTitle','skillsTitle','langTitle'].forEach(id=>document.getElementById(id).textContent=CV_DATA.en[id]);
  document.getElementById('cvJobTitle').textContent='Senior Researcher';
  renderExperience(CV_DATA.en.experience, CV_DATA.en.expTitle);
  document.getElementById('eduBlock').innerHTML=`
    <div class="edu-entry"><div><div class="edu-year">2018 – 2022</div></div><div><div class="edu-inst">University of Bern</div><div class="edu-deg">Ph.D. Computer Science, Switzerland</div></div></div>
    <div class="edu-entry"><div><div class="edu-year">2014 – 2018</div></div><div><div class="edu-inst">University of Paderborn</div><div class="edu-deg">M.Sc. Computer Science, Germany</div></div></div>
    <div class="edu-entry"><div><div class="edu-year">2009 – 2012</div></div><div><div class="edu-inst">University of Mumbai</div><div class="edu-deg">B.E. Computer Science, India</div></div></div>`;
  document.getElementById('awardsBlock').innerHTML=`
    <li><strong>Local Organizer</strong> XP'25 — 26th International Conference on Agile Software Development.</li>
    <li><strong>Best Reviewer Award</strong> REFSQ 2024 &amp; 2025.</li>
    <li>Reviewer / PC member at IEEE RE, REFSQ, XP, TOSEM, EMSE, IST, ICT4S, SE-SRC (2022–2026).</li>
    <li>Co-organizer of the 9th &amp; 10th International Workshop on Crowd-Based Requirements Engineering (2025, 2026).</li>`;
}

function setLang(lang) {
  currentLang=lang;
  document.getElementById('btnEN').classList.toggle('active',lang==='en');
  document.getElementById('btnDE').classList.toggle('active',lang==='de');
  document.getElementById('langBadge').textContent=lang.toUpperCase();
  document.getElementById('tailoredBadge').style.display='none';
  if(lang==='en') resetToEN();
  else if(lang==='de'){if(CV_DATA.de) applyTranslation(CV_DATA.de); else showStatus('translateStatus','info','Click "Generate German CV" to auto-translate.');}
}

async function translateCV(){
  showLoading('Translating with Claude AI…');
  document.getElementById('translateBtn').disabled=true;
  const prompt=`Translate this CV from English to German (Swiss professional standard). Keep all proper nouns, company names, and tool names unchanged. Return ONLY valid JSON, no markdown:

{"expTitle":"Berufserfahrung","eduTitle":"Ausbildung","awardsTitle":"Höhepunkte","skillsTitle":"Kenntnisse","langTitle":"Sprachen","jobTitle":"Senior Researcher","experience":[{"company":"...","role":"...","period":"...","location":"...","bullets":["..."]}],"eduBlock":"<div class=\\"edu-entry\\"><div><div class=\\"edu-year\\">2018 – 2022</div></div><div><div class=\\"edu-inst\\">University of Bern</div><div class=\\"edu-deg\\">Dr. sc. Informatik, Schweiz</div></div></div><div class=\\"edu-entry\\"><div><div class=\\"edu-year\\">2014 – 2018</div></div><div><div class=\\"edu-inst\\">Universität Paderborn</div><div class=\\"edu-deg\\">M.Sc. Informatik, Deutschland</div></div></div><div class=\\"edu-entry\\"><div><div class=\\"edu-year\\">2009 – 2012</div></div><div><div class=\\"edu-inst\\">Universität Mumbai</div><div class=\\"edu-deg\\">B.E. Informatik, Indien</div></div></div>","awardsBlock":"<li>...</li>"}

TRANSLATE:
1. FHNW | Senior Researcher | Mar 2022–Present | Brugg, CH
- Led applied innovation projects with SMEs and startups across energy, mobility, and AI — from roadmap to delivery.
- Coached Product Owners and Agile teams on backlog prioritisation, cross-team coordination, and value delivery across Agile Release Trains.
- Secured research funding; managed stakeholder relationships and coordinated release plans with internal and external partners.
2. University of Bern | Research Assistant | Feb 2018–Feb 2022 | Bern, CH
- Mentored 50+ students/year on software projects from ideation through delivery.
- Independent instructor for the Seminar in Software Engineering; supervised theses.
3. ActiDo GmbH | Web Developer | Jan 2017–Jan 2018 | Paderborn, DE
- Built responsive web front-ends using React and HTML/CSS.
4. University of Paderborn | Research Assistant | Jan 2016–Jan 2018 | Paderborn, DE
- Gathered requirements; developed sports app using Angular and Django Rest Framework.
5. Infosys Ltd. | Systems Engineer | Jan 2012–Jan 2014 | Pune, IN
- PLM platform Windchill; delivered enterprise web apps for telecom clients.
AWARDS (omit IREB membership; it lives in About): Local Organizer XP'25. Best Reviewer Award REFSQ 2024 & 2025. Reviewer/PC at IEEE RE, REFSQ, XP, TOSEM, EMSE, IST, ICT4S, SE-SRC. Co-organizer 9th & 10th CrowdRE Workshop.`;
  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
    const data=await res.json();
    const parsed=JSON.parse(data.content.map(i=>i.text||'').join('').replace(/```json|```/g,'').trim());
    CV_DATA.de=parsed; currentLang='de';
    document.getElementById('btnEN').classList.remove('active');
    document.getElementById('btnDE').classList.add('active');
    document.getElementById('langBadge').textContent='DE';
    applyTranslation(parsed);
    showStatus('translateStatus','success','✓ German CV generated. Toggle EN/DE above.');
  }catch(e){showStatus('translateStatus','error','✗ Translation failed. Try again.');console.error(e);}
  hideLoading(); document.getElementById('translateBtn').disabled=false;
}

async function tailorCV(){
  const jd=document.getElementById('jobDesc').value.trim();
  if(!jd){showStatus('tailorStatus','error','Paste a job description first.');return;}
  showLoading('Tailoring for ATS…');
  document.getElementById('tailorBtn').disabled=true;
  const lang=currentLang==='de'?'German':'English';
  const prompt=`ATS optimization: rewrite CV experience bullets to match the job description. Keep all facts/companies/dates/roles exactly as-is; front-load JD keywords; mirror exact JD terminology where truthful; write in ${lang}. Return ONLY valid JSON:
{"experience":[{"company":"...","role":"...","period":"...","location":"...","bullets":["..."]}],"tailoringSummary":"..."}

EXPERIENCE:
1. FHNW | Senior Researcher | Mar 2022–Present | Brugg, CH — Innovation with SMEs/startups; coached POs & Agile teams; funding & stakeholder coordination.
2. University of Bern | Research Assistant | Feb 2018–Feb 2022 | Bern, CH — Mentored 50+ students; Taught SE seminar; Supervised theses.
3. ActiDo GmbH | Web Developer | Jan 2017–Jan 2018 | Paderborn, DE — React/HTML/CSS front-ends.
4. University of Paderborn | Research Assistant | Jan 2016–Jan 2018 | Paderborn, DE — Requirements; Angular/Django sports app.
5. Infosys Ltd. | Systems Engineer | Jan 2012–Jan 2014 | Pune, IN — Windchill PLM; enterprise web apps for telecom.

JOB DESCRIPTION:
${jd}`;
  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
    const data=await res.json();
    const parsed=JSON.parse(data.content.map(i=>i.text||'').join('').replace(/```json|```/g,'').trim());
    CV_DATA.tailored=parsed;
    renderExperience(parsed.experience, currentLang==='de'?'Berufserfahrung':'Work experience');
    document.getElementById('tailoredBadge').style.display='inline-block';
    showStatus('tailorStatus','success',`✓ ${parsed.tailoringSummary||'CV tailored.'}`);
  }catch(e){showStatus('tailorStatus','error','✗ Tailoring failed. Try again.');console.error(e);}
  hideLoading(); document.getElementById('tailorBtn').disabled=false;
}

function resetCV(){
  CV_DATA.tailored=null;
  document.getElementById('tailoredBadge').style.display='none';
  document.getElementById('tailorStatus').className='status-msg';
  if(currentLang==='de'&&CV_DATA.de) renderExperience(CV_DATA.de.experience, CV_DATA.de.expTitle);
  else renderExperience(CV_DATA.en.experience, CV_DATA.en.expTitle);
}

function printInstructions() {
  const hint = document.getElementById('printHint');
  if (hint) hint.style.display = 'inline';
  /* Call print synchronously from the click so the browser still treats it as a user gesture */
  window.print();
}

function showLoading(msg) {
  document.getElementById('loadingMsg').textContent = msg;
  document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('show');
}

function showStatus(id, kind, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'status-msg show';
  if (kind === 'error') el.classList.add('error');
  if (kind === 'success') el.classList.add('success');
}
