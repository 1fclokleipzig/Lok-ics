import express from "express";

const app = express();

const TEAM_ID = "138382";

// 👉 TheSportsDB Endpoints
const NEXT_URL = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${TEAM_ID}`;
const LAST_URL = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${TEAM_ID}`;

// ✅ ICS erstellen
function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Lok Leipzig//DE
`;

  if (matches.length === 0) {
    // 👉 Kein Dummy-Event → leerer, gültiger Kalender
    ics += `
BEGIN:VEVENT
SUMMARY:Keine Daten verfügbar
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
DESCRIPTION:${g.league || ""}
LOCATION:${g.venue || ""}
END:VEVENT
`;
    });
  }

  ics += "\nEND:VCALENDAR";
  return ics;
}

// ✅ sichere API-Abfrage (kein Crash mehr!)
async function fetchJSON(url) {
  try {
    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json();

    return data;
  } catch (err) {
    return null;
  }
}

// ✅ Daten verarbeiten
function parseEvents(data) {
  if (!data || !data.events) return [];

  return data.events.map(e => {
    const dateTime = new Date(
      `${e.dateEvent || ""}T${e.strTime || "15:00:00"}`
    );

    return {
      home: e.strHomeTeam || "Unbekannt",
      away: e.strAwayTeam || "Unbekannt",
      date: dateTime,
      league: e.strLeague,
      venue: e.strVenue
    };
  });
}

app.get("/lok.ics", async (req, res) => {
  try {
    const nextData = await fetchJSON(NEXT_URL);
    const lastData = await fetchJSON(LAST_URL);

    const nextMatches = parseEvents(nextData);
    const lastMatches = parseEvents(lastData);

    const allMatches = [...lastMatches, ...nextMatches];

    // ✅ sortieren
    allMatches.sort((a, b) => a.date - b.date);

    const ics = buildICS(allMatches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    // ✅ absoluter Fallback (nie leer / nie crash)
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
  console.log("Server läuft");
});
