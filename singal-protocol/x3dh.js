const crypto = require("crypto");
const { v4: uuid } = require("uuid");

class X3DH {
  constructor({ identityKeys, signedPreKeys, oneTimePreKeys, outstandingExchanges }) {
    this.ecdh = crypto.createECDH("secp256k1");
    this.identityKeys = identityKeys;
    this.signedPreKeys = signedPreKeys;
    this.oneTimePreKeys = oneTimePreKeys;
    this.signature = null; // TODO create sig
    this.outstandingExchanges = outstandingExchanges;
  }

  static createDefault(numOneTimePreKeys = 10) {
    const identityKeys = X3DH.generateKeyPairs();
    const signedPreKeys = X3DH.generateKeyPairs();
    const oneTimePreKeys = new Array(numOneTimePreKeys).fill(null).map(X3DH.generateKeyPairs);
    return new X3DH({ identityKeys, signedPreKeys, oneTimePreKeys, outstandingExchanges: [] });
  }

  static generateKeyPairs() {
    const ecdh = crypto.createECDH("secp256k1");
    ecdh.generateKeys();
    return {
      privateKey: ecdh.getPrivateKey("hex"),
      publicKey: ecdh.getPublicKey("hex"),
    };
  }

  diffieHellman(localPrivate, remotePublic) {
    this.ecdh.setPrivateKey(localPrivate, "hex");
    return this.ecdh.computeSecret(remotePublic, "hex");
  }

  exchange({ id, signedPreKey, identityKey, oneTimePreKey, signature }) {
    // TODO verify signature beforehand
    const ephemeralKeys = X3DH.generateKeyPairs();
    // DH1 = DH(IK, SPK)
    const DH1 = this.diffieHellman(this.identityKeys.privateKey, signedPreKey);
    // DH2 = DH(EK, IK)
    const DH2 = this.diffieHellman(ephemeralKeys.privateKey, identityKey);
    // DH3 = DH(EK, SPK)
    const DH3 = this.diffieHellman(ephemeralKeys.privateKey, signedPreKey);
    // DH4 = DH(EK, OPK)
    const DH4 = this.diffieHellman(ephemeralKeys.privateKey, oneTimePreKey);
    // Combine computed secrets of exchanges
    const combinedKeys = Buffer.concat([DH1, DH2, DH3, DH4]);
    // Compute the secret of the shared secrets
    const sharedSecret = crypto.createHash("sha256").update(combinedKeys).digest("hex");
    return {
      id,
      identityKey: this.identityKeys.publicKey,
      ephemeralKey: ephemeralKeys.publicKey,
      sharedSecret,
    };
  }

  postExchange({ id, identityKey, ephemeralKey }) {
    // DH1 = DH(SPK, IK)
    const DH1 = this.diffieHellman(this.signedPreKeys.privateKey, identityKey);
    // DH2 = DH(IK, EK)
    const DH2 = this.diffieHellman(this.identityKeys.privateKey, ephemeralKey);
    // DH3 = DH(SPK, EK)
    const DH3 = this.diffieHellman(this.signedPreKeys.privateKey, ephemeralKey);
    // DH4 = DH(OPK, EK)
    const bundle = this.getFromOutstandingExchanges(id);
    const DH4 = this.diffieHellman(bundle.oneTimePreKey, ephemeralKey);
    // Combine computed secrets of exchanges
    const combinedKeys = Buffer.concat([DH1, DH2, DH3, DH4]);
    // Compute the secret of the shared secrets
    const sharedSecret = crypto.createHash("sha256").update(combinedKeys).digest("hex");
    return { sharedSecret };
  }

  getFromOutstandingExchanges(id) {
    let i = this.outstandingExchanges.findIndex(e => e.id === id);
    return i !== -1 ? this.outstandingExchanges.splice(i, 1)[0] : null;
  }

  generateKeyBundle() {
    const oneTimePreKey = this.oneTimePreKeys.shift();
    const bundleRecord = {
      id: uuid(),
      oneTimePreKey: oneTimePreKey.privateKey,
    };
    this.outstandingExchanges.push(bundleRecord);
    return {
      id: bundleRecord.id,
      signedPreKey: this.signedPreKeys.publicKey,
      identityKey: this.identityKeys.publicKey,
      oneTimePreKey: oneTimePreKey.publicKey,
      signature: this.signature,
    };
  }

  static secretToReadable(sharedSecret) {
    return crypto
      .createHash("sha256")
      .update(sharedSecret)
      .digest("hex")
      .match(/.{1,4}/g)
      .map(h => parseInt(h, 16))
      .map(n => String(n).padStart(5, "0"));
  }
}

module.exports = { X3DH };
