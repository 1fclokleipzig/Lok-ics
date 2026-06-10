import express from "express";

const app = express();

app.get("/lok.ics", (req, res) => {
  res.send("SERVER OK ✅");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
