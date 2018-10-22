import express = require('express');
import { login, request, getURL } from './api';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import { time } from './utils';

const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/login', async (req, res) => {
  try {
    const response = await login(
      req.query.pin,
      req.query.token,
      req.query.symbol,
    );
    res.send(response);
  } catch (e) {
    res.send({ error: e.message });
  }
});

app.post('/timetable', async (req, res) => {
  const { symbol, code, schoolSymbol, certKey, certPfx } = req.body;

  console.log(req.body);

  try {
    const response = await request(
      code,
      symbol,
      schoolSymbol,
      certKey,
      certPfx,
      'PlanLekcjiZeZmianami',
      {
        DataPoczatkowa: '2018-10-22',
        DataKoncowa: '2018-10-28',
        IdOddzial: 7397,
        IdOkresKlasyfikacyjny: 53058,
        IdUczen: 149003,
        RemoteMobileTimeKey: time(),
        TimeKey: time() - 1,
        RequestId: uuidv4(),
        RemoteMobileAppVersion: '18.4.1.388',
        RemoteMobileAppName: 'VULCAN-Android-ModulUcznia',
      },
    );

    res.send(response);
  } catch (e) {
    res.send({ error: e.message });
    console.log(e);
  }
});

const server = app.listen(8080, () => {
  console.log('Listening...');
});
