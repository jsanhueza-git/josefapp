/* ---------------------------------------------
   UTILIDADES
--------------------------------------------- */

function formatFecha(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date  = new Date(y, m - 1, d);
    const diasES  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const mesesES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const diasEN  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const mesesEN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const es = `${diasES[date.getDay()]} ${d} de ${mesesES[m - 1]}`;
    const en = `${diasEN[date.getDay()]} ${mesesEN[m - 1]} ${d}`;
    return `${es}<br><small>${en}</small>`;
}

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

let HORARIO_DATA = null;

async function loadHorarioData() {
    if (HORARIO_DATA) return HORARIO_DATA;
    const res = await fetch("data/horario.json");
    HORARIO_DATA = await res.json();
    return HORARIO_DATA;
}

const DARK_TEXT_SUBJECTS = new Set([
    'Art','PhysicalEducation','FormacionIntegral','Literacy',
    'SocialStudies','STEM','FormacionCiudadana','Drama'
]);

function subjectNeedsDarkText(subject) {
    return DARK_TEXT_SUBJECTS.has(subject);
}

const SUBJECT_SHORT_LABELS = {
    Art:'Art', CommunicativeSkills:'C.Skills', Drama:'Drama',
    PhysicalEducation:'Ed.Física', EnglishLanguage:'English',
    FormacionCiudadana:'F.Ciudadana', FormacionIntegral:'F.Integral',
    Literacy:'Literacy', Math:'Math', Music:'Music',
    NaturalScience:'Ciencias', SocialStudies:'Historia',
    Spanish:'Spanish', STEM:'STEM'
};

function subjectShortLabel(subject) {
    return SUBJECT_SHORT_LABELS[subject] || subject;
}

const WEEK_TIME_SLOTS = [
    {t:'08:15'},{t:'08:55'},{B:'Recreo'},
    {t:'09:50'},{t:'10:30'},{B:'Recreo'},
    {t:'11:30'},{B:'Almuerzo'},
    {t:'13:00'},{t:'13:45'},{B:'Recreo'},
    {t:'14:40'},{t:'15:25'}
];

function showTestDetail(dateStr, subject) {
    const tests = (DATA ? DATA.calendar : [])
        .filter(t => t.date === dateStr && t.subject === subject);
    if (!tests.length) return;

    let html = `<h3 style="margin:0 0 12px;font-size:1rem;color:#2a4d69">${formatFecha(dateStr)}</h3>`;
    tests.forEach(t => {
        html += `<div class="cal-chip test-${t.subject}" style="white-space:normal;padding:10px 12px;border-radius:10px;margin-bottom:8px;display:block">
            <strong>${t.subject}</strong><br>
            <span style="font-weight:normal">${t.description}</span>
        </div>`;
    });
    html += `<p class="mcal-close-hint">Toca fuera para cerrar</p>`;

    document.getElementById("modal-content").innerHTML = html;
    document.getElementById("modal").style.display = "flex";
}

/* ---------------------------------------------
   HOME DINÁMICO (home_items)
--------------------------------------------- */

