import express from "express";

const app = express();

const URL =
  "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7";

function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
PRODID:-//Lok Leipzig//DE
`;

  matches.forEach((g) => {
    if (!g.matchDateTime) return;

    const dt = new Date(g.matchDateTime);
    const dtStart = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    ics += `
BEGIN:VEVENT
UID:${g.matchId}
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
    const response = await fetch(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
        "Referer":
          "https://www.fussball.de/mannschaft/1-fc-lokomotive-leipzig-1-fc-lokomotive-leipzig-sachsen/-/saison/2526/team-id/011MIAFLAK000000VTVG0001VTR8C1K7",
        "X-Requested-With": "XMLHttpRequest"
      },
    });

    let text = await response.text();

    // ✅ Schutz entfernen
    if (text.startsWith(")]}',")) {
      text = text.substring(5);
    }

    const data = JSON.parse(text);

    const matches = data.matches || [];

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    console.error(err);

    // 👉 Fehler sichtbar machen (wichtig!)
    res.set("Content-Type", "text/plain");
    res.send("ERROR:\n" + err.toString());
  }
});

// ✅ wichtig für Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
