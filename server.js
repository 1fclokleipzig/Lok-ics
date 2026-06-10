import express from "express";

const app = express();

// 👉 Team ID Lok Leipzig
const TEAM_ID = "138382";

// 👉 API
const NEXT_URL = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${TEAM_ID}`;
const LAST_URL = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${TEAM_ID}`;

// ✅ ICS bauen
function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Lok Leipzig//DE
`;

  matches.forEach((g, i) => {
    if (!g.date) return;

    const dtStart = g.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    ics += `
BEGIN:VEVENT
UID:${i}
DTSTAMP:${dtStart}
DTSTART:${dtStart}
SUMMARY:${g.home} - ${g.away}
DESCRIPTION:${g.league || ""}
LOCATION:${g.venue || ""}
END:VEVENT
`;
  });

  ics += "\nEND:VCALENDAR";
  return ics;
}

// ✅ Daten von TheSportsDB holen
async function fetchMatches(url) {
  const res = await fetch(url);
  const data = await res.json();

  if (!data.events) return [];

  return data.events.map(e => {
    // Datum + Zeit kombinieren
    const dateTime = new Date(`${e.dateEvent}T${e.strTime || "15:00:00"}`);

    return {
      date: dateTime,
      home: e.strHomeTeam,
      away: e.strAwayTeam,
      league: e.strLeague,
      venue: e.strVenue
    };
  });
}

app.get("/lok.ics", async (req, res) => {
  try {
    // ✅ beide Quellen laden
    const nextMatches = await fetchMatches(NEXT_URL);
    const lastMatches = await fetchMatches(LAST_URL);

    // ✅ kombinieren
    let allMatches = [...lastMatches, ...nextMatches];

    // ✅ Duplikate entfernen
    const seen = new Set();
    const unique = [];

    allMatches.forEach(m => {
      const key = m.home + m.away + m.date;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(m);
      }
    });

    // ✅ sortieren
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
