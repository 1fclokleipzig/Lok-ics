import express from "express";

const app = express();

const URL = "https://www.kicker.de/1-fc-lok-leipzig/spielplan/vereine-freundschaftsspiele/2026-27";

// ✅ ICS bauen
function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
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

    // ✅ FLEXIBLER PARSER
    const blocks = html.split('kick__v100-gameCell');

    blocks.forEach(block => {
      const teamMatches = [...block.matchAll(/>([^<>]+)<\/span>/g)];

      if (teamMatches.length < 2) return;

      const home = teamMatches[0][1].trim();
      const away = teamMatches[1][1].trim();

      // Datum suchen
      const dateMatch = block.match(/data-dt="([^"]+)"/);

      if (!dateMatch) return;

      const date = new Date(dateMatch[1]);

      if (home && away && !isNaN(date)) {
        matches.push({ date, home, away });
      }
    });

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
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
