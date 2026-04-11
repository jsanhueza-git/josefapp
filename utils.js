function generarICSDesdeJSON(events) {
    let ics = "BEGIN:VCALENDAR\n";
    ics += "VERSION:2.0\n";
    ics += "CALSCALE:GREGORIAN\n";
    ics += "METHOD:PUBLISH\n";
    ics += "PRODID:-//Josefapp//ES\n";

    events.forEach(ev => {
        const date = ev.date.replace(/-/g, ""); // YYYYMMDD

        // Sanitizar descripción (remover HTML)
        const cleanDescription = ev.description
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        ics += "BEGIN:VEVENT\n";
        ics += `DTSTART;VALUE=DATE:${date}\n`;
        ics += `SUMMARY:${ev.subject} – ${cleanDescription}\n`;
        ics += "END:VEVENT\n";
    });

    ics += "END:VCALENDAR";

    return ics;
}

function descargarICS() {
    const data = window.masterData.calendar; // tu JSON ya cargado
    const icsContent = generarICSDesdeJSON(data);

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "calendario.ics";
    a.click();

    URL.revokeObjectURL(url);
}
