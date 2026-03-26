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

    if (data.important_dates?.length) {
        html += `<h3>Fechas Importantes</h3><ul>`;
        data.important_dates.forEach(d => {
            html += `<li><strong>${d.date}</strong>: ${d.description}</li>`;
        });
        html += `</ul>`;
    }

    if (data.extra) {
        html += data.extra;
    }

    return html;
}