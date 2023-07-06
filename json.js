"use strict";

const XJSON = (() => {
    class XJSON {

        static #instance = XJSON.#create();

        static get instance() {
            return XJSON.#instance;
        }

        constructor() {
            throw new TypeError();
        }

        static parse(s) {
            testType(s, STRING);
            return XJSON.#instance(s);
        }

        static #create() {

            const anyChar = productions.anyChar;
            const literal = productions.literal;
            const bof = productions.bof;
            const eof = productions.eof;
            const empty = productions.empty;
            const star = productions.star;
            const plus = productions.plus;
            const opt = productions.opt;
            const sequence = productions.sequence;
            const choice = productions.choice;
            const has = productions.has;
            const hasNot = productions.hasNot;
            const alternation = productions.alternation;
            const xform = productions.xform;
            const test = productions.test;

            const hex = choice("hex", [
                xform("0", literal("0"), z =>  0),
                xform("1", literal("1"), z =>  1),
                xform("2", literal("2"), z =>  2),
                xform("3", literal("3"), z =>  3),
                xform("4", literal("4"), z =>  4),
                xform("5", literal("5"), z =>  5),
                xform("6", literal("6"), z =>  6),
                xform("7", literal("7"), z =>  7),
                xform("8", literal("8"), z =>  8),
                xform("9", literal("9"), z =>  9),

                xform("a", literal("a"), z => 10),
                xform("b", literal("b"), z => 11),
                xform("c", literal("c"), z => 12),
                xform("d", literal("d"), z => 13),
                xform("e", literal("e"), z => 14),
                xform("f", literal("f"), z => 15),

                xform("A", literal("A"), z => 10),
                xform("B", literal("B"), z => 11),
                xform("C", literal("C"), z => 12),
                xform("D", literal("D"), z => 13),
                xform("E", literal("E"), z => 14),
                xform("F", literal("F"), z => 15)
            ]);

            const digit19 = choice("digit1-9", [
                xform("1", literal("1"), z => 1n),
                xform("2", literal("2"), z => 2n),
                xform("3", literal("3"), z => 3n),
                xform("4", literal("4"), z => 4n),
                xform("5", literal("5"), z => 5n),
                xform("6", literal("6"), z => 6n),
                xform("7", literal("7"), z => 7n),
                xform("8", literal("8"), z => 8n),
                xform("9", literal("9"), z => 9n)
            ]);

            const digit0 = xform("0", literal("0"), z => 0n);

            const digit09 = choice("digit0-9", [
                digit0,
                xform("1", literal("1"), z => 1n),
                xform("2", literal("2"), z => 2n),
                xform("3", literal("3"), z => 3n),
                xform("4", literal("4"), z => 4n),
                xform("5", literal("5"), z => 5n),
                xform("6", literal("6"), z => 6n),
                xform("7", literal("7"), z => 7n),
                xform("8", literal("8"), z => 8n),
                xform("9", literal("9"), z => 9n)
            ]);

            const uescape = xform(
                "Unicode escape",
                sequence("Unicode escape sequence", [literal("u"), hex, hex, hex, hex]),
                z => String.fromCodePoint(z[1] * 16 ** 3 + z[2] * 16 ** 2 + z[3] * 16 + z[4])
            );

            const escapeCodes = choice("Escape code", [
                literal('"'),
                literal("\\"),
                literal("/"),
                xform("backspace"      , literal("b"), z => "\b"),
                xform("form feed"      , literal("f"), z => "\f"),
                xform("new line"       , literal("n"), z => "\n"),
                xform("carriage return", literal("r"), z => "\r"),
                xform("tab"            , literal("t"), z => "\t"),
                uescape
            ]);

            const escape = xform("Escaped char", sequence("Escape sequence", [literal("\\"), escapeCodes]), z => z[1]);

            const valid = test("Plain string char", anyChar, z => z !== '"' && z !== "\\" && z.codePointAt(0) >= 32);

            const strChar = choice("Any string char", [valid, escape]);

            const strContent = xform("String content", star(strChar), z => z.join(""));
            const strQuoted = sequence("Quoted string", [literal('"'), strContent, literal('"')]);
            const str = xform("String", strQuoted, z => z[1]);

            function fold(z) {
                return [z.reduce((a, v) => 10n * a + v, 0n), z.length];
            }

            const digits = xform("digits", plus(digit09), fold);
            const nonZero = xform("digits-ok", sequence(">= 1", [digit19, star(digit09)]), z => fold([z[0], ...z[1]]));
            const num = choice("number", [xform("0", digit0, z => [0n, 1]), nonZero]);
            const signal = xform("signal", opt(choice("+/-", [literal("+"), literal("-")])), z => z === "-" ? -1n : 1n);
            const signed = xform("signed number", sequence("signal and number", [signal, num]), z => z[0] * z[1][0]);
            const exponent = xform("exponent", sequence("expoent literal", [choice("E", [literal("e"), literal("E")]), signed]), z => z[1]);
            const frac = xform("seq", sequence("fractional part", [literal("."), star(digit09)]), z => fold(z[1]));

            function makeNumber(z) {
                const [a, b, c] = z;
                if (b === empty && c === empty) return a;
                if (b === empty) return c < 0 ? parseFloat(a + "e" + c) : a * 10n ** c;
                if (c === empty) return parseFloat(a + "." + b);
                return parseFloat(a + "." + b) * 10 ** Number(c);
            }

            const fullNumber = xform("full number", sequence("full number parts", [signed, opt(frac), opt(exponent)]), makeNumber);

            const lineBreak = choice("line break", [literal("\r"), literal("\n")]);
            const notLineBreak = sequence("not line break", [hasNot(lineBreak), anyChar]);
            const notStar = sequence("not */", [hasNot(literal("*/")), anyChar]);

            const comment1 = sequence("/* comment */", [literal("/*"), star(notStar     ), literal("*/")]);
            const comment2 = sequence("// comment"   , [literal("//"), star(notLineBreak), lineBreak    ]);

            const wsx = choice("whitespace", [literal(" "), literal("\n"), literal("\r"), literal("\t")]);
            const ignored = choice("ignored", [comment1, comment2, wsx]);
            const ws = star(ignored);

            const pTrue  = xform("true" , literal("true" ), z => true );
            const pFalse = xform("false", literal("false"), z => false);
            const pNull  = xform("null" , literal("null" ), z => null );

            const obj = new LateBound(), arr = new LateBound();

            const possibleValue = choice("value", [str, fullNumber, pTrue, pFalse, pNull, obj, arr]);
            const value = xform("value"    , sequence("value with ws"    , [ws , possibleValue, ws  ]), z => z[1]        );
            const key   = xform("key"      , sequence("key with ws"      , [ws , str         , ws   ]), z => z[1]        );
            const kv    = xform("key-value", sequence("key-value with ws", [key, literal(":"), value]), z => [z[0], z[2]]);

            const comma = sequence("comma", [ws, literal(","), ws]);

            function commas(n, x) {
                return xform(n, alternation(x, comma), z => z[0]);
            }

            function makeObj(pairs) {
                const x = {};
                for (const p of pairs) {
                    x[p[0]] = p[1];
                }
                return x;
            }

            obj.inner = xform("object", sequence("object with curly" , [literal("{"), commas("object properties", kv   ), literal("}")]), z => makeObj(z[1]));
            arr.inner = xform("list"  , sequence("list with brackets", [literal("["), commas("list items"       , value), literal("]")]), z => z[1]);

            const root = xform("json", sequence("json sequence", [bof, value, eof]), z => z[1]);

            return function parse(txt) {
                testType(txt, STRING);
                const s = Source.forString(txt);
                const pos = s.at(0);
                const result = root.parse(pos);
                return result.content;
            };
        }
    }

    return XJSON;
})();