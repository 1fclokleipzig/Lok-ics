import express from "express";

const app = express();

const URL = "https://www.kicker.de/1-fc-lok-leipzig/spielplan/vereine-freundschaftsspiele/2026-27";

// ✅ ICS erstellen
function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Lok Leipzig//DE
`;

  if (matches.length === 0) {
    ics += `
BEGIN:VEVENT
SUMMARY:Keine Spiele gefunden
DTSTART:20250101T120000Z
END:VEVENT
`;
  } else {
    matches.forEach((g, i) => {
      const dtStart = g.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      ics += `
BEGIN:VEVENT
UID:${i}
DTSTART:${dtStart}
SUMMARY:${g.home} - ${g.away}
DESCRIPTION:Kicker Spielplan
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
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await response.text();

    const matches = [];

    // ✅ FINAL ROBUSTER PARSER
    const rows = [...html.matchAll(/<tr[^>]*data-dt="[^"]+"[^>]*>.*?<\/tr>/gs)];

    rows.forEach(rowMatch => {
      const row = rowMatch[0];

      const dateMatch = row.match(/data-dt="([^"]+)"/);
      const teams = [...row.matchAll(/class="[^"]*team[^"]*">([^<]+)</g)];

      if (!dateMatch || teams.length < 2) return;

      const date = new Date(dateMatch[1]);
      const home = teams[0][1].trim();
      const away = teams[1][1].trim();

      if (!isNaN(date) && home && away) {
        matches.push({ date, home, away });
      }
    });

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    // ✅ FALLBACK → Server crasht NIE
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
