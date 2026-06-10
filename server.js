import express from "express";

const app = express();

app.get("/lok.ics", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send("OK SERVER WORKS");
});

app.listen(3000, () => {
  console.log("Server läuft");
});
