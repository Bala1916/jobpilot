(() => {
  "use strict";
  const KEYS = { resume: "jobpilot_master_resume_v1", jobs: "jobpilot_saved_jobs_v1" };
  const $ = (id) => document.getElementById(id);
  let jobs = readJSON(KEYS.jobs, []);
  let currentJobId = null;

  function readJSON(key, fallback) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch (_) { return fallback; }
  }
  function persistJobs() {
    localStorage.setItem(KEYS.jobs, JSON.stringify(jobs));
    $("savedCount").textContent = String(jobs.length);
  }
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function showTab(id) {
    ["searchPanel","resumePanel","savedPanel","jobDetail"].forEach(x => $(x).classList.toggle("hidden", x !== id));
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === id));
    if (id === "savedPanel") renderJobs();
    window.scrollTo({top:0, behavior:"smooth"});
  }
  document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));

  function makeSearchUrl(base, keyword, location, extras = "") {
    const q = [keyword, "jobs", location, extras].filter(Boolean).join(" ");
    return base + encodeURIComponent(q);
  }
  function buildSearchLinks() {
    const keyword = $("keyword").value.trim();
    const location = $("location").value.trim();
    const mode = $("workMode").value;
    const exp = $("experience").value === "Any experience" ? "" : $("experience").value;
    const date = $("dateFilter").value;
    const extra = [mode !== "Any" ? mode : "", exp].filter(Boolean).join(" ");
    const googleQ = [keyword, "jobs", location, extra].filter(Boolean).join(" ");
    const googleUrl = "https://www.google.com/search?q=" + encodeURIComponent(googleQ) + (date ? "&tbs=qdr:" + date : "");
    const links = [
      ["G","Google — whole web",googleUrl,"Search public listings and company career pages"],
      ["B","Bing — whole web",makeSearchUrl("https://www.bing.com/search?q=",keyword,location,extra),"Find indexed job pages"],
      ["in","LinkedIn Jobs","https://www.linkedin.com/jobs/search/?keywords="+encodeURIComponent(keyword)+"&location="+encodeURIComponent(location),"Search LinkedIn listings"],
      ["N","Naukri","https://www.naukri.com/"+encodeURIComponent(keyword.toLowerCase().replace(/\s+/g,"-"))+"-jobs-in-"+encodeURIComponent(location.toLowerCase().replace(/\s+/g,"-")),"Search Naukri listings"],
      ["I","Indeed","https://in.indeed.com/jobs?q="+encodeURIComponent(keyword)+"&l="+encodeURIComponent(location),"Search Indeed listings"],
      ["C","Company career pages", "https://www.google.com/search?q="+encodeURIComponent('site:careers OR site:jobs "'+keyword+'" "'+location+'"'),"Find employer-hosted roles"]
    ];
    $("searchLinks").innerHTML = links.map(x => `<a class="source-card" href="${esc(x[2])}" target="_blank" rel="noopener"><span class="source-icon">${esc(x[0])}</span><span><strong>${esc(x[1])}</strong><small>${esc(x[3])}</small></span><span class="arrow">↗</span></a>`).join("");
  }
  $("searchForm").addEventListener("submit", e => {
    e.preventDefault();
    buildSearchLinks();
    // Open broad web search first; portal cards remain available for user-selected searches.
    window.open($("searchLinks").querySelector("a").href, "_blank", "noopener");
  });
  ["keyword","location","workMode","experience","dateFilter"].forEach(id => $(id).addEventListener("change", buildSearchLinks));

  $("jobForm").addEventListener("submit", e => {
    e.preventDefault();
    const url = $("jobUrl").value.trim();
    try { const u = new URL(url); if (!["http:","https:"].includes(u.protocol)) throw new Error(); }
    catch (_) { alert("Please enter a valid http or https job URL."); return; }
    const job = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
      title: $("jobTitle").value.trim(),
      company: $("jobCompany").value.trim(),
      url,
      description: $("jobDescription").value.trim(),
      savedAt: new Date().toISOString()
    };
    jobs.unshift(job); persistJobs();
    $("jobTitle").value = ""; $("jobCompany").value = ""; $("jobUrl").value = ""; $("jobDescription").value = "";
    showTab("savedPanel");
  });

  async function readResumeFile(file) {
    const name = file.name.toLowerCase();
    $("fileStatus").textContent = "Reading " + file.name + "…";
    try {
      let text = "";
      if (name.endsWith(".txt")) text = await file.text();
      else if (name.endsWith(".docx")) {
        if (!window.mammoth) throw new Error("Word reader library did not load. Check your internet connection and refresh.");
        const result = await window.mammoth.extractRawText({arrayBuffer: await file.arrayBuffer()});
        text = result.value || "";
      } else if (name.endsWith(".pdf")) {
        if (!window.pdfjsLib) throw new Error("PDF reader library did not load. Check your internet connection and refresh.");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument({data: await file.arrayBuffer()}).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map(item => item.str).join(" "));
        }
        text = pages.join("\n\n");
      } else throw new Error("Please select a PDF, DOCX, or TXT file.");
      $("resumeText").value = text;
      $("fileStatus").textContent = "Extracted text from " + file.name + ". Review it, then save.";
      $("resumeStatus").textContent = "";
    } catch (err) {
      $("fileStatus").textContent = err.message || "Could not read this file.";
    }
  }
  $("resumeFile").addEventListener("change", e => { if (e.target.files[0]) readResumeFile(e.target.files[0]); });
  $("saveResume").addEventListener("click", () => {
    const text = $("resumeText").value.trim();
    if (!text) { $("resumeStatus").textContent = "Upload or paste your resume first."; return; }
    try {
      localStorage.setItem(KEYS.resume, text);
      $("resumeStatus").textContent = "Master resume saved in this browser.";
    } catch (_) {
      $("resumeStatus").textContent = "Browser storage is full. Shorten the text or use a smaller resume.";
    }
  });
  $("clearResume").addEventListener("click", () => {
    if (!confirm("Delete the saved master resume from this browser?")) return;
    localStorage.removeItem(KEYS.resume); $("resumeText").value = ""; $("resumeStatus").textContent = "Saved resume cleared.";
  });
  const storedResume = localStorage.getItem(KEYS.resume);
  if (storedResume) { $("resumeText").value = storedResume; $("fileStatus").textContent = "Saved master resume loaded from this browser."; }

  function renderJobs() {
    $("savedCount").textContent = String(jobs.length);
    $("emptyJobs").classList.toggle("hidden", jobs.length > 0);
    $("savedJobs").innerHTML = jobs.map(j => `<article class="job-card">
      <h3>${esc(j.title)}</h3><p>${esc(j.company || "Company not specified")}</p>
      <p>${esc(j.url)}</p><div class="job-actions">
      <button class="primary" data-open="${esc(j.id)}">Review & tailor resume</button>
      <a href="${esc(j.url)}" target="_blank" rel="noopener">Open application ↗</a>
      <button class="secondary" data-delete="${esc(j.id)}">Remove</button></div></article>`).join("");
    $("savedJobs").querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openJob(b.dataset.open)));
    $("savedJobs").querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => {
      jobs = jobs.filter(j => j.id !== b.dataset.delete); persistJobs(); renderJobs();
    }));
  }
  function words(s) {
    return (s.toLowerCase().match(/[a-z][a-z0-9+#.-]{1,}/g) || []).filter(w => !["with","from","that","this","will","your","have","has","are","the","and","for","you","our","who","what","job","role","years","year","work","using","including","required","preferred","about","into","their","they","them","all","any","can","should","must","per","etc"].includes(w));
  }
  function openJob(id) {
    currentJobId = id;
    const j = jobs.find(x => x.id === id); if (!j) return;
    const resume = localStorage.getItem(KEYS.resume) || "";
    const jobWords = [...new Set(words(j.title + " " + j.description))];
    const resumeWords = new Set(words(resume));
    const matches = jobWords.filter(w => resumeWords.has(w)).slice(0,30);
    const percent = jobWords.length ? Math.round(matches.length / Math.min(jobWords.length, 30) * 100) : 0;
    $("jobDetailContent").innerHTML = `
      <h2>${esc(j.title)}</h2><p class="muted">${esc(j.company || "Company not specified")}</p>
      <p><a href="${esc(j.url)}" target="_blank" rel="noopener">Open original job/application page ↗</a></p>
      <div class="match-box"><h3>Keyword overlap (rough estimate): ${percent}%</h3>
        <p class="small">This simple prototype checks word overlap only. It is not a reliable assessment of your suitability.</p>
        ${matches.length ? matches.map(w=>`<span class="keyword-chip">${esc(w)}</span>`).join("") : '<p class="small">No matching keywords found yet, or no resume has been saved.</p>'}
      </div>
      <h3>Job description</h3><div class="job-description">${esc(j.description || "No job description saved. Edit/add the job with the full description for useful tailoring.")}</div>
      <h3 style="margin-top:20px">Generate a Word resume</h3>
      <p class="muted small">The generator reorders relevant wording from your existing resume and adds a short role-focused summary. It does not invent skills or experience. Review every line before using it.</p>
      <label>Resume headline (optional)<input id="resumeHeadline" placeholder="e.g. Application Support Professional"></label>
      <label style="margin-top:10px">Additional verified details (optional)<textarea id="extraDetails" rows="3" placeholder="Only add skills or achievements that are true and already supported by your experience."></textarea></label>
      <div class="button-row"><button id="generateDocx" class="primary">Generate Word (.docx)</button><button id="copyTailored" class="secondary">Prepare tailored text</button></div>
      <p id="generateStatus" class="status" role="status"></p>
      <textarea id="tailoredPreview" rows="12" placeholder="Tailored resume preview will appear here."></textarea>`;
    $("generateDocx").addEventListener("click", () => generateDocx(j));
    $("copyTailored").addEventListener("click", () => {
      const t = makeTailoredText(j); $("tailoredPreview").value = t;
      $("generateStatus").textContent = "Preview prepared. Check all details before exporting.";
    });
    showTab("jobDetail");
  }
  $("backToJobs").addEventListener("click", () => showTab("savedPanel"));

  function makeTailoredText(job) {
    const master = (localStorage.getItem(KEYS.resume) || "").trim();
    if (!master) return "Please upload and save your master resume in the My resume tab first.";
    const extra = ($("extraDetails")?.value || "").trim();
    const headline = ($("resumeHeadline")?.value || job.title).trim();
    const relevant = new Set(words(job.title + " " + job.description));
    const lines = master.split(/\r?\n/);
    const ranked = lines.map((line, index) => {
      const ws = words(line);
      const score = ws.filter(w => relevant.has(w)).length;
      return {line: line.trim(), index, score};
    }).filter(x => x.line);
    // Preserve the source resume's section order; only remove exact duplicate blank/empty lines.
    const summary = `TARGET ROLE: ${headline}\nTARGET COMPANY: ${job.company || "Not specified"}\n\nROLE-FOCUSED SUMMARY\nThis resume is tailored for the ${job.title} opportunity${job.company ? " at " + job.company : ""}. The experience and skills below are taken from the candidate-provided master resume.`;
    const sorted = [...ranked].sort((a,b) => b.score - a.score || a.index - b.index);
    const keyLines = sorted.filter(x => x.score > 0).slice(0, Math.min(20, sorted.length));
    const selectedSet = new Set(keyLines.map(x => x.index));
    const selected = ranked.filter(x => selectedSet.has(x.index)).map(x => x.line);
    const content = selected.length >= 4 ? selected.join("\n") : master;
    return `${summary}\n\nRELEVANT CONTENT FROM MASTER RESUME\n${content}${extra ? "\n\nADDITIONAL DETAILS PROVIDED FOR REVIEW\n"+extra : ""}\n\nREVIEW CHECKLIST\n- Confirm all dates, job titles, skills, and achievements.\n- Remove any wording that is not accurate for your experience.\n- Add or restore any important sections omitted from this tailored draft.\n- This draft is not a guarantee of ATS compatibility or interview selection.`;
  }
  async function generateDocx(job) {
    const status = $("generateStatus");
    const resume = localStorage.getItem(KEYS.resume) || "";
    if (!resume.trim()) { status.textContent = "Please save your master resume in My resume first."; return; }
    const text = makeTailoredText(job);
    $("tailoredPreview").value = text;
    if (!window.docx) { status.textContent = "Word export library did not load. Check your internet connection and refresh."; return; }
    try {
      const {Document,Paragraph,Packer,TextRun,HeadingLevel} = window.docx;
      const children = text.split("\n").map(line => {
        if (!line.trim()) return new Paragraph({text:""});
        const isHeading = /^(TARGET ROLE:|TARGET COMPANY:|ROLE-FOCUSED SUMMARY|RELEVANT CONTENT FROM MASTER RESUME|ADDITIONAL DETAILS PROVIDED FOR REVIEW|REVIEW CHECKLIST)$/.test(line);
        if (isHeading) return new Paragraph({text:line, heading:HeadingLevel.HEADING_2, spacing:{before:220,after:90}});
        if (line.startsWith("- ")) return new Paragraph({children:[new TextRun({text:line.slice(2), bullet:{level:0}})]});
        return new Paragraph({children:[new TextRun({text:line})], spacing:{after:70}});
      });
      const doc = new Document({sections:[{properties:{},children}]});
      const blob = await Packer.toBlob(doc);
      const a = document.createElement("a");
      const safe = (job.title || "tailored-resume").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,45) || "tailored-resume";
      a.href = URL.createObjectURL(blob); a.download = `JobPilot-${safe}.docx`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
      status.textContent = "Word file generated. Open it and review the entire resume before applying.";
    } catch (err) { status.textContent = "Could not create Word file: " + (err.message || "unknown error"); }
  }

  buildSearchLinks(); persistJobs();
})();