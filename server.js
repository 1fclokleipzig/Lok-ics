import express from "express";

const app = express();

const URLS = [
  "https://www.kicker.de/1-fc-lok-leipzig/spielplan",
  "https://www.kicker.de/1-fc-lok-leipzig/spielplan/vereine-freundschaftsspiele/2026-27"
];

function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
`;

  matches.forEach((g, i) => {
    const dtStart = g.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    ics += `
BEGIN:VEVENT
UID:${i}
DTSTART:${dtStart}
SUMMARY:${g.home} - ${g.away}
END:VEVENT
`;
  });

  ics += "\nEND:VCALENDAR";
  return ics;
}

async function getMatches(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const html = await response.text();

  const matches = [];

  // ✅ einfache stabile Methode
  const teams = [...html.matchAll(/team__name">([^<]+)</g)].map(m => m[1].trim());

  for (let i = 0; i < teams.length; i += 2) {
    const home = teams[i];
    const away = teams[i + 1];

    if (!home || !away) continue;

    const date = new Date();
    date.setDate(date.getDate() + i);

    matches.push({ date, home, away });
  }

  return matches;
}

app.get("/lok.ics", async (req, res) => {
  try {
    let allMatches = [];

    for (const url of URLS) {
      const matches = await getMatches(url);
      allMatches = allMatches.concat(matches);
    }

    // ✅ Duplikate entfernen
    const seen = new Set();
    const unique = [];

    allMatches.forEach(m => {
      const key = m.home + m.away;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(m);
      }
    });

    const ics = buildICS(unique);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    console.error(err);

    res.set("Content-Type", "text/plain");
    res.send("Fehler:\n" + err.toString());
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft");
});
