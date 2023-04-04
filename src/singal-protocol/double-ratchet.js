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
    this.next = this.next.bind(this);
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
    this.messageCounter = 0;
    this.latestMessageDate = new Date();
    if (isInitiator) {
      this.sendingRatchet = new Ratchet(this.rootRatchet.next().chainKey);
      this.receivingRatchet = new Ratchet(this.rootRatchet.next().chainKey);
    } else {
      this.receivingRatchet = new Ratchet(this.rootRatchet.next().chainKey);
      this.sendingRatchet = new Ratchet(this.rootRatchet.next().chainKey);
    }

    this.rotateSendingRatchet = this.rotateSendingRatchet.bind(this);
    this.rotateReceivingRatchet = this.rotateReceivingRatchet.bind(this);
    this.send = this.send.bind(this);
    this.receive = this.receive.bind(this);
  }

  rotateSendingRatchet(chainKey) {
    this.sendingRatchet = new Ratchet(this.rootRatchet.next(chainKey).chainKey);
  }

  rotateReceivingRatchet(chainKey) {
    this.receivingRatchet = new Ratchet(this.rootRatchet.next(chainKey).chainKey);
  }

  send(plaintext) {
    const { chainKey, messageKey } = this.sendingRatchet.next();
    this.rotateSendingRatchet(chainKey);
    const ciphertext = encrypt(plaintext, messageKey);
    this.messageCounter++;
    this.latestMessageDate = new Date();
    return {
      header: {
        counter: this.messageCounter,
        date: this.latestMessageDate,
      },
      ciphertext,
    };
  }

  receive({ header: { counter, date }, ciphertext }) {
    if (counter <= this.messageCounter) return;
    if (date <= this.latestMessageDate) return;
    const { chainKey, messageKey } = this.receivingRatchet.next();
    this.rotateReceivingRatchet(chainKey);
    const plaintext = decrypt(ciphertext, messageKey);
    this.messageCounter++;
    return {
      header: {
        counter,
        date,
      },
      plaintext,
      ciphertext,
    };
  }
}

export { DoubleRatchet };
