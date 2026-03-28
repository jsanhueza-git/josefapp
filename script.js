
/* ---------------------------------------------
   CONTROL DE NAVEGACIÓN
--------------------------------------------- */

let lastScreen = "home"; // recuerda desde dónde vienes

function goHome() {
    document.getElementById("content").classList.remove("active");

    if (lastScreen === "horario") {
        loadHorario(); // volver al horario si venías desde ahí
    } else {
        document.getElementById("home").classList.add("active");
    }
}

/* ---------------------------------------------
   ABRIR CONTENIDO GENERAL
--------------------------------------------- */

function openSubject(title, contentHTML) {
    lastScreen = document.querySelector(".screen.active").id;

    document.getElementById("home").classList.remove("active");
    document.getElementById("content").classList.add("active");

    document.getElementById("subject-title").innerText = title;
    document.getElementById("subject-body").innerHTML = contentHTML;

    window.scrollTo(0, 0);
}

/* ---------------------------------------------
   CARGA DE ASIGNATURAS DESDE JSON
--------------------------------------------- */

function loadSubjectData(subjectKey) {
    fetch(`data/${subjectKey}.json`)
        .then(r => r.json())
        .then(async data => {

            // Cargar pruebas desde CalendarioPruebas.json
            const tests = await loadSubjectTests(subjectKey);

            // Insertarlas en el JSON de la asignatura
            data.subject_tests = tests;

            const html = generarHTML(data);
            openSubject(data.title, html);
        })
        .catch(err => {
            openSubject("Error", "<p>No se pudo cargar el contenido.</p>");
        });
}

