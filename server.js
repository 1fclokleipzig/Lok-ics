  
  
import express from "express";  
import fetch from "node-fetch";  
  
const app = express();  
  
const TEAM_URL =  
  "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7";  
  
function buildICS(matches) {  
  let ics = `BEGIN:VCALENDAR  
VERSION:2.0  
CALSCALE:GREGORIAN  
METHOD:PUBLISH  
PRODID:-//Lok Leipzig//Spielplan//DE  
`;  
  
  matches.forEach((g) => {  
    if (!g.matchDateTime) return;  
  
    const dt = new Date(g.matchDateTime);  
    const dtStart = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";  
  
    const uid = `lok-${dtStart}-${g.homeTeamName}-${g.guestTeamName}`;  
  
    ics += `  
BEGIN:VEVENT  
UID:${uid}  
DTSTAMP:${dtStart}  
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
  
app.get("/lok.ics", async (req, res) => {  
  try {  
    const response = await fetch(TEAM_URL);  
    const data = await response.json();  
  
    const ics = buildICS(data.matches || []);  
  
    res.set("Content-Type", "text/calendar");  
    res.send(ics);  
  } catch (err) {  
    res.status(500).send("Error generating calendar");  
  }  
});  
  
app.listen(3000, () => {  
  console.log("Server läuft auf Port 3000");  
});  
