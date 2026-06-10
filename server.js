import express from "express";

const app = express();

app.get("/lok.ics", async (req, res) => {
  try {
    const response = await fetch(
      "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "de-DE,de;q=0.9",
          "Referer": "https://www.fussball.de/",
          "Origin": "https://www.fussball.de",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    const text = await response.text();

    // 👉 DEBUG Ausgabe (jetzt MUSS etwas kommen)
    res.set("Content-Type", "text/plain");
    res.send(text);

  } catch (err) {
    res.send("ERROR: " + err.toString());
  }
});

app.listen(3000, () => console.log("Server läuft"));
