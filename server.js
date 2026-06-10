import express from "express";
import fetch from "node-fetch";

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

    // 👉 DAS IST DER DEBUG STEP
    res.set("Content-Type", "text/plain");
    res.send(text);

  } catch (err) {
    res.send(err.toString());
  }
});

app.listen(3000, () => console.log("Server läuft"));
