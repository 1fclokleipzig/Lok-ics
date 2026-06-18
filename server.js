const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

const TEAM_ID = "138382";

// nächsten + letzten Spiele holen
const NEXT_URL = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${TEAM_ID}`;
const PAST_URL = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${TEAM_ID}`;

function cleanTeamName(name) {
  if (!name) return "";
  return name
    .replace("e.V.", "")
    .replace("1. FC", "")
    .replace("FC", "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(d) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0];
}

function createEvent(ev) {
  const date = ev.dateEvent;
  const time = ev.strTime || "15:00:00";

  const start = new Date(`${date}T${time}`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const home = cleanTeamName(ev.strHomeTeam);
  const away = cleanTeamName(ev.strAwayTeam);

  let summary = `${home} vs ${away}`;

  // 👉 Ergebnis einbauen, wenn vorhanden
  if (ev.intHomeScore !== null && ev.intAwayScore !== null) {
    summary = `${home} ${ev.intHomeScore}–${ev.intAwayScore} ${away}`;
  }

  return `
BEGIN:VEVENT
UID:${ev.idEvent}
DTSTAMP:${formatDate(new Date())}Z
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${summary}
DESCRIPTION:${ev.strLeague || ""}
LOCATION:${ev.strVenue || ""}
STATUS:CONFIRMED
END:VEVENT`;
}

app.get("/", (req, res) => {
  res.send("Lok ICS läuft ✅");
});

app.get("/ics", async (req, res) => {
  try {
    const [nextRes, pastRes] = await Promise.all([
      fetch(NEXT_URL),
      fetch(PAST_URL)
    ]);

    const nextData = await nextRes.json();
    const pastData = await pastRes.json();

    let events = "";

    // vergangene Spiele (mit Ergebnis)
    if (pastData.events) {
      pastData.events.forEach(ev => {
        events += createEvent(ev);
      });
    }

    // kommende Spiele
    if (nextData.events) {
      nextData.events.forEach(ev => {
        events += createEvent(ev);
      });
    }

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lok Leipzig//DE
CALSCALE:GREGORIAN
${events}
END:VCALENDAR`;

    res.setHeader("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Laden");
  }
});

app.listen(PORT, () => console.log("Server läuft auf Port " + PORT));
