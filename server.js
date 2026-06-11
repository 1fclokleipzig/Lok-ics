const express = require("express");
const fetch = require("node-fetch");

const app = express();

const URL = "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7";

app.get("/ics", async (req, res) => {
  try {
    const r = await fetch(URL);
    const text = await r.text();

    const matches = [...text.matchAll(/(\d{2}\.\d{2}\.\d{4}).*?(\d{2}:\d{2}).*?(?:team-name.*?>\s*([^<]+)).*?(?:team-name.*?>\s*([^<]+))/gs)];

    let events = "";

    for (const m of matches) {
      const date = m[1];
      const time = m[2];
      const home = m[3];
      const away = m[4];

      const [d, M, y] = date.split(".");
      const [h, min] = time.split(":");

      const start = `${y}${M}${d}T${h}${min}00`;
      const end = `${y}${M}${d}T${h}${min}00`;

      events += `
BEGIN:VEVENT
UID:${date}-${time}-${home}-${away}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${start}
DTEND:${end}
SUMMARY:⚽ ${home} vs ${away}
LOCATION:
DESCRIPTION:Spielplan
END:VEVENT`;
    }

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lok Leipzig//DE
${events}
END:VCALENDAR`;

    res.setHeader("Content-Type", "text/calendar");
    res.send(ics);

  } catch (e) {
    res.status(500).send("Error");
  }
});

app.listen(3000, () => console.log("Server läuft"));
