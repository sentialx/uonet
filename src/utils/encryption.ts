import forge from 'node-forge';
import Crypto from 'node-webcrypto-ossl';

const crypto = new Crypto();

export function signContent(
  content: string,
  certificate: string,
  password: string,
) {
  const p12Der = forge.util.decode64(certificate);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const pkcs12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

  return importCryptoKeyPkcs8(loadPrivateKey(pkcs12), true).then(
    (cryptoKey: any) =>
      crypto.subtle
        .sign('RSASSA-PKCS1-v1_5', cryptoKey, stringToArrayBuffer(content))
        .then((signature: ArrayBuffer) => {
          return forge.util.encode64(arrayBufferToString(signature));
        }),
  );
}

function arrayBufferToString(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

function privateKeyToPkcs8(privateKey: ArrayBuffer) {
  // @ts-ignore
  const rsaPrivateKey = forge.pki.privateKeyToAsn1(privateKey);
  // @ts-ignore
  const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);
  const privateKeyInfoDer = forge.asn1.toDer(privateKeyInfo).getBytes();
  return stringToArrayBuffer(privateKeyInfoDer);
}

function stringToArrayBuffer(data: string) {
  const arrBuff = new ArrayBuffer(data.length);
  const writer = new Uint8Array(arrBuff);
  for (let i = 0, len = data.length; i < len; i += 1) {
    writer[i] = data.charCodeAt(i);
  }

  return arrBuff;
}

function loadPrivateKey(pkcs12: forge.pkcs12.Pkcs12Pfx) {
  // load keypair and cert chain from safe content(s)
  for (let sci = 0; sci < pkcs12.safeContents.length; sci += 1) {
    const safeContents = pkcs12.safeContents[sci];

    for (let sbi = 0; sbi < safeContents.safeBags.length; sbi += 1) {
      const safeBag = safeContents.safeBags[sbi];

      // this bag has a private key
      if (safeBag.type === forge.pki.oids.keyBag) {
        // Found plain private key
        return safeBag.key;
      }
      if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
        // found encrypted private key
        return safeBag.key;
      }
      if (safeBag.type === forge.pki.oids.certBag) {
        // this bag has a certificate...
      }
    }
  }
}

function importCryptoKeyPkcs8(privateKey: ArrayBuffer, extractable: boolean) {
  const privateKeyInfoDerBuff = privateKeyToPkcs8(privateKey);

  // Import the webcrypto key
  return crypto.subtle.importKey(
    'pkcs8',
    privateKeyInfoDerBuff,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: {
        name: 'SHA-1',
      },
    },
    extractable,
    ['sign'],
  );
}
