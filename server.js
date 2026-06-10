import express from "express";

const app = express();

// 👉 WICHTIG: Kicker Ajax Endpoint (funktioniert serverseitig!)
const URL = "https://www.kicker.de/_next/data";

// ✅ ICS bauen
function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Lok Leipzig//DE
`;

  if (matches.length === 0) {
    ics += `
BEGIN:VEVENT
SUMMARY:Keine Spiele gefunden
DTSTART:20250101T120000Z
END:VEVENT
`;
  } else {
    matches.forEach((g, i) => {
      const dtStart = g.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      ics += `
BEGIN:VEVENT
UID:${i}
DTSTART:${dtStart}
SUMMARY:${g.home} - ${g.away}
DESCRIPTION:Kicker
END:VEVENT
`;
    });
  }

  ics += "\nEND:VCALENDAR";
  return ics;
}

app.get("/lok.ics", async (req, res) => {
  try {
    // 👉 wir laden die normale Seite
    const page = await fetch("https://www.kicker.de/1-fc-lok-leipzig/spielplan/");
    const html = await page.text();

    const matches = [];

    // 👉 Wir holen alle Spielzeilen einfacher raus
    const regex = /<span class="kick__v100-gameCell__team__name">(.*?)<\/span>/g;

    const teams = [...html.matchAll(regex)].map(m => m[1].trim());

    // 👉 Teams paarweise zusammenfassen
    for (let i = 0; i < teams.length; i += 2) {
      const home = teams[i];
      const away = teams[i + 1];

      if (!home || !away) continue;

      // Dummy-Datum (wir haben kein sauberes Datum aus HTML)
      const date = new Date();
      matches.push({ date, home, away });
    }

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    const fallback = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250101T120000Z
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
