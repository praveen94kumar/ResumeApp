// ---------- STORAGE HELPERS ----------
const STORAGE_KEYS = {
    USERS: "resumeApp_users",
    RESUMES: "resumeApp_resumes",
    JOBS: "resumeApp_jobs",
    THEME: "resumeApp_theme",
    SEEDED: "resumeApp_seeded",
};

let currentUser = null;

function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ---------- DEMO SEED DATA ----------
function seedDemoData() {
    if (localStorage.getItem(STORAGE_KEYS.SEEDED)) return;

    const users = [
        { id: 1, name: "System Admin", username: "admin", password: "admin123", role: "Admin" },
        { id: 2, name: "HR Manager", username: "hr", password: "hr123", role: "HR" },
    ];

    const resumes = [
        {
            id: 1,
            name: "Praveen Kumar",
            email: "praveen@example.com",
            headline: "Junior Data Analyst",
            skills: "Excel, Power BI, SQL, Google Sheets",
            summary: "1+ years experience working with dashboards, reports and data cleaning."
        },
        {
            id: 2,
            name: "Amit Sharma",
            email: "amit@example.com",
            headline: "Junior Accountant",
            skills: "Tally, Busy, Excel, GST",
            summary: "Accounting graduate with experience in day-to-day bookkeeping, GST and TDS."
        }
    ];

    const jobs = [
        {
            id: 1,
            title: "Junior Data Analyst",
            dept: "Analytics",
            location: "Jaipur",
            skills: "Excel, Power BI, SQL",
            description: "Support business intelligence reporting using Excel and Power BI. Work on data cleaning, dashboards and ad-hoc analysis."
        },
        {
            id: 2,
            title: "Junior Accountant",
            dept: "Finance",
            location: "Jaipur",
            skills: "Tally, Busy, Excel, GST",
            description: "Maintain books of accounts, manage GST returns, TDS, and coordinate with finance team."
        }
    ];

    writeJSON(STORAGE_KEYS.USERS, users);
    writeJSON(STORAGE_KEYS.RESUMES, resumes);
    writeJSON(STORAGE_KEYS.JOBS, jobs);
    localStorage.setItem(STORAGE_KEYS.SEEDED, "true");
}

// ---------- THEME ----------
function applyTheme(theme) {
    const body = document.body;
    if (theme === "dark") {
        body.classList.add("theme-dark");
    } else {
        body.classList.remove("theme-dark");
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) themeToggle.checked = theme === "dark";
}

function initTheme() {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
    applyTheme(stored);
}

// ---------- LOGIN ----------
function handleLogin() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("login-error");

    const users = readJSON(STORAGE_KEYS.USERS, []);
    const user = users.find(
        (u) => u.username === username && u.password === password
    );

    if (!user) {
        errorEl.textContent = "Invalid username or password";
        return;
    }

    currentUser = user;
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");

    document.getElementById("current-user-label").textContent =
        `User: ${user.name} (${user.role})`;

    // Admin-only items
    updateAdminVisibility(user);

    // Default view
    switchView("dashboard");
    refreshAllViews();
}

function updateAdminVisibility(user) {
    const adminElements = document.querySelectorAll(".admin-only");
    adminElements.forEach((el) => {
        el.style.display = user.role === "Admin" ? "" : "none";
    });
}

// ---------- NAVIGATION ----------
function switchView(viewName) {
    document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
    document.querySelectorAll(".nav-item").forEach((btn) =>
        btn.classList.remove("active")
    );

    const view = document.getElementById(`view-${viewName}`);
    if (view) view.classList.remove("hidden");

    const activeBtn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    if (viewName === "dashboard") renderDashboard();
    if (viewName === "resumes") renderResumes();
    if (viewName === "jobs") renderJobs();
    if (viewName === "users") renderUsers();
    if (viewName === "matching") {
        populateMatchDropdowns();
        renderMatchTable();
    }
}

function refreshAllViews() {
    renderDashboard();
    renderResumes();
    renderJobs();
    renderUsers();
    populateMatchDropdowns();
    renderMatchTable();
}

