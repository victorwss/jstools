"use strict";

// Check if those were correctly imported.
Types;

const Converter = (() => {
    const testSignature = Types.testSignature;
    const STRING = Types.STRING;
    const BIGINT = Types.BIGINT;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    class Converter {

        constructor() {
            throw new Error();
        }

        static xorArrays(a, b) {
            testSignature([Uint8Array, Uint8Array], arguments);
            if (a.length !== b.length) throw new Error("O tamanho dos arrays a e b deveria ser o mesmo.");
            const c = [];
            for (let i = 0; i < a.length; i++) {
                c[i] = a[i] ^ b[i];
            }
            return Uint8Array(c);
        }

        static fromStringToBytes(text) {
            testSignature([STRING], arguments);
            return encoder.encode(text);
        }

        static fromBytesToBase64(bytes) {
            testSignature([Uint8Array], arguments);
            let out = "";
            let i;
            for (i = 0; i < bytes.length - bytes.length % 3; i += 3) {
                const a =                                bytes[i    ] >>> 2  ;
                const b = ((bytes[i    ] &  3) << 4) | ((bytes[i + 1] >>> 4));
                const c = ((bytes[i + 1] & 15) << 2) | ((bytes[i + 2] >>> 6));
                const d =   bytes[i + 2] & 63;
                out += alpha[a] + alpha[b] + alpha[c] + alpha[d];
            }
            if (i === bytes.length - 1) {
                const a =                                bytes[i    ] >>> 2  ;
                const b = ((bytes[i    ] &  3) << 4)                         ;
                out += alpha[a] + alpha[b] + "==";
            } else if (i === bytes.length - 2) {
                const a =                                bytes[i    ] >>> 2  ;
                const b = ((bytes[i    ] &  3) << 4) | ((bytes[i + 1] >>> 4));
                const c = ((bytes[i + 1] & 15) << 2)                         ;
                out += alpha[a] + alpha[b] + alpha[c] + "=";
            }
            return out;
        }

        static fromBytesToBigInt(bytes) {
            testSignature([Uint8Array], arguments);
            let out = 1n;
            for (const b of bytes) {
                out = out * 256n + b;
            }
            return out;
        }

        static fromStringToBase64(text) {
            testSignature([STRING], arguments);
            return Converter.fromBytesToBase64(Converter.fromStringToBytes(text));
        }

        static fromStringToBigInt(text) {
            testSignature([STRING], arguments);
            return Converter.fromBytesToBigInt(Converter.fromStringToBytes(text));
        }

        static fromBase64ToBytes(text) {
            testSignature([STRING], arguments);
            if (text.length % 4 !== 0) throw new Error("O parâmetro não é uma string Base-64 válida.");
            let p = 0;
            for (const c of text) {
                if (c === "=" ? p < text.length - 2 : !alpha.includes(c)) {
                    throw new Error(`O parâmetro não é uma string Base-64 válida.${c}[${p}] - ${text.length}.`);
                }
                p++;
            }
            const out = [];
            let i;
            for (let i = 0; i < text.length; i += 4) {
                const a =                           alpha.indexOf(text[i    ]);
                const b =                           alpha.indexOf(text[i + 1]);
                const c = text[i + 2] === "=" ? 0 : alpha.indexOf(text[i + 2]);
                const d = text[i + 3] === "=" ? 0 : alpha.indexOf(text[i + 3]);
                const x = ( a       << 2) | (b >>> 4);
                const y = ((b & 15) << 4) | (c >>> 2);
                const z = ((c &  3) << 6) |  d       ;
                out.push(x);
                if (text[i + 2] !== "=") out.push(y);
                if (text[i + 3] !== "=") out.push(z);
            }
            return new Uint8Array(out);
        }

        static fromBigIntToBytes(n) {
            testSignature([BIGINT], arguments);
            const out = [];
            while (n > 1n) {
                out.unshift(Number(n % 256n));
                n /= 256n;
            }
            if (n !== 1n) throw new Error("O bigint não é uma sequência de bytes bem formada.");
            return out;
        }

        static fromBytesToString(bytes) {
            testSignature([Uint8Array], arguments);
            return decoder.decode(bytes);
        }

        static fromBase64ToString(text) {
            testSignature([STRING], arguments);
            return Converter.fromBytesToString(Converter.fromBase64ToBytes(text));
        }

        static fromBigIntToString(text) {
            testSignature([STRING], arguments);
            return Converter.fromBytesToString(Converter.fromBigIntToBytes(text));
        }
    }
    Object.freeze(Converter.prototype);

    return Converter;
});