# Singal Protocol Sample App

## Overview

The Signal Protocol is a cryptographic protocol that provides end-to-end encryption for instant messaging and voice calls. This repository houses a simple node project to demonstrate how the Signal Protocol could be implemented. As per the actual specification / setup of the Signal Procotol, this project has both a ReactJS client and a simple server that connects to the clients via a websocket for message transfers.

Upon running `npm run start_all`, both a react client and the websocket server are spun up on `http://localhost:3000` and `ws://localhost:4030` respectively. 

> You can also expose both the client and the server to a local network by following the simple instructions [here](https://github.com/greffgreff/signal-protocol-app/blob/master/server/index.js#L10) and [here](https://github.com/greffgreff/signal-protocol-app/blob/master/src/App.jsx#L12).

# What is it the Signal Protocol?

When you use a messaging app that supports the Signal Protocol, your messages are encrypted on your device before they are sent. This means that only the intended recipient can decrypt and read the message, and nobody else, including the app developer or the server that the message passes through, can access the content of the message.

The Signal Protocol uses a combination of symmetric and asymmetric encryption to achieve this level of security. When you start a conversation with someone, your device generates a set of keys that are used to encrypt and decrypt the messages. These keys are shared securely between the devices of the participants in the conversation. This mechanism is know as The Extended Triple Key Exchange Protocol or X3DH for short.

The Signal Protocol also provides features like forward secrecy and deniability. Forward secrecy means that even if an attacker were to obtain the encryption keys, they would not be able to decrypt previously sent messages. Deniability means that it is impossible to prove that a particular message was sent by a particular person, which can be useful in situations where privacy is important. To achieve this, the protocol uses a mechanism known as the Double Ratchet mechanism.

# X3DH

[x3dh](https://signal.org/docs/specifications/x3dh/)

# Double Ratchet

[double ratchet](https://signal.org/docs/specifications/doubleratchet/)

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


