import express from "express";

const app = express();

const URL =
  "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7";

app.get("/lok.ics", async (req, res) => {
  try {
    const response = await fetch(URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest"
      },
    });

    const text = await response.text();

    // 👉 DEBUG: wir zeigen erstmal nur die Antwort
    res.set("Content-Type", "text/plain");
    res.send(text);

  } catch (err) {
    res.send("ERROR: " + err.toString());
  }
});

app.listen(3000, () => console.log("Server läuft"));
