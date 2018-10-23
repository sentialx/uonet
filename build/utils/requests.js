"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../constants");
const time_1 = require("./time");
const encryption_1 = require("./encryption");
exports.getRestApiURL = async (code) => {
    try {
        const urlList = await axios_1.default.get('https://komponenty.vulcan.net.pl/UonetPlusMobile/RoutingRules.txt');
        const urls = urlList.data.split(/\r\n/).map((e) => e.split(','));
        const url = urls.filter((e) => e[0] === code.substring(0, 3))[0][1];
        return url;
    }
    catch (err) {
        throw err;
    }
};
exports.getRequest = async (data, certificate = null) => {
    try {
        const requestBase = {
            data: {
                ...data.body,
                RemoteMobileTimeKey: time_1.getTimestamp(),
                TimeKey: time_1.getTimestamp() - 1,
                RequestId: uuid_1.v4(),
                RemoteMobileAppVersion: constants_1.APP_VERSION,
                RemoteMobileAppName: constants_1.APP_NAME,
            },
            headers: {
                ...data.headers,
                'User-Agent': 'MobileUserAgent',
                'Content-Type': 'application/json; charset=UTF-8',
            },
            url: data.url,
            method: 'POST',
        };
        if (certificate) {
            requestBase.headers.RequestCertificateKey = certificate.key;
            requestBase.headers.RequestSignatureValue = await encryption_1.signContent(JSON.stringify(requestBase.data), certificate.pfx, constants_1.PASSWORD);
        }
        return requestBase;
    }
    catch (e) {
        throw e;
    }
};
