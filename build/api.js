"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const requests_1 = require("./utils/requests");
const constants_1 = require("./constants");
class UONET {
    constructor() {
        this.accounts = [];
    }
    async request(accountId, body, method) {
        try {
            const account = this.accounts.find(x => x.id === accountId);
            if (!account) {
                throw new Error("Couldn't find the account with given ID.");
            }
            const url = `${account.baseURL}/mobile-api/Uczen.v3.Uczen/${method}`;
            const req = await requests_1.getRequest({
                body,
                url,
            }, {
                key: account.certificate.key,
                pfx: account.certificate.pfx,
            });
            const res = await axios_1.default(req);
            return res.data;
        }
        catch (e) {
            throw e;
        }
    }
    async getTimetable(accountId, from, to) {
        try {
            const account = this.accounts.find(x => x.id === accountId);
            let data = (await this.request(accountId, {
                IdOkresKlasyfikacyjny: account.periodId,
                IdUczen: account.id,
                IdOddzial: account.branchId,
                DataPoczatkowa: from,
                DataKoncowa: to,
            }, 'PlanLekcjiZeZmianami')).Data;
            const dictionary = (await this.request(accountId, {}, 'Slowniki')).Data;
            data = data.sort((a, b) => {
                return a.NumerLekcji - b.NumerLekcji;
            });
            const timetable = data.map(item => {
                const teacher = dictionary.Nauczyciele.find((x) => x.Id === item.IdPracownik);
                const hour = dictionary.PoryLekcji.find((x) => x.Id === item.IdPoraLekcji);
                const start = new Date(`${item.DzienTekst} ${hour.PoczatekTekst}:00`);
                const end = new Date(`${item.DzienTekst} ${hour.KoniecTekst}:00`);
                const lesson = {
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
        }
        catch (e) {
            throw e;
        }
    }
    async login(pin, token, symbol) {
        try {
            const code = token.substring(0, 3);
            const url = await requests_1.getRestApiURL(code);
            const req = await requests_1.getRequest({
                body: {
                    PIN: parseInt(pin, 10),
                    TokenKey: token,
                    DeviceId: uuid_1.v1(),
                    DeviceName: 'uonet-api#uonet-api',
                    DeviceNameUser: '',
                    DeviceDescription: '',
                    DeviceSystemType: 'Android',
                    DeviceSystemVersion: '7.1.0',
                    AppVersion: constants_1.APP_VERSION,
                },
                headers: {
                    RequestMobileType: 'RegisterDevice',
                },
                url: `${url}/${symbol}/mobile-api/Uczen.v3.UczenStart/Certyfikat`,
            });
            const cert = await axios_1.default(req);
            if (cert.data.IsError) {
                console.log(req.data);
                throw new Error('UONET+ certificate obtaining failed');
            }
            const { CertyfikatPfx, CertyfikatKlucz } = cert.data.TokenCert;
            const pupilList = await axios_1.default(await requests_1.getRequest({
                url: `${url}/${symbol}/mobile-api/Uczen.v3.UczenStart/ListaUczniow`,
            }, {
                key: CertyfikatKlucz,
                pfx: CertyfikatPfx,
            }));
            pupilList.data.Data.forEach((pupil) => {
                const account = {
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
        }
        catch (err) {
            throw err;
        }
    }
}
exports.UONET = UONET;
