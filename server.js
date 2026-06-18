const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// Team-ID Lok Leipzig (TheSportsDB)
const TEAM_ID = "138382";

// API (freie Version)
const URL = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${TEAM_ID}`;

app.get("/", (req, res) => {
  res.send("Lok ICS läuft ✅");
});

app.get("/ics", async (req, res) => {
  try {
    const r = await fetch(URL);
    const data = await r.json();

    let events = "";

    if (!data.events) {
      events = `
BEGIN:VEVENT
SUMMARY:Keine Spiele gefunden
DTSTART:20260101T120000
DTEND:20260101T140000
END:VEVENT`;
    } else {

      data.events.forEach(ev => {

        const date = ev.dateEvent;       // 2026-07-01
        const time = ev.strTime || "15:00:00"; // fallback

        const start = new Date(`${date}T${time}`);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

        const format = (d) =>
          d.toISOString().replace(/[-:]/g, "").split(".")[0];

        const summary = `⚽ ${ev.strHomeTeam} vs ${ev.strAwayTeam}`;
        const location = ev.strVenue || "";
        const description = ev.strLeague || "";

        events += `
BEGIN:VEVENT
UID:${ev.idEvent}
DTSTAMP:${format(new Date())}Z
DTSTART:${format(start)}
DTEND:${format(end)}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED
END:VEVENT`;
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
    res.status(500).send("Fehler beim Laden der Daten");
  }
});

app.listen(PORT, () => console.log("Server läuft auf Port " + PORT));