// ---------- DASHBOARD ----------
function renderDashboard() {
    const resumes = readJSON(STORAGE_KEYS.RESUMES, []);
    const jobs = readJSON(STORAGE_KEYS.JOBS, []);
    const users = readJSON(STORAGE_KEYS.USERS, []);

    document.getElementById("dash-resume-count").textContent = resumes.length;
    document.getElementById("dash-job-count").textContent = jobs.length;
    document.getElementById("dash-user-count").textContent = users.length;

    const activityList = document.getElementById("activity-list");
    activityList.innerHTML = "";

    const activities = [
        `Demo: ${resumes.length} resumes loaded from local storage.`,
        `Demo: ${jobs.length} job descriptions configured.`,
        `Demo: ${users.length} users available (Admin + HR).`,
        `Use the Matching tab to see scoring across resumes and jobs.`
    ];

    activities.forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        activityList.appendChild(li);
    });
}

// ---------- RESUMES ----------
function renderResumes() {
    const resumes = readJSON(STORAGE_KEYS.RESUMES, []);
    const tbody = document.getElementById("resume-table-body");
    const label = document.getElementById("resume-count-label");

    tbody.innerHTML = "";
    label.textContent = `${resumes.length} record(s)`;

    resumes.forEach((r) => {
        const tr = document.createElement("tr");
        const skillPreview = r.skills.length > 30 ? r.skills.substring(0, 30) + "..." : r.skills;

        tr.innerHTML = `
            <td>${r.name}</td>
            <td>${r.headline || "-"}</td>
            <td>${skillPreview || "-"}</td>
            <td>
                <button class="btn ghost small btn-edit-resume" data-id="${r.id}">Edit</button>
                <button class="btn ghost small btn-del-resume" data-id="${r.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleResumeFormSubmit(e) {
    e.preventDefault();

    const idField = document.getElementById("resume-id");
    const name = document.getElementById("resume-name").value.trim();
    const email = document.getElementById("resume-email").value.trim();
    const headline = document.getElementById("resume-headline").value.trim();
    const skills = document.getElementById("resume-skills").value.trim();
    const summary = document.getElementById("resume-summary").value.trim();

    if (!name) {
        showPopup("Validation", "Candidate name is required.");
        return;
    }

    let resumes = readJSON(STORAGE_KEYS.RESUMES, []);
    const existingId = idField.value ? Number(idField.value) : null;

    if (existingId) {
        resumes = resumes.map((r) =>
            r.id === existingId
                ? { ...r, name, email, headline, skills, summary }
                : r
        );
    } else {
        const newId = resumes.length ? Math.max(...resumes.map((r) => r.id)) + 1 : 1;
        resumes.push({ id: newId, name, email, headline, skills, summary });
    }

    writeJSON(STORAGE_KEYS.RESUMES, resumes);
    resetResumeForm();
    renderResumes();
    populateMatchDropdowns();
    renderMatchTable();
}

function resetResumeForm() {
    document.getElementById("resume-id").value = "";
    document.getElementById("resume-name").value = "";
    document.getElementById("resume-email").value = "";
    document.getElementById("resume-headline").value = "";
    document.getElementById("resume-skills").value = "";
    document.getElementById("resume-summary").value = "";
    document.getElementById("resume-file").value = "";
    document.getElementById("resume-form-title").textContent = "Add Resume";
    document.getElementById("resume-submit-btn").textContent = "Save Resume";
}

function handleResumeTableClick(e) {
    const editBtn = e.target.closest(".btn-edit-resume");
    const delBtn = e.target.closest(".btn-del-resume");
    if (!editBtn && !delBtn) return;

    const id = Number((editBtn || delBtn).dataset.id);
    let resumes = readJSON(STORAGE_KEYS.RESUMES, []);
    const resume = resumes.find((r) => r.id === id);

    if (editBtn && resume) {
        document.getElementById("resume-id").value = resume.id;
        document.getElementById("resume-name").value = resume.name;
        document.getElementById("resume-email").value = resume.email;
        document.getElementById("resume-headline").value = resume.headline;
        document.getElementById("resume-skills").value = resume.skills;
        document.getElementById("resume-summary").value = resume.summary;
        document.getElementById("resume-form-title").textContent = "Edit Resume";
        document.getElementById("resume-submit-btn").textContent = "Update Resume";
    }

    if (delBtn) {
        if (!confirm("Delete this resume?")) return;
        resumes = resumes.filter((r) => r.id !== id);
        writeJSON(STORAGE_KEYS.RESUMES, resumes);
        renderResumes();
        populateMatchDropdowns();
        renderMatchTable();
    }
}

function handleResumeFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = () => {
            document.getElementById("resume-summary").value = reader.result;
            showPopup("Resume imported", "Text has been copied into the Summary field. You can edit it before saving.");
        };
        reader.readAsText(file);
    } else {
        showPopup(
            "File type note",
            "In this browser demo only .txt files can be auto-read. For PDF / Word, please copy the key text into the Summary field."
        );
    }
}

// ---------- JOBS ----------
function renderJobs() {
    const jobs = readJSON(STORAGE_KEYS.JOBS, []);
    const tbody = document.getElementById("job-table-body");
    const label = document.getElementById("job-count-label");

    tbody.innerHTML = "";
    label.textContent = `${jobs.length} record(s)`;

    jobs.forEach((j) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${j.title}</td>
            <td>${j.dept || "-"}</td>
            <td>${j.location || "-"}</td>
            <td>
                <button class="btn ghost small btn-edit-job" data-id="${j.id}">Edit</button>
                <button class="btn ghost small btn-del-job" data-id="${j.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleJobFormSubmit(e) {
    e.preventDefault();

    const idField = document.getElementById("job-id");
    const title = document.getElementById("job-title").value.trim();
    const dept = document.getElementById("job-dept").value.trim();
    const location = document.getElementById("job-location").value.trim();
    const skills = document.getElementById("job-skills").value.trim();
    const description = document.getElementById("job-description").value.trim();

    if (!title) {
        showPopup("Validation", "Job title is required.");
        return;
    }

    let jobs = readJSON(STORAGE_KEYS.JOBS, []);
    const existingId = idField.value ? Number(idField.value) : null;

    if (existingId) {
        jobs = jobs.map((j) =>
            j.id === existingId
                ? { ...j, title, dept, location, skills, description }
                : j
        );
    } else {
        const newId = jobs.length ? Math.max(...jobs.map((j) => j.id)) + 1 : 1;
        jobs.push({ id: newId, title, dept, location, skills, description });
    }

    writeJSON(STORAGE_KEYS.JOBS, jobs);
    resetJobForm();
    renderJobs();
    populateMatchDropdowns();
    renderMatchTable();
}

function resetJobForm() {
    document.getElementById("job-id").value = "";
    document.getElementById("job-title").value = "";
    document.getElementById("job-dept").value = "";
    document.getElementById("job-location").value = "";
    document.getElementById("job-skills").value = "";
    document.getElementById("job-description").value = "";
    document.getElementById("job-file").value = "";
    document.getElementById("job-form-title").textContent = "Add Job Description";
    document.getElementById("job-submit-btn").textContent = "Save Job";
}

function handleJobTableClick(e) {
    const editBtn = e.target.closest(".btn-edit-job");
    const delBtn = e.target.closest(".btn-del-job");
    if (!editBtn && !delBtn) return;

    const id = Number((editBtn || delBtn).dataset.id);
    let jobs = readJSON(STORAGE_KEYS.JOBS, []);
    const job = jobs.find((j) => j.id === id);

    if (editBtn && job) {
        document.getElementById("job-id").value = job.id;
        document.getElementById("job-title").value = job.title;
        document.getElementById("job-dept").value = job.dept;
        document.getElementById("job-location").value = job.location;
        document.getElementById("job-skills").value = job.skills;
        document.getElementById("job-description").value = job.description;
        document.getElementById("job-form-title").textContent = "Edit Job Description";
        document.getElementById("job-submit-btn").textContent = "Update Job";
    }

    if (delBtn) {
        if (!confirm("Delete this job?")) return;
        jobs = jobs.filter((j) => j.id !== id);
        writeJSON(STORAGE_KEYS.JOBS, jobs);
        renderJobs();
        populateMatchDropdowns();
        renderMatchTable();
    }
}

function handleJobFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = () => {
            document.getElementById("job-description").value = reader.result;
            showPopup("JD imported", "Text has been copied into the Description field. You can edit it before saving.");
        };
        reader.readAsText(file);
    } else {
        showPopup(
            "File type note",
            "In this browser demo only .txt files can be auto-read. For PDF / Word, please copy the key text into the Description field."
        );
    }
}

// ---------- MATCHING ----------
function tokenize(text) {
    return text
        .toLowerCase()
        .split(/[^a-z0-9+]+/)
        .filter((t) => t.length > 2);
}

function computeMatchScore(resume, job) {
    const resumeText = `${resume.headline} ${resume.skills} ${resume.summary}` || "";
    const jobText = `${job.title} ${job.skills} ${job.description}` || "";

    const resumeTokens = new Set(tokenize(resumeText));
    const jobTokens = tokenize(jobText);

    if (!jobTokens.length || !resumeTokens.size) return 0;

    let matches = 0;
    jobTokens.forEach((token) => {
        if (resumeTokens.has(token)) matches++;
    });

    const score = Math.round((matches / jobTokens.length) * 100);
    return score;
}

function populateMatchDropdowns() {
    const resumes = readJSON(STORAGE_KEYS.RESUMES, []);
    const jobs = readJSON(STORAGE_KEYS.JOBS, []);

    const resumeSelect = document.getElementById("match-resume-select");
    const jobSelect = document.getElementById("match-job-select");

    resumeSelect.innerHTML = "";
    jobSelect.innerHTML = "";

    resumes.forEach((r) => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = `${r.name} – ${r.headline || "No headline"}`;
        resumeSelect.appendChild(opt);
    });

    jobs.forEach((j) => {
        const opt = document.createElement("option");
        opt.value = j.id;
        opt.textContent = `${j.title} – ${j.location || "-"}`;
        jobSelect.appendChild(opt);
    });
}

function runSingleMatch() {
    const resumes = readJSON(STORAGE_KEYS.RESUMES, []);
    const jobs = readJSON(STORAGE_KEYS.JOBS, []);

    const resumeId = Number(document.getElementById("match-resume-select").value);
    const jobId = Number(document.getElementById("match-job-select").value);

    const resume = resumes.find((r) => r.id === resumeId);
    const job = jobs.find((j) => j.id === jobId);
    const container = document.getElementById("match-result");

    if (!resume || !job) {
        container.innerHTML = `<p class="muted">Please ensure at least one resume and job exist.</p>`;
        return;
    }

    const score = computeMatchScore(resume, job);

    container.innerHTML = `
        <p><strong>Resume:</strong> ${resume.name} (${resume.headline || "-"})</p>
        <p><strong>Job:</strong> ${job.title} (${job.location || "-"})</p>
        <p><strong>Match Score:</strong> ${score}%</p>
        <p class="muted small">Score based on overlapping keywords in skills, headline and description.</p>
    `;
}

function renderMatchTable() {
    const resumes = readJSON(STORAGE_KEYS.RESUMES, []);
    const jobs = readJSON(STORAGE_KEYS.JOBS, []);
    const tbody = document.getElementById("match-table-body");

    tbody.innerHTML = "";

    const rows = [];
    resumes.forEach((r) => {
        jobs.forEach((j) => {
            const score = computeMatchScore(r, j);
            rows.push({
                resumeName: r.name,
                resumeHeadline: r.headline,
                jobTitle: j.title,
                jobLocation: j.location,
                score
            });
        });
    });

    rows
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .forEach((row) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.resumeName} (${row.resumeHeadline || "-"})</td>
                <td>${row.jobTitle} (${row.jobLocation || "-"})</td>
                <td>${row.score}%</td>
            `;
            tbody.appendChild(tr);
        });
}

