import express from "express";

const app = express();

app.get("/lok.ics", (req, res) => {
  res.send("OK SERVER WORKS ✅");
});

// ✅ WICHTIG für Render!
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
