"use strict";

// Check if those were correctly imported.
INT; FLOAT; BOOLEAN; FUNCTION; BIGINT; UNDEFINED; NULL; NAN; STRING; INFINITY; ANY; typeName; getType; orType; testType; [].checkFinal; [].checkAbstract;
isStartingIdentifierSymbol; isContinuationIdentifierSymbol;
Source; ParsePosition; Parsed; ParseError; ParseContext; Memory; Production; Literal; AnyChar; Bof; Eof; Empty; Sequence; Star; Choice; Has; HasNot; Xform; Test; LateBound; Memoized;
productions;

const XJSON = (() => {
    class ParseFlags {
        #allowComments;
        #allowSingleQuotedStrings;
        #allowExtraEscapes;
        #allowUnquotedKeys;
        #allowExtraCommas;

        constructor(allowComments, allowSingleQuotedStrings, allowExtraEscapes, allowUnquotedKeys, allowExtraCommas) {
            testType(allowComments, BOOLEAN);
            testType(allowSingleQuotedStrings, BOOLEAN);
            testType(allowExtraEscapes, BOOLEAN);
            testType(allowUnquotedKeys, BOOLEAN);
            testType(allowExtraCommas, BOOLEAN);
            this.#allowComments = allowComments;
            this.#allowSingleQuotedStrings = allowSingleQuotedStrings;
            this.#allowExtraEscapes = allowExtraEscapes;
            this.#allowUnquotedKeys = allowUnquotedKeys;
            this.#allowExtraCommas = allowExtraCommas;
        }

        get allowComments() {
            return this.#allowComments;
        }

        get allowSingleQuotedStrings() {
            return this.#allowSingleQuotedStrings;
        }

        get allowExtraEscapes() {
            return this.#allowExtraEscapes;
        }

        get allowUnquotedKeys() {
            return this.#allowUnquotedKeys;
        }

        get allowExtraCommas() {
            return this.#allowExtraCommas;
        }

        get isStandard() {
            return !this.allowComments && !this.allowSingleQuotedStrings && !this.allowExtraEscapes && !this.allowUnquotedKeys && !this.allowExtraCommas;
        }

        get isJson5() {
            return this.allowComments && this.allowSingleQuotedStrings && this.allowExtraEscapes && this.allowUnquotedKeys && this.allowExtraCommas;
        }

        get withComments() {
            return new ParseFlags(true, this.allowSingleQuotedStrings, this.allowExtraEscapes, this.allowUnquotedKeys, this.allowExtraCommas);
        }

        get withNoComments() {
            return new ParseFlags(false, this.allowSingleQuotedStrings, this.allowExtraEscapes, this.allowUnquotedKeys, this.allowExtraCommas);
        }

        get withSingleQuotedStrings() {
            return new ParseFlags(this.allowComments, true, this.allowExtraEscapes, this.allowUnquotedKeys, this.allowExtraCommas);
        }

        get withNoSingleQuotedStrings() {
            return new ParseFlags(this.allowComments, false, this.allowExtraEscapes, this.allowUnquotedKeys, this.allowExtraCommas);
        }

        get withExtraEscapes() {
            return new ParseFlags(this.allowComments, this.allowSingleQuotedStrings, true, this.allowUnquotedKeys, this.allowExtraCommas);
        }

        get withNoExtraEscapes() {
            return new ParseFlags(this.allowComments, this.allowSingleQuotedStrings, false, this.allowUnquotedKeys, this.allowExtraCommas);
        }

        get withUnquotedKeys() {
            return new ParseFlags(this.allowComments, this.allowSingleQuotedStrings, this.allowExtraEscapes, true, this.allowExtraCommas);
        }

        get withNoUnquotedKeys() {
            return new ParseFlags(this.allowComments, this.allowSingleQuotedStrings, this.allowExtraEscapes, false, this.allowExtraCommas);
        }

        get withAllowExtraCommas() {
            return new ParseFlags(this.allowComments, this.allowSingleQuotedStrings, this.allowExtraEscapes, this.allowUnquotedKeys, true);
        }

        get withNoAllowExtraCommas() {
            return new ParseFlags(this.allowComments, this.allowSingleQuotedStrings, this.allowExtraEscapes, this.allowUnquotedKeys, false);
        }
    }

    const standardFlags = new ParseFlags(false, false, false, false, false);
    const json5Flags = new ParseFlags(true, true, true, true, true);

    class XJSON {

        static #standard = XJSON.#create(standardFlags);
        static #json5 = XJSON.#create(json5Flags);

        static get standard() {
            return XJSON.#standard;
        }

        static get json5() {
            return XJSON.#json5;
        }

        static get standardFlags() {
            return standardFlags;
        }

        static get json5Flags() {
            return json5Flags;
        }

        constructor() {
            throw new TypeError();
        }

        static parser(flags) {
            testType(flags, ParseFlags);
            const x = (flags.isStandard ? XJSON.#standard : XJSON.#create(flags));
            return function(s) {
                testType(s, STRING);
                return x(s);
            }
        }

        static #create(flags) {
            testType(flags, ParseFlags);

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
            const regroup = productions.regroup;
            const xform = productions.xform;
            const test = productions.test;
            const memo = productions.memo;

            const hex = choice("Hex", [
                xform("0h", literal("0"), z =>  0),
                xform("1h", literal("1"), z =>  1),
                xform("2h", literal("2"), z =>  2),
                xform("3h", literal("3"), z =>  3),
                xform("4h", literal("4"), z =>  4),
                xform("5h", literal("5"), z =>  5),
                xform("6h", literal("6"), z =>  6),
                xform("7h", literal("7"), z =>  7),
                xform("8h", literal("8"), z =>  8),
                xform("9h", literal("9"), z =>  9),

                xform("ah", literal("a"), z => 10),
                xform("bh", literal("b"), z => 11),
                xform("ch", literal("c"), z => 12),
                xform("dh", literal("d"), z => 13),
                xform("eh", literal("e"), z => 14),
                xform("fh", literal("f"), z => 15),

                xform("Ah", literal("A"), z => 10),
                xform("Bh", literal("B"), z => 11),
                xform("Ch", literal("C"), z => 12),
                xform("Dh", literal("D"), z => 13),
                xform("Eh", literal("E"), z => 14),
                xform("Fh", literal("F"), z => 15)
            ]);

            const d0 = xform("0n", literal("0"), z => 0n);
            const d1 = xform("1n", literal("1"), z => 1n);
            const d2 = xform("2n", literal("2"), z => 2n);
            const d3 = xform("3n", literal("3"), z => 3n);
            const d4 = xform("4n", literal("4"), z => 4n);
            const d5 = xform("5n", literal("5"), z => 5n);
            const d6 = xform("6n", literal("6"), z => 6n);
            const d7 = xform("7n", literal("7"), z => 7n);
            const d8 = xform("8n", literal("8"), z => 8n);
            const d9 = xform("9n", literal("9"), z => 9n);
            const d19 = [d1, d2, d3, d4, d5, d6, d7, d8, d9];
            const d09 = [d0, ...d19];

            const digits19 = choice("Digit 1-9", d19);
            const digits09 = choice("Digit 0-9", d09);

            function hexJoin(chars) {
                let out = 0;
                for (const c in chars) {
                    out *= 16;
                    out += c;
                }
                return String.fromCodePoint(out);
            }

            const uescape1 = xform(
                "Unicode escape \\uXXXX",
                sequence("Unicode escape sequence \\uXXXX", [literal("u"), hex, hex, hex, hex]),
                z => hexJoin(z.slice(1))
            );

            const uescape2 = xform(
                "Unicode escape \\u{X...}",
                sequence("Unicode escape sequence \\u{X...}", [literal("u"), literal("{"), xform("Hex join", plus(hex), hexJoin), literal("}")]),
                z => z[2]
            );

            const escapedChar1 = xform("Unicode escape char \\uXXXX"  , uescape1, z => String.fromCodePoint(z));
            const escapedChar2 = xform("Unicode escape char \\u{X...}", uescape2, z => String.fromCodePoint(z));

            const charPossiblyEscaped    = choice("Possibly escaped char", flags.allowExtraEscapes ? [escapedChar1, escapedChar2, anyChar] : [escapedChar1, anyChar]);
            const startIdentifierChar    = test("Starting identifier char"    , charPossiblyEscaped, isStartingIdentifierSymbol    );
            const continueIdentifierChar = test("Continuation identifier char", charPossiblyEscaped, isContinuationIdentifierSymbol);

            const identifier = xform(
                "Identifier",
                sequence("Identifier characters", [startIdentifierChar, plus(continueIdentifierChar)]),
                z => [z[0], ...z[1]].join("")
            );

            const escapeCodeChoices = [
                literal('"'),
                literal("\\"),
                literal("/"),
                xform("Backspace"      , literal("b"), z => "\b"),
                xform("Form feed"      , literal("f"), z => "\f"),
                xform("New line"       , literal("n"), z => "\n"),
                xform("Carriage return", literal("r"), z => "\r"),
                xform("Tab"            , literal("t"), z => "\t"),
                uescape1
            ];
            if (flags.allowExtraEscapes       ) escapeCodeChoices.push(uescape2);
            if (flags.allowSingleQuotedStrings) escapeCodeChoices.push(literal("'"));

            const escapeCodes = choice("Escape code", escapeCodeChoices);

            const escape = xform("Escaped char", sequence("Escape sequence", [literal("\\"), escapeCodes]), z => z[1]);

            const valid = test("Plain string char", anyChar, z => z !== '"' && z !== "\\" && z.codePointAt(0) >= 32);

            const strChar = choice("Any string char", [valid, escape]);

            const strContent = xform("String content", star(strChar), z => z.join(""));
            const strQuoted2 = sequence("Double quoted string", [literal('"'), strContent, literal('"')]);
            const strQuotedChoices = [strQuoted2];
            if (flags.allowSingleQuotedStrings) {
                const strQuoted1 = sequence("Single quoted string", [literal("'"), strContent, literal("'")]);
                strQuotedChoices.push(strQuoted1);
            }
            const strQuoted = choice("Quoted string", strQuotedChoices);

            const str = xform("String", strQuoted, z => z[1]);

            function fold(z) {
                return [z.reduce((a, v) => 10n * a + v, 0n), z.length];
            }

            const digits = xform("Digits", plus(digits09), fold);
            const nonZero = xform("Digits-ok", sequence(">= 1", [digits19, star(digits09)]), z => fold([z[0], ...z[1]]));
            const num = choice("Number", [xform("Zero", d0, z => [0n, 1]), nonZero]);
            const signal = xform("Signal", opt(choice("+/-", [literal("+"), literal("-")])), z => z === "-" ? -1n : 1n);
            const signed = xform("Signed number", sequence("Signal and number", [signal, num]), z => z[0] * z[1][0]);
            const exponent = xform("Exponent", sequence("Exponent literal", [choice("E", [literal("e"), literal("E")]), signed]), z => z[1]);
            const frac = xform("Fraction", sequence("Fractional part", [literal("."), star(digits09)]), z => fold(z[1]));

            function makeNumber(z) {
                const [a, b, c] = z;
                if (b === empty && c === empty) return a;
                if (b === empty) return c < 0 ? parseFloat(a + "e" + c) : a * 10n ** c;
                if (c === empty) return parseFloat(a + "." + b);
                return parseFloat(a + "." + b) * 10 ** Number(c);
            }

            const fullNumber = xform("Full number", sequence("Full number parts", [signed, opt(frac), opt(exponent)]), makeNumber);

            const lineBreak = choice("Line break", [literal("\r"), literal("\n")]);
            const notLineBreak = sequence("Not a line break", [hasNot(lineBreak), anyChar]);
            const notStar = sequence("Not */", [hasNot(literal("*/")), anyChar]);

            const comment1 = sequence("/* comment */", [literal("/*"), star(notStar     ), literal("*/")]);
            const comment2 = sequence("// comment"   , [literal("//"), star(notLineBreak), lineBreak    ]);

            const wsx = choice("Whitespace", [literal(" "), literal("\n"), literal("\r"), literal("\t")]);
            const ignored = flags.allowComments ? choice("ignored", [comment1, comment2, wsx]) : wsx;
            const ws = star(ignored);

            const pTrue  = xform("Literal true" , literal("true" ), z => true );
            const pFalse = xform("Literal false", literal("false"), z => false);
            const pNull  = xform("Literal null" , literal("null" ), z => null );

            const obj = new LateBound();
            const arr = new LateBound();

            const keyName = choice("Key without ws", flags.allowUnquotedKeys ? [str, identifier] : [str]);

            const possibleValue = choice("Value without ws", [str, fullNumber, pTrue, pFalse, pNull, obj, arr]);
            const value = xform("Value"    , sequence("Value with ws"    , [ws , possibleValue, ws   ]), z => z[1]        );
            const key   = xform("Key"      , sequence("Key with ws"      , [ws , keyName      , ws   ]), z => z[1]        );
            const kv    = xform("Key-value", sequence("Key-value with ws", [key, literal(":") , value]), z => [z[0], z[2]]);

            const comma = sequence("Comma", [ws, literal(","), ws]);

            function commas(n, x) {
                return flags.allowExtraCommas
                        ? xform(n, regroup(n + " with commas", [x, comma]), z => z[0])
                        : xform(n, alternation(x, comma), z => z[0]);
            }

            function makeObj(pairs) {
                const x = {};
                for (const p of pairs) {
                    x[p[0]] = p[1];
                }
                return x;
            }

            obj.inner = xform("Object", sequence("Object with curly" , [literal("{"), commas("Object properties", kv   ), literal("}")]), z => makeObj(z[1]));
            arr.inner = xform("List"  , sequence("List with brackets", [literal("["), commas("List items"       , value), literal("]")]), z => z[1]);

            const root = xform("Json", sequence("Json sequence", [bof, value, eof]), z => z[1]);

            return function parse(txt) {
                testType(txt, STRING);
                const s = Source.forString(txt);
                const ctx = s.start();
                const result = root.parse(ctx);
                return result.content;
            };
        }
    }

    return XJSON;
})();