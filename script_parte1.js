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

async function loadHomeSubjects() {
    const data = await loadMasterData();
    const grid = document.getElementById("subjects-grid");

    grid.innerHTML = "";

    data.subjects.forEach(sub => {
        const card = document.createElement("div");
        card.className = `card subject-${sub.key}`;
        card.onclick = () => loadSubjectData(sub.key);

        card.innerHTML = `
            <div class="icon">${getSubjectIcon(sub.key)}</div>
            <h3>${sub.title}</h3>
        `;

        grid.appendChild(card);
    });
}

function getSubjectIcon(key) {
    const icons = {
        EnglishLanguage: "🇬🇧",
        Math: "🧮",
        NaturalScience: "🔬",
        SocialStudies: "🌎",
        Spanish: "🇪🇸",
        Literacy: "📚",
        STEM: "🧪",
        Art: "🎨",
        Music: "🎵",
        Drama: "🎭",
        PhysicalEducation: "🏃",
        FormacionCiudadana: "🤝",
        FormacionIntegral: "💛",
        CommunicativeSkills: "🗣️"
    };

    return icons[key] || "📘";
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

    //const html = generarHTML(subject);
    const html = generarHTMLAsignatura(subject, tests);
    openSubject(subject.title, html);
}

function generarHTMLAsignatura(subject, tests) {
    let html = "";

    // -------------------------
    // SECCIÓN DE PRUEBAS
    // -------------------------
    if (tests.length > 0) {
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

        html += `</ul><hr>`;
    }

    // -------------------------
    // SECCIÓN DE UNIDADES
    // -------------------------
    html += `<h3>📚 Unidades</h3>`;

    subject.unidades.forEach((unidad, index) => {
        html += `
            <div class="unidad">
                <button class="unidad-btn" onclick="toggleUnidad(${index})">
                    ${unidad.titulo}
                </button>

                <div id="unidad-${index}" class="unidad-content">
                    ${generarContenidoUnidad(unidad)}
                </div>
            </div>
        `;
    });

    return html;
}

function generarContenidoUnidad(unidad) {
    let html = "";

    // VIDEOS
    if (unidad.videos && unidad.videos.length > 0) {
        html += `<h4>🎬 Videos</h4>`;
        unidad.videos.forEach(v => {
            html += `
                <div class="video-item">
                    <p><strong>${v.title}</strong></p>
                    <iframe src="${v.url}" frameborder="0" allowfullscreen></iframe>
                </div>
            `;
        });
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

function toggleUnidad(index) {
    const el = document.getElementById(`unidad-${index}`);
    el.classList.toggle("open");
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
