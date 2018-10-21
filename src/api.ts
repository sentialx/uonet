import axios from 'axios';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import { signContent } from './encryption';

const time = () => {
  return new Date().getTime();
};

const APP_VERSION = '18.4.1.388';

export const login = async (pin: number, token: string, symbol: string) => {
  try {
    const urlList = await axios.get(
      'https://komponenty.vulcan.net.pl/UonetPlusMobile/RoutingRules.txt',
    );
    const urls = urlList.data.split(/\r\n/).map((e: string) => e.split(','));
    const url = urls.filter(
      (e: string[]) => e[0] === token.substring(0, 3),
    )[0][1];

    const cert = await axios({
      url: `${url}/${symbol}/mobile-api/Uczen.v3.UczenStart/Certyfikat`,
      method: 'POST',
      data: {
        PIN: pin,
        TokenKey: token,
        AppVersion: APP_VERSION,
        DeviceId: uuidv1(),
        DeviceName: 'uonet-api#$uonet-api',
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
      TimeKey: time(),
      RequestId: uuidv4(),
      RemoteMobileAppVersion: APP_VERSION,
      RemoteMobileAppName: 'VULCAN-Android-ModulUcznia',
    };

    const pupilList = await axios({
      url: `${url}/${symbol}/mobile-api/Uczen.v3.UczenStart/ListaUczniow`,
      method: 'POST',
      data: pupilListPost,
      headers: {
        RequestSignatureValue: await signContent(
          JSON.stringify(pupilListPost),
          CertyfikatPfx,
          CertyfikatKlucz,
        ),
        RequestCertificateKey: CertyfikatKlucz,
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'MobileUserAgent',
      },
    });

    return {
      symbol,
      certyfikatPfx: CertyfikatPfx,
      certyfikatKlucz: CertyfikatKlucz,
      listaUczniow: pupilList.data.Data,
    };
  } catch (err) {
    throw err;
  }
};
