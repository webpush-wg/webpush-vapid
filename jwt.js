base64 = x => btoa(String.fromCharCode.apply(null, new Uint8Array(x)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/={1,2}$/,'');

var UTF8 = {
  _encoder: new TextEncoder("utf-8"),
  encode(x) { return this._encoder.encode(x); },
  _decoder: new TextDecoder("utf-8"),
  decode(x) { return this._decoder.decode(x); }
};

jenc = x => base64(UTF8.encode(JSON.stringify(x)));
var jwtHeader = {
  "typ": "JWT",
  "alg": "ES256"
};
console.log('header', JSON.stringify(jwtHeader));

var jwtBody = {
  "aud": "https://push.example.net",
  "exp": Math.floor(Date.now() / 1000) + 60*60*24,
  "sub": "mailto:push@example.com"
};
console.log('header', JSON.stringify(jwtBody));

crypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, false, ['sign'])
  .then(k => {
    crypto.subtle.exportKey('raw', k.publicKey)
      .then(p => console.log('Crypto-Key: p256ecdsa=' + base64(p)));
    crypto.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, k.privateKey,
                       UTF8.encode(jenc(jwtHeader) + '.' + jenc(jwtBody)))
      .then(sig => console.log('Authorization: WebPush ' + jenc(jwtHeader) + '.' + jenc(jwtBody) + '.' + base64(sig)));
  });
