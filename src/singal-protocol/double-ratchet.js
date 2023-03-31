import { createHash, createCipher, createDecipher } from "crypto-browserify";

function encrypt(plaintext, key) {
  const cipher = createCipher("aes-256-cbc", key);
  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  return (ciphertext += cipher.final("hex"));
}

function decrypt(ciphertext, key) {
  const decipher = createDecipher("aes-256-cbc", key);
  let plaintext = decipher.update(ciphertext, "hex", "utf8");
  return (plaintext += decipher.final("utf8"));
}

function kdf(input) {
  return createHash("sha256").update(input).digest("hex");
}

class Ratchet {
  constructor(key) {
    this.state = key;
  }

  next(prevChainKey = "") {
    const output = kdf(this.state + prevChainKey);
    this.state = kdf(output);
    const chainKey = output.slice(32, 64);
    const messageKey = output.slice(0, 32);
    return { chainKey, messageKey };
  }
}

class DoubleRatchet {
  constructor(rootKey, isInitiator = false) {
    this.rootRatchet = new Ratchet(rootKey);
    if (isInitiator) {
      this.sendingRatchet = new Ratchet(this.rootRatchet.next().chainKey);
      this.receivingRatchet = new Ratchet(this.rootRatchet.next().chainKey);
    } else {
      this.receivingRatchet = new Ratchet(this.rootRatchet.next().chainKey);
      this.sendingRatchet = new Ratchet(this.rootRatchet.next().chainKey);
    }
  }

  rotateSendingRatchet(chainKey) {
    this.sendingRatchet = new Ratchet(this.rootRatchet.next(chainKey).chainKey);
  }

  rotateReceivingRatchet(chainKey) {
    this.receivingRatchet = new Ratchet(this.rootRatchet.next(chainKey).chainKey);
  }

  send(message) {
    const { chainKey, messageKey } = this.sendingRatchet.next();
    this.rotateSendingRatchet(chainKey);
    const ciphertext = encrypt(message, messageKey);
    return ciphertext;
  }

  receive(ciphertext) {
    const { chainKey, messageKey } = this.receivingRatchet.next();
    this.rotateReceivingRatchet(chainKey);
    return { plaintext: decrypt(ciphertext, messageKey), ciphertext };
  }
}

export { DoubleRatchet };
