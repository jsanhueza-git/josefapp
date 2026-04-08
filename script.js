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
   HOME DINÁMICO (home_items)
--------------------------------------------- */

async function loadHomeItems() {
    const data = await loadMasterData();
    const grid = document.getElementById("subjects-grid");

    grid.innerHTML = "";

    data.home_items.forEach(item => {
        const card = document.createElement("div");
        card.className = `card subject-${item.key}`;

        // Acción según el tipo
        if (item.type === "subject") {
            card.onclick = () => loadSubjectData(item.key);
        } else if (item.type === "schedule") {
            card.onclick = () => loadHorario();
        } else if (item.type === "calendar") {
            card.onclick = () => loadCalendar();
        }

        card.innerHTML = `
            <div class="icon">${item.icon}</div>
            <h3>${item.title}</h3>
        `;

        grid.appendChild(card);
    });
}

/* ---------------------------------------------
   ABRIR ASIGNATURA
--------------------------------------------- */

async function loadSubjectData(subjectKey) {
    const data = await loadMasterData();

    const subject = data.subjects.find(s => s.key === subjectKey);
    if (!subject) return;

    // Pruebas filtradas desde el calendario
    const tests = data.calendar.filter(t => t.subject === subjectKey);

    const html = generarHTMLAsignatura(subject, tests);
    openSubject(subject.title, html);
}

function generarHTMLAsignatura(subject, tests) {
    let html = "";

    // LINK A CLASSROOM (si existe)
    if (subject.classroom) {
        html += `
        <div class="section-block">
            <h3>📘 Classroom</h3>
            <a href="${subject.classroom}" target="_blank" class="classroom-link">
                Ir a Classroom
            </a>
        </div>
        `;
    }

    /* -------------------------
       SECCIÓN DE PRUEBAS
    ------------------------- */
    if (tests.length > 0) {
        html += `<div class="section-block">`;
        html += `<h3>📌 Pruebas</h3>`;
        html += `<ul class="test-list">`;

        tests.forEach(t => {
            html += `
                <li>
                    <strong>${t.date}</strong><br>
                    ${t.description}
                </li>
            `;
        });

        html += `</ul><hr></div>`;
    }

    /* -------------------------
       SECCIÓN DE UNIDADES
    ------------------------- */
    html += `<div class="section-block">
    <h3>📚 Unidades</h3>`;

    subject.unidades.forEach((unidad, index) => {
        const uid = `${subject.key}-${index}`;

        html += `
            <div class="unidad">
                <button class="unidad-btn" onclick="toggleUnidad('${uid}')">
                    ${unidad.titulo}
                </button>

                <div id="unidad-${uid}" class="unidad-content">
                    ${generarContenidoUnidad(unidad)}
                </div>
            </div>
        `;

    });
    html += `</div>`;
    return html;
}

function generarContenidoUnidad(unidad) {
    let html = "";

  // VIDEOS
    if (unidad.videos && unidad.videos.length > 0) {
        html += `<div class="section-block">`;
        html += `<h4>🎬 Videos</h4>`;
        unidad.videos.forEach(v => {
            const videoID = extractYouTubeID(v.url);
            html += `
                <div class="video-item">
                    <p><strong>${v.title}</strong></p>

                    <div class="video-thumb" onclick="openVideoModal('${v.url}')">
                        <img src="https://img.youtube.com/vi/${videoID}/0.jpg" />
                        <div class="play-button">▶</div>
                    </div>
                </div>
            `;
    });
    html += `</div>`;
}


    // JUEGOS
    if (unidad.games && unidad.games.length > 0) {
        html += `<h4>🎮 Juegos</h4>`;
        unidad.games.forEach(g => {
            html += `
                <div class="game-item">
                    <p><strong>${g.title}</strong></p>
                    <iframe src="${g.url}" frameborder="0"></iframe>
                </div>
            `;
        });
    }

    // EXTRA
    if (unidad.extra) {
        html += `<h4>📘 Material Extra</h4>`;
        html += unidad.extra;
    }

    return html;
}

function toggleUnidad(uid) {
    const el = document.getElementById(`unidad-${uid}`);
    el.classList.toggle("open");
}

function openSubject(title, contentHTML) {
    document.getElementById("home").classList.remove("active");
    document.getElementById("content").classList.add("active");

    document.getElementById("subject-title").innerText = title;
    document.getElementById("subject-body").innerHTML = contentHTML;

    window.scrollTo(0, 0);
}

