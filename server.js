import express from "express";

const app = express();

const URLS = [
  "https://www.kicker.de/1-fc-lok-leipzig/spielplan",
  "https://www.kicker.de/1-fc-lok-leipzig/spielplan/vereine-freundschaftsspiele/2026-27"
];

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
DESCRIPTION:${g.competition}
LOCATION:${g.location}
END:VEVENT
`;
    });
  }

  ics += "\nEND:VCALENDAR";
  return ics;
}

async function getMatchesFromURL(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();

  const teams = [...html.matchAll(/team__name">([^<]+)</g)].map(m => m[1].trim());
  const dates = [...html.matchAll(/data-dt="([^"]+)"/g)].map(m => m[1]);

  const matches = [];

  for (let i = 0; i < teams.length; i += 2) {
    const home = teams[i];
    const away = teams[i + 1];
    const rawDate = dates[Math.floor(i / 2)];

    if (!home || !away || !rawDate) continue;

    const date = new Date(rawDate);

    matches.push({
      date,
      home,
      away
    });
  }

  return matches;
}

app.get("/lok.ics", async (req, res) => {
  try {
    let allMatches = [];

    // ✅ beide Quellen laden
    for (const url of URLS) {
      const matches = await getMatchesFromURL(url);
      allMatches = allMatches.concat(matches);
    }

    const now = new Date();

    // ✅ nur zukünftige Spiele
    let filtered = allMatches.filter(m => m.date >= now);

    // ✅ doppelte entfernen (wichtig!)
    const unique = [];
    const seen = new Set();

    filtered.forEach(m => {
      const key = m.home + m.away + m.date;

      if (!seen.has(key)) {
        seen.add(key);

        const isHome = m.home.includes("Lok Leipzig");

        unique.push({
          date: m.date,
          home: m.home,
          away: m.away,
          competition: url.includes("freundschaftsspiele")
            ? "Freundschaftsspiel"
            : "Ligaspiel",
          location: isHome ? "Bruno-Plache-Stadion" : "Auswärts"
        });
      }
    });

    // ✅ sortieren nach Datum
    unique.sort((a, b) => a.date - b.date);

    const ics = buildICS(unique);

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
