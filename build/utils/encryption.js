"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_forge_1 = __importDefault(require("node-forge"));
// tslint:disable-next-line
const Crypto = require("node-webcrypto-ossl");
const crypto = new Crypto();
function signContent(content, certificate, password) {
    const p12Der = node_forge_1.default.util.decode64(certificate);
    const p12Asn1 = node_forge_1.default.asn1.fromDer(p12Der);
    const pkcs12 = node_forge_1.default.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
    return importCryptoKeyPkcs8(loadPrivateKey(pkcs12), true).then((cryptoKey) => crypto.subtle
        .sign('RSASSA-PKCS1-v1_5', cryptoKey, stringToArrayBuffer(content))
        .then((signature) => {
        return node_forge_1.default.util.encode64(arrayBufferToString(signature));
    }));
}
exports.signContent = signContent;
function arrayBufferToString(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    return binary;
}
function privateKeyToPkcs8(privateKey) {
    // @ts-ignore
    const rsaPrivateKey = node_forge_1.default.pki.privateKeyToAsn1(privateKey);
    // @ts-ignore
    const privateKeyInfo = node_forge_1.default.pki.wrapRsaPrivateKey(rsaPrivateKey);
    const privateKeyInfoDer = node_forge_1.default.asn1.toDer(privateKeyInfo).getBytes();
    return stringToArrayBuffer(privateKeyInfoDer);
}
function stringToArrayBuffer(data) {
    const arrBuff = new ArrayBuffer(data.length);
    const writer = new Uint8Array(arrBuff);
    for (let i = 0, len = data.length; i < len; i += 1) {
        writer[i] = data.charCodeAt(i);
    }
    return arrBuff;
}
function loadPrivateKey(pkcs12) {
    // load keypair and cert chain from safe content(s)
    for (let sci = 0; sci < pkcs12.safeContents.length; sci += 1) {
        const safeContents = pkcs12.safeContents[sci];
        for (let sbi = 0; sbi < safeContents.safeBags.length; sbi += 1) {
            const safeBag = safeContents.safeBags[sbi];
            // this bag has a private key
            if (safeBag.type === node_forge_1.default.pki.oids.keyBag) {
                // Found plain private key
                return safeBag.key;
            }
            if (safeBag.type === node_forge_1.default.pki.oids.pkcs8ShroudedKeyBag) {
                // found encrypted private key
                return safeBag.key;
            }
            if (safeBag.type === node_forge_1.default.pki.oids.certBag) {
                // this bag has a certificate...
            }
        }
    }
}
function importCryptoKeyPkcs8(privateKey, extractable) {
    const privateKeyInfoDerBuff = privateKeyToPkcs8(privateKey);
    // Import the webcrypto key
    return crypto.subtle.importKey('pkcs8', privateKeyInfoDerBuff, {
        name: 'RSASSA-PKCS1-v1_5',
        hash: {
            name: 'SHA-1',
        },
    }, extractable, ['sign']);
}
