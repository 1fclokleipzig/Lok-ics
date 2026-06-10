import express from "express";

const app = express();

const URL = "https://www.kicker.de/1-fc-lok-leipzig/spielplan/vereine-freundschaftsspiele/2026-27";

function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Lok Leipzig//DE
`;

  if (matches.length === 0) {
    ics += `
BEGIN:VEVENT
SUMMARY:Noch keine Spiele verfügbar
DTSTART:20260101T120000Z
END:VEVENT
`;
  } else {
    matches.forEach((g, i) => {
      const dtStart = g.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      ics += `
BEGIN:VEVENT
UID:${i}
DTSTAMP:${dtStart}
DTSTART:${dtStart}
SUMMARY:${g.home} - ${g.away}
DESCRIPTION:${g.description}
LOCATION:${g.location}
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
    const now = new Date();

    // Teams extrahieren
    const teams = [...html.matchAll(/team__name">([^<]+)</g)].map(m => m[1].trim());

    // Datum extrahieren
    const dates = [...html.matchAll(/data-dt="([^"]+)"/g)].map(m => m[1]);

    for (let i = 0; i < teams.length; i += 2) {
      const home = teams[i];
      const away = teams[i + 1];
      const rawDate = dates[Math.floor(i / 2)];

      if (!home || !away || !rawDate) continue;

      const date = new Date(rawDate);

      // Nur zukünftige Spiele
      if (date < now) continue;

      const isHome = home.includes("Lok Leipzig");

      matches.push({
        date,
        home,
        away,
        description: `${home} gegen ${away}`,
        location: isHome ? "Bruno-Plache-Stadion" : "Auswärts"
      });
    }

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    const fallback = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260101T120000Z
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
