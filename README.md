# Singal Protocol Sample App

The Signal Protocol is a cryptographic protocol that provides end-to-end encryption for instant messaging and voice calls. This repository houses a simple node project to demonstrate how the Signal Protocol could be implemented. As per the actual specification / setup of the Signal Procotol, this project has both a ReactJS client and a simple server that connects to the clients via a websocket for message transfers.

Upon running `npm run start_all`, both a react client and the websocket server are spun up on `http://localhost:3000` and `ws://localhost:4030` respectively. 

> You can also expose both the client and the server to a local network by following the simple instructions [here](https://github.com/greffgreff/signal-protocol-app/blob/master/server/index.js#L10) and [here](https://github.com/greffgreff/signal-protocol-app/blob/master/src/App.jsx#L12).

![Screenshot 2023-04-09 at 11 22 50 am](https://user-images.githubusercontent.com/56337726/230773109-e7d56258-7b0a-40ae-a69a-3c73a421237d.jpg)
![Screenshot 2023-04-09 at 11 22 56 am](https://user-images.githubusercontent.com/56337726/230773111-df68560c-d360-4556-8beb-8392b89af6b7.jpg)

## What is it the Signal Protocol?

When you use a messaging app that supports the Signal Protocol, your messages are encrypted on your device before they are sent. This means that only the intended recipient can decrypt and read the message, and nobody else, including the app developer or the server that the message passes through, can access the content of the message.

The Signal Protocol uses a combination of symmetric and asymmetric encryption to achieve this level of security. When you start a conversation with someone, your device generates a set of keys that are used to encrypt and decrypt the messages. These keys are shared securely between the devices of the participants in the conversation. This mechanism is know as The Extended Triple Key Exchange Protocol or X3DH for short.

The Signal Protocol also provides features like forward secrecy and deniability. Forward secrecy means that even if an attacker were to obtain the encryption keys, they would not be able to decrypt previously sent messages. Deniability means that it is impossible to prove that a particular message was sent by a particular person, which can be useful in situations where privacy is important. To achieve this, the protocol uses a mechanism known as the Double Ratchet mechanism.

### X3DH

The Extended Triple Diffie-Hellman (or X3DH) algorithm is used to establish the initial shared secret key between two users, Alice and Bob, based on their public keys and using a server. Bob has already published some information on a server and Alice wants to establish a shared secret key with Bob in order to send him an encrypted message, while Bob is not online. Alice must therefore be able to perform the key exchange using simply the information stored on the server. The server can also be used to store messages by either of them until the other one can retrieve them.

To perform an X3DH key agreement with Bob, Alice contacts the server and fetches a "prekey bundle" containing the following values:

    Bob's public identity key IKB
    Bob's signed prekey SPKB
    Bob's prekey signature Sig(IKB, Encode(SPKB))
    Bob's one-time prekey OPKB
    
The server should provide one of Bob's one-time prekeys if one exists, and then delete it. If all of Bob's one-time prekeys on the server have been deleted, the bundle will not contain a one-time prekey.

Alice verifies the prekey signature and aborts the protocol if verification fails. Alice then generates an ephemeral key pair with public key EKA.

If the bundle does not contain a one-time prekey, she calculates:

    DH1 = DH(IKA, SPKB)
    DH2 = DH(EKA, IKB)
    DH3 = DH(EKA, SPKB)
    SK = KDF(DH1 || DH2 || DH3)

Where the KDF is a cryptographic function used to derive one or more secret keys from a shared secret or a master key. In our case, the KDF is a simple hashing function that uses the SHA-256 algorithm.

If the bundle does contain a one-time prekey, the calculation is modified to include an additional DH:

    DH4 = DH(EKA, OPKB)
    SK = KDF(DH1 || DH2 || DH3 || DH4)

Where SK is a shared key that the other party (Bob) should be able to derive on his end without Alice telling/sending it to him.

> Note that this sample application does not handle missing one-time prekey in the prekey bundle as described above. The server expects a one-time prekey in each bundle sent by users, in this case, Bob.

Visually, the following exchanges happen:

![X3DH](https://user-images.githubusercontent.com/56337726/230773137-80a5d31a-6e5a-4cda-8bf6-264657b10127.png)

After calculating SK, Alice deletes her ephemeral private key and the DH outputs. She then send a post-exchange key bundle to the server that Bob can retrieve at a later date to establish an identical SK. The post-exchange key bundle contains:

    Alice's public identity key IKA
    Alice's generated public ephemeral key EKA

After retreiving the post key bundle, Bob calculates the following:

    DH1 = DH(SPK, IK)
    DH2 = DH(IK, EK)
    DH3 = DH(SPK, EK)
    DH4 = DH(OPK, EK)
    
And like Alice computes a SK like so:

    SK = KDF(DH1 || DH2 || DH3 || DH4)

Note that a DH key pair exchanges (ex: `DH2 = DH(IK, EK)`) on their own do not mean anything. It is the combined set of results from DH key exchanges of various keys that provides security. For instance, the key exchange with the IK of both parties provides 'mutual authentication'. Should the IK of one party by forged or replaced by an outsider, the resulting shared secret will not match and encryption won't be established

### Double Ratchet

Once a SK has been established between two parties, various ratchets can be put in place to generate an encryption key for cihpering and deciphering messages between said parties.


## Implementation

### Clients

### Message passed through the server
```
{
  id: 'e306992c-335e-41db-a934-c13fbdd97a93',
  type: 'chat',
  text: {
    header: { counter: 4, date: '2023-04-09T09:22:28.328Z' },
    ciphertext: 'd2ab4f3fa40574866e3f789cb50423004ab23ea45487ab4e9a82776cda5c5872bce54038ef4a8e34ac7d9a41a1dd7ecd'
  },
  to: { id: '496a9e00-bfeb-4d43-87d0-105a6a34e8f1', username: 'Bob' },
  from: { id: 'ebc44f87-f289-4498-898f-056fa3470178', username: 'Alice' },
  date: '2023-04-09T09:22:28.324Z'
}
```

## Works cited

[signal specification of the x3dh](https://signal.org/docs/specifications/x3dh/)

[singal specification of the double ratchet](https://signal.org/docs/specifications/doubleratchet/)

[python implementation](https://nfil.dev/coding/encryption/python/double-ratchet-example/)

[protocol as implemented by whatsapp](https://www.dinosec.com/docs/WhatsApp_E2E_Encryption_2019_SANS-DinoSec-RaulSiles_v1.0.pdf)
