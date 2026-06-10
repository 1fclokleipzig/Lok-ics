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
END:VEVENT
`;
    });
  }

  ics += "\nEND:VCALENDAR";
  return ics;
}

app.get("/lok.ics", async (req, res) => {
  try {
    // ✅ fetch nur hier (nicht global!)
    const response = await fetch(URL, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await response.text();

    const matches = [];

    const regex = /data-dt="([^"]+)".*?team__name">([^<]+)<.*?team__name">([^<]+)</gs;

    let match;

    while ((match = regex.exec(html)) !== null) {
      const date = new Date(match[1]);
      const home = match[2].trim();
      const away = match[3].trim();

      if (!isNaN(date)) {
        matches.push({ date, home, away });
      }
    }

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    // ✅ KEIN CRASH MEHR → immer ICS zurückgeben
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