// ---------- USERS ----------
function renderUsers() {
    const users = readJSON(STORAGE_KEYS.USERS, []);
    const tbody = document.getElementById("user-table-body");
    const label = document.getElementById("user-count-label");

    tbody.innerHTML = "";
    label.textContent = `${users.length} user(s)`;

    users.forEach((u) => {
        const tr = document.createElement("tr");
        const isSelf = currentUser && currentUser.id === u.id;

        tr.innerHTML = `
            <td>${u.name}</td>
            <td>${u.username}</td>
            <td>${u.role}</td>
            <td>
                <button class="btn ghost small btn-edit-user" data-id="${u.id}">Edit</button>
                <button class="btn ghost small btn-del-user" data-id="${u.id}" ${isSelf ? "disabled" : ""}>
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleUserFormSubmit(e) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "Admin") {
        showPopup("Access denied", "Only Admin can modify users.");
        return;
    }

    const idField = document.getElementById("user-id");
    const name = document.getElementById("user-name").value.trim();
    const username = document.getElementById("user-username").value.trim();
    const password = document.getElementById("user-password").value.trim();
    const role = document.getElementById("user-role").value;

    if (!name || !username || !password) {
        showPopup("Validation", "Name, username and password are required.");
        return;
    }

    let users = readJSON(STORAGE_KEYS.USERS, []);
    const existingId = idField.value ? Number(idField.value) : null;

    if (existingId) {
        users = users.map((u) =>
            u.id === existingId ? { ...u, name, username, password, role } : u
        );
    } else {
        const newId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
        users.push({ id: newId, name, username, password, role });
    }

    writeJSON(STORAGE_KEYS.USERS, users);
    resetUserForm();
    renderUsers();
}

function resetUserForm() {
    document.getElementById("user-id").value = "";
    document.getElementById("user-name").value = "";
    document.getElementById("user-username").value = "";
    document.getElementById("user-password").value = "";
    document.getElementById("user-role").value = "HR";
    document.getElementById("user-form-title").textContent = "Add User";
    document.getElementById("user-submit-btn").textContent = "Save User";
}

function handleUserTableClick(e) {
    const editBtn = e.target.closest(".btn-edit-user");
    const delBtn = e.target.closest(".btn-del-user");
    if (!editBtn && !delBtn) return;
    if (!currentUser || currentUser.role !== "Admin") {
        showPopup("Access denied", "Only Admin can manage users.");
        return;
    }

    const id = Number((editBtn || delBtn).dataset.id);
    let users = readJSON(STORAGE_KEYS.USERS, []);
    const user = users.find((u) => u.id === id);

    if (editBtn && user) {
        document.getElementById("user-id").value = user.id;
        document.getElementById("user-name").value = user.name;
        document.getElementById("user-username").value = user.username;
        document.getElementById("user-password").value = user.password;
        document.getElementById("user-role").value = user.role;
        document.getElementById("user-form-title").textContent = "Edit User";
        document.getElementById("user-submit-btn").textContent = "Update User";
    }

    if (delBtn) {
        if (currentUser && currentUser.id === id) {
            showPopup("Not allowed", "You cannot delete the currently logged-in user.");
            return;
        }
        if (!confirm("Delete this user?")) return;
        users = users.filter((u) => u.id !== id);
        writeJSON(STORAGE_KEYS.USERS, users);
        renderUsers();
    }
}

// ---------- SETTINGS / DATA RESET ----------
function resetAllData() {
    if (!confirm("This will clear demo data and reload. Continue?")) return;
    localStorage.clear();
    location.reload();
}

// ---------- POPUP ----------
function showPopup(title, message) {
    document.getElementById("popup-title").textContent = title;
    document.getElementById("popup-content").textContent = message;
    document.getElementById("popup").classList.remove("hidden");
}

// ---------- CHATBOT ----------
const BOT_FAQS = [
    {
        match: ["add resume", "resume add", "candidate"],
        answer: "Go to the Resumes tab, fill candidate details or upload a .txt resume, then click Save Resume."
    },
    {
        match: ["upload resume", "resume upload"],
        answer: "In Resumes tab, use the Upload Resume field. For .txt files, the text is auto-copied into Summary. For PDF/Word, upload and paste key text manually."
    },
    {
        match: ["job description", "add jd", "add job"],
        answer: "Open Job Descriptions tab, enter the job details or upload a .txt JD file, then click Save Job."
    },
    {
        match: ["match", "score", "matching"],
        answer: "Use the Matching tab. Select a resume and a job, click Run Match. Scores are based on overlapping keywords in skills, headline and description."
    },
    {
        match: ["user", "admin", "hr"],
        answer: "Only Admin users can manage logins in the User Management tab. HR users can add resumes, jobs and run matching."
    },
    {
        match: ["reset data", "clear data"],
        answer: "Open Settings tab and click 'Clear & Reset Demo Data'."
    }
];

function getBotReply(text) {
    const q = text.toLowerCase();
    for (const item of BOT_FAQS) {
        if (item.match.some((m) => q.includes(m))) {
            return item.answer;
        }
    }
    return "I didn't fully catch that. Try asking things like 'How to upload resume', 'How matching works', or 'How to add a job description'.";
}

function appendChatMessage(sender, text) {
    const windowEl = document.getElementById("chat-window");
    if (!windowEl) return;
    const msg = document.createElement("div");
    msg.classList.add("chat-message", sender === "bot" ? "bot" : "user");
    msg.textContent = text;
    windowEl.appendChild(msg);
    windowEl.scrollTop = windowEl.scrollHeight;
}

function handleChatSend() {
    const input = document.getElementById("chat-input");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    appendChatMessage("user", text);
    input.value = "";
    const reply = getBotReply(text);
    setTimeout(() => appendChatMessage("bot", reply), 200);
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
    seedDemoData();
    initTheme();

    // Login
    document.getElementById("login-btn").addEventListener("click", handleLogin);
    document.getElementById("password").addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleLogin();
    });

    // Logout
    document.getElementById("logout-btn").addEventListener("click", () => {
        currentUser = null;
        document.getElementById("app-screen").classList.add("hidden");
        document.getElementById("login-screen").classList.remove("hidden");
        document.getElementById("login-error").textContent = "";
        document.getElementById("password").value = "";
    });

    // Nav
    document.querySelectorAll(".nav-item").forEach((btn) => {
        btn.addEventListener("click", () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });

    // Theme toggles
    document.getElementById("top-theme-toggle").addEventListener("click", () => {
        const current = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
        applyTheme(current === "dark" ? "light" : "dark");
    });

    const themeToggleInput = document.getElementById("theme-toggle");
    if (themeToggleInput) {
        themeToggleInput.addEventListener("change", (e) => {
            applyTheme(e.target.checked ? "dark" : "light");
        });
    }

    // Popup close
    document.getElementById("popup-close").addEventListener("click", () => {
        document.getElementById("popup").classList.add("hidden");
    });

    // Resume events
    document.getElementById("resume-form").addEventListener("submit", handleResumeFormSubmit);
    document.getElementById("resume-reset-btn").addEventListener("click", resetResumeForm);
    document.getElementById("resume-table-body").addEventListener("click", handleResumeTableClick);
    const resumeFileInput = document.getElementById("resume-file");
    if (resumeFileInput) {
        resumeFileInput.addEventListener("change", handleResumeFileChange);
    }

    // Job events
    document.getElementById("job-form").addEventListener("submit", handleJobFormSubmit);
    document.getElementById("job-reset-btn").addEventListener("click", resetJobForm);
    document.getElementById("job-table-body").addEventListener("click", handleJobTableClick);
    const jobFileInput = document.getElementById("job-file");
    if (jobFileInput) {
        jobFileInput.addEventListener("change", handleJobFileChange);
    }

    // Matching
    document.getElementById("run-match-btn").addEventListener("click", runSingleMatch);

    // Users
    document.getElementById("user-form").addEventListener("submit", handleUserFormSubmit);
    document.getElementById("user-reset-btn").addEventListener("click", resetUserForm);
    document.getElementById("user-table-body").addEventListener("click", handleUserTableClick);

    // Settings
    document.getElementById("reset-data-btn").addEventListener("click", resetAllData);

    // Chatbot
    const chatSendBtn = document.getElementById("chat-send-btn");
    const chatInput = document.getElementById("chat-input");
    if (chatSendBtn) chatSendBtn.addEventListener("click", handleChatSend);
    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleChatSend();
        });
    }
});
