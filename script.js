function goHome() {
    document.getElementById("content").classList.remove("active");
    document.getElementById("home").classList.add("active");
}

function openSubject(title, contentHTML) {
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
            openSubject("Error", "<p>No se pudo cargar el contenido :'( ).</p>");
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
    }
/*
    if (data.important_dates?.length) {
        html += `<h3>Fechas Importantes</h3><ul>`;
        data.important_dates.forEach(d => {
            html += `<li><strong>${d.date}</strong>: ${d.description}</li>`;
        });
        html += `</ul>`;
    }
        */

    if (data.important_dates?.length) {
    const grupos = agruparPorMes(data.important_dates);
    let html = "";

    for (const key in grupos) {
        const [year, month] = key.split("-");
        html += generarCalendarioVisual(parseInt(month), parseInt(year), grupos[key]);
    }

    return html;
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
    const firstDay = date.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

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

    let dayOfWeek = (firstDay === 0 ? 6 : firstDay - 1);

    for (let i = 0; i < dayOfWeek; i++) {
        html += "<td></td>";
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const event = events.find(e => e.date === dateStr);

        html += `<td class="calendar-day">`;
        html += `<strong>${day}</strong>`;

        if (event) {
            html += `<div class="calendar-event">${event.description}</div>`;
        }

        html += `</td>`;

        if ((day + dayOfWeek) % 5 === 0) {
            html += "</tr><tr>";
        }
    }

    html += "</tr></table>";
    return html;
}