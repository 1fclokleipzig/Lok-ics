app.get("/lok.ics", async (req, res) => {
  try {
    const response = await fetch(TEAM_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.fussball.de/",
      },
    });

    const text = await response.text();

    // Debug: schauen ob überhaupt was kommt
    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from fussball.de");
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse error:", text);
      throw new Error("Invalid JSON from fussball.de");
    }

    const matches = data.matches || [];

    const ics = buildICS(matches);

    res.set("Content-Type", "text/calendar");
    res.send(ics);

  } catch (err) {
    console.error("Calendar error:", err.message);
    res.send("Error generating calendar");
  }
});
