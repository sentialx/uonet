import axios from 'axios';
import { v1 as uuidv1 } from 'uuid';

import { Account, Pupil } from 'src/models';
import { getRequest, getRestApiURL } from './utils';

export class API {
  private accounts: { [key: string]: Account } = {};

  public async request(accountId: number, body: any, method: string) {
    try {
      const account = this.accounts[accountId];

      if (!account) {
        throw new Error("Couldn't find the account with given ID.");
      }

      const url = `${account.baseURL}/mobile-api/Uczen.v3.Uczen/${method}`;
      const req = await getRequest(
        {
          body,
          url,
        },
        {
          key: account.certificate.key,
          pfx: account.certificate.pfx,
        },
      );

      const res = await axios(req);

      return res.data;
    } catch (e) {
      throw e;
    }
  }

  public async getTimetable(accountId: number) {
    try {
      const account = this.accounts[accountId];
      const timetable = this.request(
        accountId,
        {
          IdOkresKlasyfikacyjny: account.periodId,
          IdUczen: account.id,
          IdOddzial: account.branchId,
        },
        'PlanLekcjiZeZmianami',
      );

      return timetable;
    } catch (e) {
      throw e;
    }
  }

  public async login(pin: number, token: string, symbol: string) {
    try {
      const code = token.substring(0, 3);
      const url = await getRestApiURL(code);

      const cert = await axios(
        await getRequest({
          body: {
            PIN: pin,
            TokenKey: token,
            DeviceId: uuidv1(),
            DeviceName: 'uonet-api#uonet-api',
            DeviceNameUser: '',
            DeviceDescription: '',
            DeviceSystemType: 'Android',
            DeviceSystemVersion: '7.1.0',
          },
          headers: {
            RequestMobileType: 'RegisterDevice',
          },
          url: `${url}/${symbol}/mobile-api/Uczen.v3.UczenStart/Certyfikat`,
        }),
      );

      if (cert.data.IsError) {
        throw new Error('UONET+ certificate obtaining failed');
      }

      const { CertyfikatPfx, CertyfikatKlucz } = cert.data.TokenCert;

      const pupilList = await axios(
        await getRequest({
          url: `${url}/${symbol}/mobile-api/Uczen.v3.UczenStart/ListaUczniow`,
        }),
      );

      pupilList.data.Data.forEach((pupil: Pupil) => {
        const account: Account = {
          baseURL: `${url}/${symbol}/${pupil.JednostkaSprawozdawczaSymbol}`,
          id: pupil.Id,
          certificate: {
            key: CertyfikatKlucz,
            pfx: CertyfikatPfx,
          },
          branchId: pupil.IdOddzial,
          periodId: pupil.IdOkresKlasyfikacyjny,
        };

        this.accounts[account.id] = account;
      });
    } catch (err) {
      throw err;
    }
  }
}
