import express from "express";
import fs from "fs";

const app = express();

const CACHE_FILE = "cache.json";
const URL = "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7";

// ✅ ICS bauen
function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Lok Leipzig//DE
`;

  matches.forEach((g) => {
    if (!g.matchDateTime) return;

    const dt = new Date(g.matchDateTime);
    const dtStart = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    ics += `
BEGIN:VEVENT
UID:${g.matchId}
DTSTART:${dtStart}
SUMMARY:${g.homeTeamName} - ${g.guestTeamName}
DESCRIPTION:${g.competitionName || ""}
LOCATION:${g.venueName || ""}
END:VEVENT
`;
  });

  ics += "\nEND:VCALENDAR";
  return ics;
}

// ✅ Endpoint: ICS liefern
app.get("/lok.ics", (req, res) => {
  try {
    const raw = fs.readFileSync(CACHE_FILE);
    const data = JSON.parse(raw);

    const matches = data.matches || [];
    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    res.send("Error loading cache");
  }
});

// ✅ Endpoint: Daten aktualisieren
app.get("/update", async (req, res) => {
  try {
    const response = await fetch(URL);
    let text = await response.text();

    if (text.startsWith(")]}',")) {
      text = text.substring(5);
    }

    const data = JSON.parse(text);

    fs.writeFileSync(CACHE_FILE, JSON.stringify(data));

    res.send("Cache aktualisiert ✅");

  } catch (err) {
    res.send("Update fehlgeschlagen: " + err.toString());
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft");
});