async function loadHomeItems() {
    const data = await loadMasterData();
    const grid = document.getElementById("subjects-grid");

    grid.innerHTML = "";

    // Asignaturas con prueba en los próximos 7 días
    const today = new Date();
    const todayStr   = today.toISOString().slice(0, 10);
    const in7days    = new Date(today);
    in7days.setDate(today.getDate() + 7);
    const in7daysStr = in7days.toISOString().slice(0, 10);

    const thisWeek = new Set(
        data.calendar
            .filter(t => t.subject && t.date >= todayStr && t.date <= in7daysStr)
            .map(t => t.subject)
    );

    data.home_items.forEach(item => {
        const card = document.createElement("div");
        card.className = `card subject-${item.key}`;

        if (item.type === "subject") {
            card.onclick = () => loadSubjectData(item.key);
        } else if (item.type === "schedule") {
            card.onclick = () => loadHorario();
        } else if (item.type === "calendar") {
            card.onclick = () => loadCalendar();
        } else if (item.type === "monthly-calendar") {
            card.onclick = () => loadMonthlyView();
        }

        const badge = thisWeek.has(item.key)
            ? `<span class="week-badge">📝 Esta semana</span>`
            : "";

        card.innerHTML = `
            ${badge}
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

    // LINK AL LIBRO (si existe)
    if (subject.libro) {
        html += `
        <div class="section-block libro-block">
            <a href="${subject.libro}" target="_blank" class="libro-link">
                📚 Libro de clases
            </a>
        </div>
        `;
    }

    /* -------------------------
       SECCIÓN DE PRUEBAS
    ------------------------- */
    if (tests.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const upcoming = tests.filter(t => t.date >= today);
        const past     = tests.filter(t => t.date <  today);

        const liHTML = items => items.map(t => `
            <li>
                <strong>${formatFecha(t.date)}</strong><br>
                ${t.description}
            </li>
        `).join("");

        html += `<div class="section-block"><h3>📌 Pruebas</h3><ul class="test-list">`;

        if (upcoming.length) {
            html += liHTML(upcoming);
        } else {
            html += `<li style="color:#888;font-style:italic">Sin pruebas próximas.</li>`;
        }

        if (past.length) {
            html += `</ul>
                <details class="past-events">
                    <summary>Anteriores (${past.length})</summary>
                    <ul class="test-list">${liHTML(past.slice().reverse())}</ul>
                </details>
            <hr></div>`;
        } else {
            html += `</ul><hr></div>`;
        }
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
                <a href="${g.url}" target="_blank" rel="noopener noreferrer" class="game-link">
                    👉 Abrir juego
                </a>
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
    window.currentView = "list";

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
                    <div class="test-date">${formatFecha(t.date)}</div>
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

        const filtered = applyTestFilters();
        window.filteredTests = filtered;

        if (window.currentView === "calendar") loadMonthlyCalendar();
    });

    document.querySelectorAll(".filter-chip").forEach(chip => {
        if (chip.id !== "filter-order-toggle") {
            chip.addEventListener("click", () => {

                // 🔥 GUARDAR MES SELECCIONADO
                if (chip.dataset.month) {
                    window.selectedMonth = chip.dataset.month;
                }

                chip.classList.toggle("active");

                // 🔥 APLICAR FILTROS Y GUARDAR RESULTADO
                const filtered = applyTestFilters();
                window.filteredTests = filtered;

                // 🔥 SI ESTOY EN CALENDARIO → ACTUALIZAR CALENDARIO
                if (window.currentView === "calendar") {
                    loadMonthlyCalendar();
                }
            });
        }
    });

    document.getElementById("filter-search").addEventListener("input", () => {
        const filtered = applyTestFilters();
        window.filteredTests = filtered;

        if (window.currentView === "calendar") loadMonthlyCalendar();
    });

    document.getElementById("filter-clear").addEventListener("click", () => {
        clearTestFilters();
        const filtered = applyTestFilters();
        window.filteredTests = filtered;

        if (window.currentView === "calendar") loadMonthlyCalendar();
    });

    // Ejecutar filtros al cargar
    const filtered = applyTestFilters();
    window.filteredTests = filtered;

    if (window.currentView === "calendar") loadMonthlyCalendar();
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
    return filtered;
}

function renderTestCards(list) {
    const container = document.getElementById("test-list");
    const today = new Date().toISOString().slice(0, 10);

    const upcoming = list.filter(t => t.date >= today);
    const past     = list.filter(t => t.date <  today);

    const cardHTML = items => items.map(t => `
        <div class="test-card test-${t.subject || ''}">
            <div class="test-date">${formatFecha(t.date)}</div>
            <div class="test-title">${t.subject || t.title || ''}</div>
            <div class="test-desc">${t.description || ''}</div>
        </div>
    `).join("");

    let html = upcoming.length
        ? cardHTML(upcoming)
        : `<p class="no-upcoming">No hay evaluaciones próximas.</p>`;

    if (past.length) {
        html += `
            <details class="past-events">
                <summary>Anteriores (${past.length})</summary>
                ${cardHTML(past.slice().reverse())}
            </details>
        `;
    }

    container.innerHTML = html;
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

    let html = `<h3>Pruebas del ${formatFecha(date)}</h3>`;
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
    window.currentView = "calendar";

    const data = await loadMasterData();

    // 🔥 USAR FILTROS SI EXISTEN
    const tests = (window.filteredTests && window.filteredTests.length)
        ? window.filteredTests
        : data.calendar;

    if (!tests.length) {
        openSubject("Calendario de Pruebas", "<p>No hay pruebas para mostrar.</p>");
        return;
    }

    // 🔥 DETERMINAR MES A MOSTRAR
    let year, month;

    if (window.selectedMonth) {
        [year, month] = window.selectedMonth.split("-");
    } else {
        [year, month] = tests[0].date.split("-");
    }

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




/* ---------------------------------------------
   CALENDARIO MENSUAL — utilidades
--------------------------------------------- */

function addDays(dateStr, n) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + n);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function getMondayOfWeek(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dow = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - dow);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function mcalViewBar(activeView, anchorDate) {
    const [y, m] = anchorDate.split("-");
    const monday = getMondayOfWeek(anchorDate);
    return `
        <div class="mcal-view-bar">
            <button class="mcal-vbtn${activeView==='month'?' active':''}" onclick="loadMonthlyView(${y},${parseInt(m)})">Mes</button>
            <button class="mcal-vbtn${activeView==='week'?' active':''}" onclick="loadWeekView('${monday}')">Semana</button>
            <button class="mcal-vbtn${activeView==='day'?' active':''}" onclick="loadDayView('${anchorDate}')">Día</button>
        </div>
    `;
}

/* ---------------------------------------------
   VISTA MES
--------------------------------------------- */

async function loadMonthlyView(year, month) {
    const data = await loadMasterData();
    const horario = await loadHorarioData();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (year === undefined || month === undefined) {
        year = today.getFullYear();
        month = today.getMonth() + 1;
    }
    year = parseInt(year);
    month = parseInt(month);

    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio",
                   "Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const prevY = month === 1 ? year - 1 : year;
    const prevM = month === 1 ? 12 : month - 1;
    const nextY = month === 12 ? year + 1 : year;
    const nextM = month === 12 ? 1 : month + 1;

    const firstDate   = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay    = (firstDate.getDay() + 6) % 7;

    const todayInMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const anchorDate = todayInMonth ? todayStr : `${year}-${String(month).padStart(2,"0")}-01`;

    let html = mcalViewBar('month', anchorDate);
    html += `
        <div class="mcal-wrapper">
            <div class="mcal-nav">
                <button class="mcal-nav-btn" onclick="loadMonthlyView(${prevY},${prevM})">◀</button>
                <span class="mcal-nav-title">${meses[month - 1]} ${year}</span>
                <button class="mcal-nav-btn" onclick="loadMonthlyView(${nextY},${nextM})">▶</button>
            </div>
            <div class="mcal-grid">
                <div class="mcal-header">Lun</div>
                <div class="mcal-header">Mar</div>
                <div class="mcal-header">Mié</div>
                <div class="mcal-header">Jue</div>
                <div class="mcal-header">Vie</div>
                <div class="mcal-header">Sáb</div>
                <div class="mcal-header">Dom</div>
    `;

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="mcal-cell mcal-empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const dayTests = data.calendar.filter(t => t.date === dayStr);
        const dow = (new Date(year, month - 1, day).getDay() + 6) % 7;

        const classes = [
            "mcal-cell",
            dow >= 5            ? "mcal-weekend"  : "",
            dayStr === todayStr ? "mcal-today"    : "",
            dayTests.length     ? "mcal-has-tests" : ""
        ].filter(Boolean).join(" ");

        html += `<div class="${classes}" onclick="loadDayView('${dayStr}')">`;
        html += `<div class="mcal-num">${day}</div>`;
        dayTests.forEach(t => {
            html += `<div class="mcal-chip mcal-${t.subject || ''}">${t.subject || t.title || ""}</div>`;
        });
        if (dow < 5) {
            const diaKey = ["Lunes","Martes","Miércoles","Jueves","Viernes"][dow];
            const subjects = [...new Set((horario[diaKey] || []).map(s => s.subject))];
            if (subjects.length) {
                html += `<div class="mcal-dot-row">`;
                subjects.forEach(s => {
                    const isTest = dayTests.some(t => t.subject === s);
                    html += `<span class="mcal-dot mcal-dot-${s}${isTest ? ' mcal-dot-test' : ''}"></span>`;
                });
                html += `</div>`;
            }
        }
        html += `</div>`;
    }

    html += `</div></div>`;
    openSubject("Calendario", html);
}

/* ---------------------------------------------
   VISTA SEMANA (Lun–Vie)
--------------------------------------------- */

async function loadWeekView(mondayStr) {
    const data = await loadMasterData();
    const horario = await loadHorarioData();
    const todayStr = new Date().toISOString().slice(0, 10);

    const days = Array.from({length: 5}, (_, i) => addDays(mondayStr, i));
    const prevMonday = addDays(mondayStr, -7);
    const nextMonday = addDays(mondayStr, 7);

    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const [y1, m1, d1] = mondayStr.split("-").map(Number);
    const [y2, m2, d2] = days[4].split("-").map(Number);
    const rangeLabel = (m1 === m2)
        ? `${d1}–${d2} ${meses[m1-1]} ${y1}`
        : `${d1} ${meses[m1-1]} – ${d2} ${meses[m2-1]} ${y1}`;

    const diasCortos = ["Lun","Mar","Mié","Jue","Vie"];
    const diasHorario = ["Lunes","Martes","Miércoles","Jueves","Viernes"];

    const slotsByDay = diasHorario.map(d =>
        Object.fromEntries((horario[d] || []).map(s => [s.start, s.subject]))
    );

    let html = mcalViewBar('week', mondayStr);
    html += `
        <div class="mcal-wrapper">
            <div class="mcal-nav">
                <button class="mcal-nav-btn" onclick="loadWeekView('${prevMonday}')">◀</button>
                <span class="mcal-nav-title">${rangeLabel}</span>
                <button class="mcal-nav-btn" onclick="loadWeekView('${nextMonday}')">▶</button>
            </div>
            <div class="week-tgrid-wrap"><table class="week-tgrid">
                <thead><tr><th class="wtg-time-col"></th>
    `;

    days.forEach((dayStr, i) => {
        const [,, dd] = dayStr.split("-").map(Number);
        const isToday = dayStr === todayStr;
        html += `<th class="${isToday ? 'wtg-today-hdr' : ''}" onclick="loadDayView('${dayStr}')">
            <span class="wtg-day-name">${diasCortos[i]}</span>
            <span class="wtg-day-num">${dd}</span>
        </th>`;
    });

    html += `</tr></thead><tbody>`;

    WEEK_TIME_SLOTS.forEach(slot => {
        if (slot.B) {
            html += `<tr class="wtg-break-row"><td class="wtg-time-cell"></td><td colspan="5">${slot.B}</td></tr>`;
            return;
        }
        html += `<tr><td class="wtg-time-cell">${slot.t}</td>`;
        days.forEach((dayStr, i) => {
            const subj = slotsByDay[i][slot.t];
            if (subj) {
                const hasTest = data.calendar.some(t => t.date === dayStr && t.subject === subj);
                const fg = subjectNeedsDarkText(subj) ? '#222' : '#fff';
                html += `<td class="wtg-class-cell${hasTest ? ' wtg-has-test' : ''}"
                    style="background:var(--color-${subj});color:${fg}"
                    onclick="loadDayView('${dayStr}')">
                    <span class="wtg-class-label">${subjectShortLabel(subj)}</span>
                    ${hasTest ? `<span class="wtg-test-badge" onclick="event.stopPropagation();showTestDetail('${dayStr}','${subj}')">📝</span>` : ''}
                </td>`;
            } else {
                html += `<td class="wtg-empty-cell" onclick="loadDayView('${dayStr}')"></td>`;
            }
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div></div>`;
    openSubject("Calendario", html);
}

/* ---------------------------------------------
   VISTA DÍA
--------------------------------------------- */

async function loadDayView(dateStr) {
    const data = await loadMasterData();
    const horario = await loadHorarioData();
    const todayStr = new Date().toISOString().slice(0, 10);
    const dayTests = data.calendar.filter(t => t.date === dateStr);

    const prevDay = addDays(dateStr, -1);
    const nextDay = addDays(dateStr, 1);
    const isToday = dateStr === todayStr;

    const [dy, dm, dd] = dateStr.split("-").map(Number);
    const diasES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const diaKey = diasES[new Date(dy, dm - 1, dd).getDay()];
    const slots = horario[diaKey] || [];
    const slotMap = Object.fromEntries(slots.map(s => [s.start, s.subject]));

    const specialEvents = dayTests.filter(t => !t.subject);

    let html = mcalViewBar('day', dateStr);
    html += `
        <div class="mcal-wrapper">
            <div class="mcal-nav">
                <button class="mcal-nav-btn" onclick="loadDayView('${prevDay}')">◀</button>
                <span class="mcal-nav-title${isToday ? ' mcal-today-title' : ''}">${formatFecha(dateStr)}</span>
                <button class="mcal-nav-btn" onclick="loadDayView('${nextDay}')">▶</button>
            </div>
    `;

    specialEvents.forEach(t => {
        html += `<div class="test-card" style="margin-bottom:10px">
            <div class="test-title">${t.title || ''}</div>
            <div class="test-desc">${t.description || ''}</div>
        </div>`;
    });

    if (slots.length) {
        html += `<div class="day-timeline">`;
        WEEK_TIME_SLOTS.forEach(slot => {
            if (slot.B) {
                html += `<div class="dtl-break">${slot.B}</div>`;
                return;
            }
            const subj = slotMap[slot.t];
            if (!subj) return;
            const tests = dayTests.filter(t => t.subject === subj);
            const hasTest = tests.length > 0;
            const fg = subjectNeedsDarkText(subj) ? '#222' : '#fff';
            html += `<div class="dtl-slot${hasTest ? ' dtl-has-test' : ''}">
                <div class="dtl-time">${slot.t}</div>
                <div class="dtl-block" style="background:var(--color-${subj});color:${fg}">
                    <span class="dtl-label">${subjectShortLabel(subj)}</span>
                    ${hasTest ? `<span class="dtl-test-icon" onclick="showTestDetail('${dateStr}','${subj}')">📝 Prueba</span>` : ''}
                </div>
                ${hasTest ? `<div class="dtl-test-desc">${tests.map(t => `<div class="dtl-test-item">${t.description}</div>`).join('')}</div>` : ''}
            </div>`;
        });
        html += `</div>`;
    } else if (!specialEvents.length) {
        html += `<p class="no-upcoming">Sin actividades este día.</p>`;
    }

    html += `</div>`;
    openSubject("Calendario", html);
}

loadHomeItems();