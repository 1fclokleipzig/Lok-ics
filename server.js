import express from "express";

const app = express();

const URL = "https://www.kicker.de/1-fc-lok-leipzig/spielplan/vereine-freundschaftsspiele/2026-27";

function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Lok Leipzig//DE
`;

  matches.forEach((g, index) => {
    const dtStart = g.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    ics += `
BEGIN:VEVENT
UID:lok-${index}
DTSTART:${dtStart}
SUMMARY:${g.home} - ${g.away}
DESCRIPTION:Kicker Spielplan
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

    const html = await response.text();

    const matches = [];

    // ✅ Kicker Spiele erkennen
    const regex = /data-dt="([^"]+)".*?class="kick__v100-gameCell__team__name">([^<]+)<.*?class="kick__v100-gameCell__team__name">([^<]+)</gs;

    let match;

    while ((match = regex.exec(html)) !== null) {
      const dateRaw = match[1];
      const home = match[2].trim();
      const away = match[3].trim();

      const date = new Date(dateRaw);

      if (home && away && !isNaN(date)) {
        matches.push({ date, home, away });
      }
    }

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    res.set("Content-Type", "text/plain");
    res.send("Error:\n" + err.toString());
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
