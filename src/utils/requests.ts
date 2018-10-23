import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

import { RequestBaseData, Certificate } from '../models';
import { APP_VERSION, PASSWORD, APP_NAME } from '../constants';
import { getTimestamp } from './time';
import { signContent } from './encryption';

export const getRestApiURL = async (code: string) => {
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

export const getRequest = async (
  data: RequestBaseData,
  certificate: Certificate = null,
) => {
  try {
    const requestBase = {
      data: {
        ...data.body,
        RemoteMobileTimeKey: getTimestamp(),
        TimeKey: getTimestamp() - 1,
        RequestId: uuidv4(),
        RemoteMobileAppVersion: APP_VERSION,
        RemoteMobileAppName: APP_NAME,
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

      requestBase.headers.RequestSignatureValue = await signContent(
        JSON.stringify(requestBase.data),
        certificate.pfx,
        PASSWORD,
      );
    }

    return requestBase;
  } catch (e) {
    throw e;
  }
};
