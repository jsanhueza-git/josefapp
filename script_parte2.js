
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
                <div class="filter-row">
                    <span class="filter-chip" id="filter-order-toggle" data-order="asc">Fecha ↕</span>
                </div>
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

    // Chips de asignaturas
    document.getElementById("filter-subjects").innerHTML =
        subjects.map(s => `<span class="filter-chip" data-subject="${s}">${s}</span>`).join("");

    // Chips de meses
    document.getElementById("filter-months").innerHTML =
        months.map(m => `<span class="filter-chip" data-month="${m}">${m}</span>`).join("");

    // BOTÓN DE ORDENAR (solo uno)
    const orderChip = document.getElementById("filter-order-toggle");

    orderChip.addEventListener("click", () => {
        const current = orderChip.dataset.order;

        // Alternar orden
        const next = current === "asc" ? "desc" : "asc";
        orderChip.dataset.order = next;

        // Cambiar flecha visual
        orderChip.textContent = next === "asc" ? "Fecha ↑" : "Fecha ↓";

        orderChip.classList.add("active");
        applyTestFilters();
    });

    // Activar chips de filtros (EXCLUYENDO el botón de ordenar)
    document.querySelectorAll(".filter-chip").forEach(chip => {
        if (chip.id !== "filter-order-toggle") {
            chip.addEventListener("click", () => {
                chip.classList.toggle("active");
                applyTestFilters();
            });
        }
    });

    // Buscador
    document.getElementById("filter-search").addEventListener("input", applyTestFilters);

    // Botón limpiar
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

    // ORDENAR SEGÚN EL BOTÓN
    const orderChip = document.getElementById("filter-order-toggle");
    const order = orderChip.dataset.order;

    filtered.sort((a, b) =>
        order === "asc"
            ? new Date(a.date) - new Date(b.date)
            : new Date(b.date) - new Date(a.date)
    );

    // BUSCADOR
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


if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}

// Cargar asignaturas dinámicamente al iniciar
loadHomeSubjects();
