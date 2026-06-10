import express from "express";
import fetch from "node-fetch";

const app = express();

const TEAM = "Lokomotive Leipzig";

function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
PRODID:-//Lok Leipzig//Spielplan//DE
`;

  matches.forEach((g) => {
    const date = new Date(g.dateEvent + "T" + (g.strTime || "12:00:00"));
    const dtStart = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const uid = `lok-${dtStart}-${g.strHomeTeam}-${g.strAwayTeam}`;

    ics += `
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStart}
DTSTART:${dtStart}
SUMMARY:${g.strHomeTeam} - ${g.strAwayTeam}
DESCRIPTION:${g.strLeague}
LOCATION:${g.strVenue || ""}
END:VEVENT
`;
  });

  ics += "\nEND:VCALENDAR";
  return ics;
}

app.get("/lok.ics", async (req, res) => {
  try {
    // nächste Spiele holen
    const response = await fetch(
      "https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=133613"
    );

    const data = await response.json();

    // filter nur Lok-Spiele (zur Sicherheit)
    const matches = (data.events || []).filter(
      (m) => m.strHomeTeam === TEAM || m.strAwayTeam === TEAM
    );

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    console.error(err);
    res.send("Error generating calendar");
  }
});

app.listen(3000, () => {
  console.log("Server läuft auf Port 3000");
});
