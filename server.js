import express from "express";
import fetch from "node-fetch";

const app = express();

const URL = "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7";

function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
PRODID:-//Lok Leipzig//DE
`;

  matches.forEach(g => {
    const dt = new Date(g.date);
    const dtStart = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    ics += `
BEGIN:VEVENT
UID:${g.id}
DTSTAMP:${dtStart}
DTSTART:${dtStart}
SUMMARY:${g.home} - ${g.away}
DESCRIPTION:${g.league}
LOCATION:${g.location}
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
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    let text = await response.text();

    // ✅ wichtig: Schutz entfernen
    text = text.replace(/^\)\]\}',?\n?/, "");

    const data = JSON.parse(text);

    // ✅ richtige Struktur mappen
    const matches = (data.matchList || []).map(g => ({
      id: g.matchId,
      date: g.matchDateTime,
      home: g.homeTeamName,
      away: g.guestTeamName,
      league: g.competitionName || "",
      location: g.venueName || ""
    }));

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    console.error(err);
    res.send("Error generating calendar");
  }
});

app.listen(3000, () => console.log("Server läuft"));
