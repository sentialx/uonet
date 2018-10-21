import express = require("express");

const app = express();

app.get("/", (req, res) => {});

const server = app.listen(8080, () => {
  console.log("Listening...");
});
