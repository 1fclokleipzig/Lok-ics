import express from "express";
import fetch from "node-fetch";

const app = express();

const URL = "https://www.flashscore.de/team/1-fc-lok-leipzig/WtfIuJd0/begegnungen/";

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
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await response.text();

    const matches = [];

    // 🔥 robuster Regex
    const regex = /event__match.*?event__time\">(.*?)<.*?event__participant--home\">(.*?)<.*?event__participant--away\">(.*?)</gs;

    let match;

    while ((match = regex.exec(html)) !== null) {
      const rawDate = match[1];
      const home = match[2].trim();
      const away = match[3].trim();

      // Datum parsen (Flashscore Format DD.MM. HH:MM)
      const parts = rawDate.split(/[\.\s:]/);

      if (parts.length < 4) continue;

      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const hour = parseInt(parts[2]);
      const minute = parseInt(parts[3]);

      const now = new Date();
      const date = new Date(now.getFullYear(), month, day, hour, minute);

      matches.push({ date, home, away });
    }

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    console.error(err);
    res.send("Error generating calendar");
  }
});

app.listen(3000, () => {
  console.log("Flashscore Server läuft");
});
