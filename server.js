import express from "express";
import fetch from "node-fetch";

const app = express();

// 👉 interner Flashscore JSON Endpoint
const URL = "https://d.flashscore.de/x/feed/fc_t_WtfIuJd0";

function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
PRODID:-//Lok Leipzig//Flashscore//DE
`;

  matches.forEach((g) => {
    const dtStart = g.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const uid = `lok-${dtStart}-${g.home}-${g.away}`;

    ics += `
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStart}
DTSTART:${dtStart}
SUMMARY:${g.home} - ${g.away}
DESCRIPTION:Flashscore
END:VEVENT
`;
  });

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

    const text = await response.text();

    const lines = text.split("\n");

    const matches = [];

    lines.forEach(line => {
      if (line.startsWith("AE")) {
        // Beispielstruktur Flashscore:
        const parts = line.split("¬");

        const home = parts.find(p => p.startsWith("AH="))?.replace("AH=", "") || "";
        const away = parts.find(p => p.startsWith("AA="))?.replace("AA=", "") || "";
        const time = parts.find(p => p.startsWith("AD="))?.replace("AD=", "");

        if (!home || !away || !time) return;

        // Zeit in Datum umwandeln
        const date = new Date(parseInt(time) * 1000);

        matches.push({ date, home, away });
      }
    });

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    console.error(err);
    res.send("Error generating calendar");
  }
});

app.listen(3000, () => {
  console.log("Flashscore API Server läuft");
});
