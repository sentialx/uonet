import axios from 'axios';
import { v1 as uuidv1 } from 'uuid';

import { Account, UONETPupil, UONETLesson, Lesson } from './models';
import { getRestApiURL, getRequest } from './utils/requests';
import { APP_VERSION } from './constants';
import { getUnixTime } from 'date-fns';

export class UONET {
  private accounts: Account[] = [];

  public async request(accountId: number, body: any, method: string) {
    try {
      const account = this.accounts.find(x => x.id === accountId);

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

  public async getTimetable(accountId: number, from: string, to: string) {
    try {
      const account = this.accounts.find(x => x.id === accountId);
      let data: UONETLesson[] = (await this.request(
        accountId,
        {
          IdOkresKlasyfikacyjny: account.periodId,
          IdUczen: account.id,
          IdOddzial: account.branchId,
          DataPoczatkowa: from,
          DataKoncowa: to,
        },
        'PlanLekcjiZeZmianami',
      )).Data;
      const dictionary = (await this.request(accountId, {}, 'Slowniki')).Data;

      data = data.sort((a, b) => {
        return a.NumerLekcji - b.NumerLekcji;
      });

      const timetable: Lesson[] = data.map(item => {
        const teacher = dictionary.Nauczyciele.find(
          (x: any) => x.Id === item.IdPracownik,
        );

        const hour = dictionary.PoryLekcji.find(
          (x: any) => x.Id === item.IdPoraLekcji,
        );

        const start = new Date(`${item.DzienTekst} ${hour.PoczatekTekst}:00`);
        const end = new Date(`${item.DzienTekst} ${hour.KoniecTekst}:00`);

        const lesson: Lesson = {
          name: item.PrzedmiotNazwa,
          order: item.NumerLekcji,
          room: item.Sala,
          teacher: {
            firstName: teacher.Imie,
            lastName: teacher.Nazwisko,
          },
          date: {
            start,
            end,
          },
          note: item.AdnotacjaOZmianie,
          isForPupil: item.PlanUcznia,
        };

        return lesson;
      });

      return timetable;
    } catch (e) {
      throw e;
    }
  }

  public async login(pin: string, token: string, symbol: string) {
    try {
      const code = token.substring(0, 3);
      const url = await getRestApiURL(code);

      const req = await getRequest({
        body: {
          PIN: parseInt(pin, 10),
          TokenKey: token,
          DeviceId: uuidv1(),
          DeviceName: 'uonet-api#uonet-api',
          DeviceNameUser: '',
          DeviceDescription: '',
          DeviceSystemType: 'Android',
          DeviceSystemVersion: '7.1.0',
          AppVersion: APP_VERSION,
        },
        headers: {
          RequestMobileType: 'RegisterDevice',
        },
        url: `${url}/${symbol}/mobile-api/Uczen.v3.UczenStart/Certyfikat`,
      });

      const cert = await axios(req);

      if (cert.data.IsError) {
        console.log(req.data);
        throw new Error('UONET+ certificate obtaining failed');
      }

      const { CertyfikatPfx, CertyfikatKlucz } = cert.data.TokenCert;

      const pupilList = await axios(
        await getRequest(
          {
            url: `${url}/${symbol}/mobile-api/Uczen.v3.UczenStart/ListaUczniow`,
          },
          {
            key: CertyfikatKlucz,
            pfx: CertyfikatPfx,
          },
        ),
      );

      pupilList.data.Data.forEach((pupil: UONETPupil) => {
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

        this.accounts.push(account);
      });
    } catch (err) {
      throw err;
    }
  }
}
