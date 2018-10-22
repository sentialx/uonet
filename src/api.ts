import axios from 'axios';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import { signContent } from './encryption';
import { time } from './utils';

const APP_VERSION = '18.4.1.388';

export const getURL = async (code: string) => {
  try {
    const urlList = await axios.get(
      'https://komponenty.vulcan.net.pl/UonetPlusMobile/RoutingRules.txt',
    );
    const urls = urlList.data.split(/\r\n/).map((e: string) => e.split(','));
    const url = urls.filter(
      (e: string[]) => e[0] === code.substring(0, 3),
    )[0][1];

    return url;
  } catch (err) {
    throw err;
  }
};

export const login = async (pin: number, token: string, symbol: string) => {
  try {
    const code = token.substring(0, 3);
    const url = await getURL(code);

    const cert = await axios({
      url: `${url}/${symbol}/mobile-api/Uczen.v3.UczenStart/Certyfikat`,
      method: 'POST',
      data: {
        PIN: pin,
        TokenKey: token,
        AppVersion: APP_VERSION,
        DeviceId: uuidv1(),
        DeviceName: 'uonet-api#uonet-api',
        DeviceNameUser: '',
        DeviceDescription: '',
        DeviceSystemType: 'Android',
        DeviceSystemVersion: '7.1.0',
        RemoteMobileTimeKey: time(),
        TimeKey: time(),
        RequestId: uuidv4(),
        RemoteMobileAppVersion: APP_VERSION,
        RemoteMobileAppName: 'VULCAN-Android-ModulUcznia',
      },
      headers: {
        RequestMobileType: 'RegisterDevice',
        'User-Agent': 'MobileUserAgent',
        'Content-Type': 'application/json',
      },
    });

    if (cert.data.IsError) {
      throw new Error('UONET+ certificate obtaining failed');
    }

    const { CertyfikatPfx, CertyfikatKlucz } = cert.data.TokenCert;

    const pupilListPost = {
      RemoteMobileTimeKey: time(),
      TimeKey: time() - 1,
      RequestId: uuidv4(),
      RemoteMobileAppVersion: APP_VERSION,
      RemoteMobileAppName: 'VULCAN-Android-ModulUcznia',
    };

    const signatureValue = await signContent(
      JSON.stringify(pupilListPost),
      CertyfikatPfx,
      'CE75EA598C7743AD9B0B7328DED85B06',
    );

    const pupilList = await axios({
      url: `${url}/${symbol}/mobile-api/Uczen.v3.UczenStart/ListaUczniow`,
      method: 'POST',
      data: pupilListPost,
      headers: {
        RequestSignatureValue: signatureValue,
        RequestCertificateKey: CertyfikatKlucz,
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'MobileUserAgent',
      },
    });

    return {
      symbol,
      code,
      certificatePfx: CertyfikatPfx,
      certificateKey: CertyfikatKlucz,
      pupilList: pupilList.data.Data,
    };
  } catch (err) {
    throw err;
  }
};

export const request = async (
  code: string,
  symbol: string,
  schoolSymbol: string,
  certKey: string,
  certPfx: string,
  method: string,
  postData: any,
) => {
  try {
    const sig = await signContent(
      JSON.stringify(postData),
      certPfx,
      'CE75EA598C7743AD9B0B7328DED85B06',
    );

    const res = await axios({
      data: postData,
      headers: {
        'User-Agent': 'MobileUserAgent',
        'Content-Type': 'application/json; charset=UTF-8',
        RequestCertificateKey: certKey,
        RequestSignatureValue: sig,
      },
      method: 'POST',
      url: `${await getURL(
        code,
      )}/${symbol}/${schoolSymbol}/mobile-api/Uczen.v3.Uczen/${method}`,
    });

    return res.data;
  } catch (e) {
    throw e;
  }
};
