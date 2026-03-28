/*let lastScreen = "home";

function goHome() {
    document.getElementById("content").classList.remove("active");

    if (lastScreen === "horario") {
        loadHorario();
    } else {
        document.getElementById("home").classList.add("active");
    }
}

function openSubject(title, contentHTML) {
    lastScreen = document.querySelector(".screen.active").id;

    document.getElementById("home").classList.remove("active");
    document.getElementById("content").classList.add("active");

    document.getElementById("subject-title").innerText = title;
    document.getElementById("subject-body").innerHTML = contentHTML;

    window.scrollTo(0, 0);
}

function loadSubjectData(subjectKey) {
    fetch(`data/${subjectKey}.json`)
        .then(r => r.json())
        .then(data => {
            const html = generarHTML(data);
            openSubject(data.title, html);
        })
        .catch(err => {
            openSubject("Error", "<p>No se pudo cargar el contenido.</p>");
        });
}

function generarHTML(data) {
    let html = `<p>${data.description || ""}</p>`;

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
        //return html;
    }

    if (data.games?.length) {
        html += `<h3>Juegos</h3>`;
        data.games.forEach(g => {
            html += `
                <div class="game-container">
                    <iframe src="${g.url}" frameborder="0" allowfullscreen style="width:100%; height:400px;"></iframe>
                </div>
            `;
        });
        //return html;
    }


    if (data.important_dates?.length) {
        html += `<h3>${data.title}</h3><ul>`;

        data.important_dates.forEach(d => {
        html += `<li><strong>${d.date}</strong>: ${d.description}</li>`;
    });

    html += "</ul>";

    //return html;
    }

    if (data.extra) {
        html += data.extra;
    }

    return html;
}

function agruparPorMes(events) {
    const grupos = {};

    events.forEach(e => {
        const [year, month] = e.date.split("-");

        const key = `${year}-${month}`;

        if (!grupos[key]) {
            grupos[key] = [];
        }

        grupos[key].push(e);
    });

    return grupos;
}

function generarCalendarioVisual(month, year, events) {
    const date = new Date(year, month - 1, 1);
    const firstDay = date.getDay(); // 0=Domingo, 1=Lunes...
    const daysInMonth = new Date(year, month, 0).getDate();

    // Convertimos a índice 0–4 (Lun–Vie)
    let startCol = firstDay === 0 ? 6 : firstDay - 1;
    if (startCol > 4) startCol = 4; // Si cae sábado o domingo → lo mandamos al viernes

    let html = `
        <h3>${date.toLocaleString('es-ES', { month: 'long' })} ${year}</h3>
        <table class="calendar-table">
            <tr>
                <th>Lun</th>
                <th>Mar</th>
                <th>Mié</th>
                <th>Jue</th>
                <th>Vie</th>
            </tr>
            <tr>
    `;

    // Celdas vacías antes del día 1
    for (let i = 0; i < startCol; i++) {
        html += "<td></td>";
    }

    let col = startCol;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const event = events.find(e => e.date === dateStr);

        html += `<td class="calendar-day">`;
        html += `<strong>${day}</strong>`;

        if (event) {
            html += `<div class="calendar-event">${event.description}</div>`;
        }

        html += `</td>`;

        col++;

        // Si llegamos al viernes → salto de fila
        if (col === 5) {
            html += "</tr><tr>";
            col = 0;
        }
    }

    // Rellenar celdas vacías al final
    while (col > 0 && col < 5) {
        html += "<td></td>";
        col++;
    }

    html += "</tr></table>";
    return html;
}


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
                "PHYSICAL EDUCATION": "PhysicalEducation",
                "PHYSICAL ED.": "PhysicalEducation",
                "SOCIAL STUDIES": "SocialStudies",
                "NATURAL SCIENCE": "NaturalScience",
                "STEM": "STEM",
                "COM. SKILLS": "CommunicativeSkills"
               
            };

            const target = subjects[subjectName];

            if (!target) return;

            //openSubject(target, contenidos[target]);
            loadSubjectData(target);

}

function loadHorario() {
    lastScreen = "horario";

    fetch("horario.html")
        .then(res => res.text())
        .then(html => {
            document.getElementById("home").classList.remove("active");
            document.getElementById("content").classList.add("active");

            document.getElementById("subject-title").innerText = "Horario de Clases";
            document.getElementById("subject-body").innerHTML = html;
        });
}
*/


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
        .then(data => {
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

    /* FECHAS IMPORTANTES (Calendario de Pruebas) */
    if (data.important_dates?.length) {
        html += `<h3>${data.title}</h3><ul>`;
        data.important_dates.forEach(d => {
            html += `<li><strong>${d.date}</strong>: ${d.description}</li>`;
        });
        html += "</ul>";
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

