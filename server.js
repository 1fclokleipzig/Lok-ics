import express from "express";

const app = express();

const URL =
  "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7";

function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
PRODID:-//Lok Leipzig//DE
`;

  if (matches.length === 0) {
    ics += `
BEGIN:VEVENT
DTSTART:20250101T120000Z
SUMMARY:Keine Spiele gefunden
DESCRIPTION:Feed funktioniert, aber keine Daten erhalten
END:VEVENT
`;
  } else {
    matches.forEach((g) => {
      if (!g.matchDateTime) return;

      const dt = new Date(g.matchDateTime);
      const dtStart = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      ics += `
BEGIN:VEVENT
UID:${g.matchId}
DTSTAMP:${dtStart}
DTSTART:${dtStart}
SUMMARY:${g.homeTeamName} - ${g.guestTeamName}
DESCRIPTION:${g.competitionName || ""}
LOCATION:${g.venueName || ""}
END:VEVENT
`;
    });
  }

  ics += "\nEND:VCALENDAR";
  return ics;
}

app.get("/lok.ics", async (req, res) => {
  try {
    const response = await fetch(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
        "Referer":
          "https://www.fussball.de/mannschaft/1-fc-lokomotive-leipzig-1-fc-lokomotive-leipzig-sachsen/-/saison/2526/team-id/011MIAFLAK000000VTVG0001VTR8C1K7",
        "X-Requested-With": "XMLHttpRequest"
      },
    });

    let text = await response.text();

    // 🔍 DEBUG: Wenn keine JSON Antwort
    if (!text || text.length < 10) {
      throw new Error("Leere Antwort von fussball.de");
    }

    // 👉 Prüfen ob es wirklich JSON ist
    if (!text.startsWith("{") && !text.startsWith(")]}")) {
      throw new Error("Keine JSON Antwort:\n" + text.substring(0, 200));
    }

    // 👉 Schutz entfernen
    if (text.startsWith(")]}',")) {
      text = text.substring(5);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("JSON Parsing fehlgeschlagen:\n" + text.substring(0, 200));
    }

    const matches = data.matches || [];

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    console.error(err);

    // ✅ Fehler als Kalender ausgeben (damit du ihn IMMER siehst)
    const fallback = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250101T120000Z
SUMMARY:Fehler beim Laden
DESCRIPTION:${err.toString()}
END:VEVENT
END:VCALENDAR`;

    res.set("Content-Type", "text/calendar");
    res.send(fallback);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
