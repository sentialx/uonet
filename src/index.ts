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
  const response = await login(req.body.pin, req.body.token, req.body.symbol);
  res.send(response);
});

const server = app.listen(8080, () => {
  console.log("Listening...");
});
