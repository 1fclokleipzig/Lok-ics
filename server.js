import express from "express";

const app = express();

const URLS = [
  "https://www.kicker.de/1-fc-lok-leipzig/spielplan",
  "https://www.kicker.de/1-fc-lok-leipzig/spielplan/vereine-freundschaftsspiele/2026-27"
];

// ✅ ICS bauen
function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Lok Leipzig//DE
`;

  matches.forEach((g, i) => {
    const dtStart = g.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    ics += `
BEGIN:VEVENT
UID:${i}
DTSTART:${dtStart}
SUMMARY:${g.home} - ${g.away}
DESCRIPTION:${g.competition}
LOCATION:${g.location}
END:VEVENT
`;
  });

  ics += "\nEND:VCALENDAR";
  return ics;
}

// ✅ NEUER Parser (entscheidend!)
async function getMatchesFromURL(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();

  const matches = [];

  // 👉 einzelne Spielblöcke erkennen
  const blocks = [...html.matchAll(/kick__v100-gameCell[\s\S]*?<\/article>/g)];

  blocks.forEach((blockMatch, index) => {
    const block = blockMatch[0];

    const teams = [...block.matchAll(/team__name">([^<]+)</g)];

    if (teams.length < 2) return;

    const home = teams[0][1].trim();
    const away = teams[1][1].trim();

    const dateMatch = block.match(/data-dt="([^"]+)"/);

    let date;

    // ✅ Datum korrekt oder fallback
    if (dateMatch) {
      date = new Date(dateMatch[1]);
    } else {
      date = new Date();
      date.setDate(date.getDate() + index);
    }

    matches.push({
      date,
      home,
      away,
      competition: url.includes("freundschaftsspiele")
        ? "Freundschaftsspiel"
        : "Ligaspiel",
      location: home.includes("Lok Leipzig")
        ? "Bruno-Plache-Stadion"
        : "Auswärts"
    });
  });

  return matches;
}

app.get("/lok.ics", async (req, res) => {
  try {
    let allMatches = [];

    for (const url of URLS) {
      const matches = await getMatchesFromURL(url);
      allMatches = allMatches.concat(matches);
    }

    // ✅ Duplikate entfernen
    const seen = new Set();
    const unique = [];

    allMatches.forEach(m => {
      const key = m.home + m.away + m.date.toISOString();

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
  console.log("Server läuft");
});