/* ---------------------------------------------
   CALENDARIO GENERAL
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

function generarHTML(data) {
    let html = `<p>${data.description || ""}</p>`;

    /* Selector de vista SOLO para el calendario general */
    if (data.is_calendar) {
        html += `
            <div class="calendar-view-switch">
                <button onclick="loadCalendar()">📋 Lista</button>
                <button onclick="loadMonthlyCalendar()">📅 Calendario</button>
            </div>
        `;
    }

    /* PRUEBAS POR ASIGNATURA (solo si NO es calendario) */
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

    /* CALENDARIO GENERAL (vista clásica con filtros) */
    if (data.is_calendar && data.important_dates?.length) {

        html += `
            <div class="filters-container">
                <div class="filter-row" id="filter-subjects"></div>
                <div class="filter-row" id="filter-months"></div>
                <div class="filter-row">
                    <span class="filter-chip" id="filter-order-toggle" data-order="asc">Fecha ↕</span>
                </div>
                <input id="filter-search" class="filter-search" placeholder="Buscar..." />
                <div id="filter-clear" class="filter-clear">Limpiar</div>
            </div>
        `;

        window.currentTests = data.important_dates;

        setTimeout(renderTestFilters, 50);

        /* SOLO si NO estamos en modo "solo filtros", dibujar la lista clásica */
        if (!data.only_filters) {
            html += `<div id="test-list" class="test-list"></div>`;
        }
    }

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

    const orderChip = document.getElementById("filter-order-toggle");

    orderChip.addEventListener("click", () => {
        const current = orderChip.dataset.order;
        const next = current === "asc" ? "desc" : "asc";
        orderChip.dataset.order = next;
        orderChip.textContent = next === "asc" ? "Fecha ↑" : "Fecha ↓";
        orderChip.classList.add("active");
        applyTestFilters();
    });

    document.querySelectorAll(".filter-chip").forEach(chip => {
        if (chip.id !== "filter-order-toggle") {
            chip.addEventListener("click", () => {
                chip.classList.toggle("active");
                applyTestFilters();
            });
        }
    });

    document.getElementById("filter-search").addEventListener("input", applyTestFilters);
    document.getElementById("filter-clear").addEventListener("click", clearTestFilters);

    applyTestFilters();
    window.filteredTests = filtered; // ← lista filtrada actual

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

    const orderChip = document.getElementById("filter-order-toggle");
    const order = orderChip.dataset.order;

    filtered.sort((a, b) =>
        order === "asc"
            ? new Date(a.date) - new Date(b.date)
            : new Date(b.date) - new Date(a.date)
    );

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

/* ---------------------------------------------
   CARGAR HORARIO
--------------------------------------------- */

function loadHorario() {
    fetch("horario.html")
        .then(res => res.text())
        .then(html => {
            document.getElementById("home").classList.remove("active");
            document.getElementById("content").classList.add("active");

            document.getElementById("subject-title").innerText = "Horario de Clases";
            document.getElementById("subject-body").innerHTML = html;
        });
}

/* ---------------------------------------------
   INICIO DE LA APP
--------------------------------------------- */

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}

function goHome() {
    document.getElementById("content").classList.remove("active");
    document.getElementById("home").classList.add("active");
    window.scrollTo(0, 0);
}



function extractYouTubeID(url) {
    return url.split("/embed/")[1];
}

function openVideoModal(url) {
    const modal = document.getElementById("video-modal");
    const iframe = document.getElementById("modal-video");
    iframe.src = url;
    modal.style.display = "flex";
}

function closeVideoModal() {
    const modal = document.getElementById("video-modal");
    const iframe = document.getElementById("modal-video");
    iframe.src = "";
    modal.style.display = "none";
}

function renderMonthlyCalendar(tests, year, month) {
    const date = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = (date.getDay() + 6) % 7; // Ajustar para que lunes sea 0

    let html = `
        <div class="calendar-grid">
            <div class="cal-header">Lunes</div>
            <div class="cal-header">Martes</div>
            <div class="cal-header">Miércoles</div>
            <div class="cal-header">Jueves</div>
            <div class="cal-header">Viernes</div>
        </div>
        <div class="calendar-grid">
    `;

    // Espacios antes del primer día
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="cal-day empty"></div>`;
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayTests = tests.filter(t => t.date === dayStr);

        html += `<div class="cal-day" onclick="openDayDetail('${dayStr}')">`;
        html += `<div class="cal-date">${day}</div>`;

        dayTests.forEach(t => {
            html += `
                <div class="cal-test-card test-${t.subject}">
                    <div><strong>${t.subject}</strong></div>
                    <div>${t.description}</div>
                </div>
            `;
        });


        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

function openDayDetail(date) {
    const tests = window.currentTests.filter(t => t.date === date);

    let html = `<h3>Pruebas del ${date}</h3>`;
    tests.forEach(t => {
        html += `
            <div class="cal-chip test-${t.subject}">
                <span class="cal-chip-icon">📘</span>
                <strong>${t.subject}</strong><br>
                ${t.description}
            </div>
        `;
    });

    document.getElementById("modal-content").innerHTML = html;
    document.getElementById("modal").style.display = "flex";
}

async function loadMonthlyCalendar() {
    const data = await loadMasterData();

    const tests = (window.filteredTests && window.filteredTests.length)
        ? window.filteredTests
        : data.calendar;

    if (!tests.length) {
        openSubject("Calendario de Pruebas", "<p>No hay pruebas para mostrar.</p>");
        return;
    }

    const [year, month] = tests[0].date.split("-");

    // 1) Generar SOLO los filtros
    const filtrosHTML = generarHTML({
        title: "Calendario de Pruebas",
        description: "Evaluaciones oficiales enviadas por el colegio.",
        is_calendar: true,
        important_dates: tests,
        only_filters: true
    });

    // 2) Generar el calendario mensual
    const calendarioHTML = renderMonthlyCalendar(
        tests,
        parseInt(year),
        parseInt(month)
    );

    // 3) Mostrar SOLO filtros + calendario
    openSubject("Calendario de Pruebas", filtrosHTML + calendarioHTML);
}





loadHomeItems();