/* ---------------------------------------------
   GENERADOR DE HTML PARA ASIGNATURAS
--------------------------------------------- */
function generarHTML(data) {
    let html = `<p>${data.description || ""}</p>`;

    /* PRUEBAS DE LA ASIGNATURA */
    if (data.subject_tests?.length) {

        html += `<h3>Pruebas de ${data.title}</h3>`;
        html += `<div class="test-list">`;

        data.subject_tests.forEach(t => {
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

    /* --------------------------------------------------
       CALENDARIO DE PRUEBAS (NUEVO SISTEMA)
    -------------------------------------------------- */
    if (data.important_dates?.length) {

        html += `<h3>${data.title}</h3>`;

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

        // Guardamos los datos para los filtros
        window.currentTests = data.important_dates;

        // ACTIVAMOS LOS FILTROS
        setTimeout(() => {
            renderTestFilters();
        }, 50);
    }

    /* EXTRA HTML */
    if (data.extra) {
        html += data.extra;
    }

    return html;
}

/* ---------------------------------------------
   CALENDARIO MENSUAL (UTILIDADES)
--------------------------------------------- */

function agruparPorMes(events) {
    const grupos = {};

    events.forEach(e => {
        const [year, month] = e.date.split("-");
        const key = `${year}-${month}`;

        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(e);
    });

    return grupos;
}

function generarCalendarioVisual(month, year, events) {
    const date = new Date(year, month - 1, 1);
    const firstDay = date.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    let startCol = firstDay === 0 ? 6 : firstDay - 1;
    if (startCol > 4) startCol = 4;

    let html = `
        <h3>${date.toLocaleString('es-ES', { month: 'long' })} ${year}</h3>
        <table class="calendar-table">
            <tr>
                <th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th>
            </tr>
            <tr>
    `;

    for (let i = 0; i < startCol; i++) html += "<td></td>";

    let col = startCol;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const event = events.find(e => e.date === dateStr);

        html += `<td class="calendar-day"><strong>${day}</strong>`;
        if (event) html += `<div class="calendar-event">${event.description}</div>`;
        html += `</td>`;

        col++;
        if (col === 5) {
            html += "</tr><tr>";
            col = 0;
        }
    }

    while (col > 0 && col < 5) {
        html += "<td></td>";
        col++;
    }

    html += "</tr></table>";
    return html;
}

/* ---------------------------------------------
   ABRIR ASIGNATURAS DESDE EL HORARIO
--------------------------------------------- */

function openFromSchedule(subjectName) {
    const subjects = {
        "MUSIC": "Music",
        "ART": "Art",
        "F. INTEGRAL": "FormacionIntegral",
        "F. CIUDADANA": "FormacionCiudadana",
        "ENG. LANGUAGE": "EnglishLanguage",
        "SPANISH": "Spanish",
        "MATH": "Math",
        "LITERACY": "Literacy",
        "DRAMA": "Drama",
        "PHYSICAL ED.": "PhysicalEducation",
        "SOCIAL STUDIES": "SocialStudies",
        "NATURAL SCIENCE": "NaturalScience",
        "STEM": "STEM",
        "COM. SKILLS": "CommunicativeSkills"
    };

    const target = subjects[subjectName];
    if (!target) return;

    lastScreen = "horario"; // ← IMPORTANTE
    loadSubjectData(target);
}

/* ---------------------------------------------
   CARGAR HORARIO DESDE ARCHIVO EXTERNO
--------------------------------------------- */

function loadHorario() {
    lastScreen = "home"; // si vuelves desde horario → home

    fetch("horario.html")
        .then(res => res.text())
        .then(html => {
            document.getElementById("home").classList.remove("active");
            document.getElementById("content").classList.add("active");

            document.getElementById("subject-title").innerText = "Horario de Clases";
            document.getElementById("subject-body").innerHTML = html;
        });
}

/* --------------------------------------------------
   SISTEMA DE FILTROS PARA PRUEBAS
-------------------------------------------------- */

function renderTestFilters() {
    if (!window.currentTests) return;

    const tests = window.currentTests;

    // Obtener asignaturas únicas
    const subjects = [...new Set(tests.map(t => t.subject))];

    // Obtener meses únicos
    const months = [...new Set(tests.map(t => t.date.slice(0, 7)))];

    // Render chips de asignaturas
    document.getElementById("filter-subjects").innerHTML =
        subjects.map(s => `<span class="filter-chip" data-subject="${s}">${s}</span>`).join("");

    // Render chips de meses
    document.getElementById("filter-months").innerHTML =
        months.map(m => `<span class="filter-chip" data-month="${m}">${m}</span>`).join("");

    // Orden
    document.getElementById("filter-order").innerHTML = `
        <span class="filter-chip" data-order="asc">Fecha ↑</span>
        <span class="filter-chip" data-order="desc">Fecha ↓</span>
    `;

    // Eventos
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

    // Filtro por asignatura
    const activeSubjects = [...document.querySelectorAll("[data-subject].active")]
        .map(el => el.dataset.subject);

    if (activeSubjects.length)
        filtered = filtered.filter(t => activeSubjects.includes(t.subject));

    // Filtro por mes
    const activeMonths = [...document.querySelectorAll("[data-month].active")]
        .map(el => el.dataset.month);

    if (activeMonths.length)
        filtered = filtered.filter(t => activeMonths.includes(t.date.slice(0, 7)));

    // Orden
    const orderChip = document.querySelector("[data-order].active");
    if (orderChip) {
        const order = orderChip.dataset.order;
        filtered.sort((a, b) =>
            order === "asc"
                ? new Date(a.date) - new Date(b.date)
                : new Date(b.date) - new Date(a.date)
        );
    }

    // Búsqueda
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

// Ejecutar filtros cuando se abra la sección
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(renderTestFilters, 300);
});

async function loadSubjectTests(subjectName) {
    try {
        const res = await fetch("data/CalendarioPruebas.json");
        const calendar = await res.json();

        if (!calendar.important_dates) return [];

        return calendar.important_dates.filter(
            t => t.subject === subjectName
        );

    } catch (e) {
        console.error("Error cargando pruebas:", e);
        return [];
    }
}

