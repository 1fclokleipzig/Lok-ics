import express from "express";
import puppeteer from "puppeteer";

const app = express();

const URL = "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7";

function buildICS(matches) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
PRODID:-//Lok Leipzig//DE
`;

  matches.forEach((g) => {
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
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(URL, { waitUntil: "networkidle2" });

    const text = await page.evaluate(() => document.body.innerText);

    await browser.close();

    // Schutz entfernen
    const clean = text.startsWith(")]}',") ? text.substring(5) : text;
    const data = JSON.parse(clean);

    const matches = data.matches || [];
    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    console.error(err);
    res.send("Error generating calendar");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
