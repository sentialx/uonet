import express = require("express");
import { login } from "./api";

const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.get("/login", async (req, res) => {
  try {
    const response = await login(
      req.query.pin,
      req.query.token,
      req.query.symbol
    );
    res.send(response);
  } catch (e) {
    res.send({ error: e.message });
  }
});

app.get("/timetable", async (req, res) => {});

const server = app.listen(8080, () => {
  console.log("Listening...");
});
