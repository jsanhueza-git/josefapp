/* ---------------------------------------------
   CARGA DEL JSON MAESTRO
--------------------------------------------- */

let DATA = null;

async function loadMasterData() {
    if (DATA) return DATA;
    const res = await fetch("data/data.json");
    DATA = await res.json();
    return DATA;
}

/* ---------------------------------------------
   NAVEGACIÓN
--------------------------------------------- */

let lastScreen = "home";

function goHome() {
    document.getElementById("content").classList.remove("active");
    document.getElementById("home").classList.add("active");
}

/* ---------------------------------------------
   ABRIR ASIGNATURA
--------------------------------------------- */

async function loadSubjectData(subjectKey) {
    const data = await loadMasterData();

    const subject = data.subjects.find(s => s.key === subjectKey);
    if (!subject) return;

    // Pruebas filtradas desde el calendario
    subject.tests = data.calendar.filter(t => t.subject === subjectKey);

    const html = generarHTML(subject);
    openSubject(subject.title, html);
}

function openSubject(title, contentHTML) {
    lastScreen = "home";
    document.getElementById("home").classList.remove("active");
    document.getElementById("content").classList.add("active");

    document.getElementById("subject-title").innerText = title;
    document.getElementById("subject-body").innerHTML = contentHTML;

    window.scrollTo(0, 0);
}

/* ---------------------------------------------
   ABRIR CALENDARIO GENERAL
--------------------------------------------- */

async function loadCalendar() {
    const data = await loadMasterData();

    const html = generarHTML({
        title: "Calendario de Pruebas",
        description: "Evaluaciones oficiales enviadas por el colegio.",
        is_calendar: true,
        important_dates: data.calendar
    });

    openSubject("Calendario de Pruebas", html);
}

/* ---------------------------------------------
   GENERAR HTML
--------------------------------------------- */

function generarHTML(data) {
    let html = `<p>${data.description || ""}</p>`;

    /* VIDEOS */
    if (data.videos?.length) {
        html += `<h3>Videos</h3>`;
        data.videos.forEach(v => {
            html += `
                <div class="video-container">
                    <iframe src="${v.url}" frameborder="0" allowfullscreen></iframe>
                    <p>${v.title}</p>
                </div>
            `;
        });
    }

    /* JUEGOS */
    if (data.games?.length) {
        html += `<h3>Juegos</h3>`;
        data.games.forEach(g => {
            html += `
                <div class="game-container">
                    <iframe src="${g.url}" frameborder="0" allowfullscreen></iframe>
                </div>
            `;
        });
    }

    /* PRUEBAS POR ASIGNATURA */
    if (data.tests?.length && !data.is_calendar) {
        html += `<h3>Pruebas de ${data.title}</h3>`;
        html += `<div class="test-list">`;

        data.tests.forEach(t => {
            html += `
                <div class="test-card test-${t.subject}">
                    <div class="test-date">${t.date}</div>
                    <div class="test-title">${t.subject}</div>
                    <div class="test-desc">${t.description}</div>
                </div>
            `;
        });

        html += `</div>`;
    }

    /* CALENDARIO GENERAL CON FILTROS */
    if (data.is_calendar && data.important_dates?.length) {

        html += `
            <div class="filters-container">
                <div class="filter-row" id="filter-subjects"></div>
                <div class="filter-row" id="filter-months"></div>
                <div class="filter-row" id="filter-order"></div>
                <input id="filter-search" class="filter-search" placeholder="Buscar..." />
                <div id="filter-clear" class="filter-clear">Limpiar</div>
            </div>

            <div id="test-list" class="test-list"></div>
        `;

        window.currentTests = data.important_dates;

        setTimeout(renderTestFilters, 50);
    }

    if (data.extra) html += data.extra;

    return html;
}

/* ---------------------------------------------
   SISTEMA DE FILTROS DEL CALENDARIO
--------------------------------------------- */

function renderTestFilters() {
    if (!window.currentTests) return;

    const tests = window.currentTests;

    const subjects = [...new Set(tests.map(t => t.subject))];
    const months = [...new Set(tests.map(t => t.date.slice(0, 7)))];

    document.getElementById("filter-subjects").innerHTML =
        subjects.map(s => `<span class="filter-chip" data-subject="${s}">${s}</span>`).join("");

    document.getElementById("filter-months").innerHTML =
        months.map(m => `<span class="filter-chip" data-month="${m}">${m}</span>`).join("");

    document.getElementById("filter-order").innerHTML = `
        <span class="filter-chip" data-order="asc">Fecha ↑</span>
        <span class="filter-chip" data-order="desc">Fecha ↓</span>
    `;

    document.querySelectorAll(".filter-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            chip.classList.toggle("active");
            applyTestFilters();
        });
    });

    document.getElementById("filter-search").addEventListener("input", applyTestFilters);
    document.getElementById("filter-clear").addEventListener("click", clearTestFilters);

    applyTestFilters();
}

function applyTestFilters() {
    let filtered = [...window.currentTests];

    const activeSubjects = [...document.querySelectorAll("[data-subject].active")]
        .map(el => el.dataset.subject);

    if (activeSubjects.length)
        filtered = filtered.filter(t => activeSubjects.includes(t.subject));

    const activeMonths = [...document.querySelectorAll("[data-month].active")]
        .map(el => el.dataset.month);

    if (activeMonths.length)
        filtered = filtered.filter(t => activeMonths.includes(t.date.slice(0, 7)));

    const orderChip = document.querySelector("[data-order].active");
    if (orderChip) {
        const order = orderChip.dataset.order;
        filtered.sort((a, b) =>
            order === "asc"
                ? new Date(a.date) - new Date(b.date)
                : new Date(b.date) - new Date(a.date)
        );
    }

    const search = document.getElementById("filter-search").value.toLowerCase();
    if (search) {
        filtered = filtered.filter(t =>
            t.description.toLowerCase().includes(search) ||
            t.subject.toLowerCase().includes(search)
        );
    }

    renderTestCards(filtered);
}

function renderTestCards(list) {
    const container = document.getElementById("test-list");
    container.innerHTML = list.map(t => `
        <div class="test-card test-${t.subject}">
            <div class="test-date">${t.date}</div>
            <div class="test-title">${t.subject}</div>
            <div class="test-desc">${t.description}</div>
        </div>
    `).join("");
}

function clearTestFilters() {
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    document.getElementById("filter-search").value = "";
    applyTestFilters();
}