"use strict";

// Check if those were correctly imported.
INT; FLOAT; BOOLEAN; FUNCTION; BIGINT; UNDEFINED; NULL; NAN; STRING; INFINITY; ANY; typeName; getType; orType; testType; [].checkFinal; [].checkAbstract;
UnicodeTable;
Source; ParsePosition; Parsed; ParseError; ParseContext; Memory; Production; LateBound; Trace; ProductionFactory;

const XJSON = (() => {
    class ParseFlags {
        #allowComments;
        #allowSingleQuoteEscapes;
        #allowSingleQuotedStrings;
        #allowES2015Escapes;
        #allowUnquotedKeys;
        #allowFinishingCommas;

        constructor(allowComments, allowSingleQuoteEscapes, allowSingleQuotedStrings, allowES2015Escapes, allowUnquotedKeys, allowFinishingCommas) {
            testType(allowComments           , BOOLEAN);
            testType(allowSingleQuoteEscapes , BOOLEAN);
            testType(allowSingleQuotedStrings, BOOLEAN);
            testType(allowES2015Escapes      , BOOLEAN);
            testType(allowUnquotedKeys       , BOOLEAN);
            testType(allowFinishingCommas    , BOOLEAN);

            this.#allowComments            = allowComments           ;
            this.#allowSingleQuoteEscapes  = allowSingleQuoteEscapes ;
            this.#allowSingleQuotedStrings = allowSingleQuotedStrings;
            this.#allowES2015Escapes       = allowES2015Escapes      ;
            this.#allowUnquotedKeys        = allowUnquotedKeys       ;
            this.#allowFinishingCommas     = allowFinishingCommas    ;
        }

        get #params() {
            return [this.allowComments, this.allowSingleQuoteEscapes, this.allowSingleQuotedStrings, this.allowES2015Escapes, this.allowUnquotedKeys, this.allowFinishingCommas];
        }

        #fixParams(idx, val) {
            const p = this.#params;
            if (p[idx] === val) return this;
            p[idx] = val;
            return new ParseFlags(...p);
        }

        get allowComments           () { return this.#allowComments           ; }
        get allowSingleQuoteEscapes () { return this.#allowSingleQuoteEscapes ; }
        get allowSingleQuotedStrings() { return this.#allowSingleQuotedStrings; }
        get allowES2015Escapes      () { return this.#allowES2015Escapes      ; }
        get allowUnquotedKeys       () { return this.#allowUnquotedKeys       ; }
        get allowFinishingCommas    () { return this.#allowFinishingCommas    ; }

        get isStandard() {
            return !this.#params === [false, false, false, false, false, false];
        }

        get isJson5() {
            return !this.#params === [true, true, true, true, true, true];
        }

        get withAllowComments             () { return this.#fixParams(0, true ); }
        get withNoAllowComments           () { return this.#fixParams(0, false); }
        get withAllowSingleQuoteEscapes   () { return this.#fixParams(1, true ); }
        get withNoAllowSingleQuoteEscapes () { return this.#fixParams(1, false); }
        get withAllowSingleQuotedStrings  () { return this.#fixParams(2, true ); }
        get withNoAllowSingleQuotedStrings() { return this.#fixParams(2, false); }
        get withAllowES2015Escapes        () { return this.#fixParams(3, true ); }
        get withNoAllowES2015Escapes      () { return this.#fixParams(3, false); }
        get withAllowUnquotedKeys         () { return this.#fixParams(4, true ); }
        get withNoAllowUnquotedKeys       () { return this.#fixParams(4, false); }
        get withAllowFinishingCommas      () { return this.#fixParams(5, true ); }
        get withNoAllowFinishingCommas    () { return this.#fixParams(5, false); }
    }

    const standardFlags = new ParseFlags(false, false, false, false, false, false);
    const json5Flags    = new ParseFlags(true , true , true , true , true , true );

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

            const productions = new ProductionFactory();
            const anyChar     = productions.anyChar()  ;
            const bof         = productions.bof()      ;
            const eof         = productions.eof()      ;
            const empty       = productions.empty()    ;
            const literal     = productions.literal    ;
            const star        = productions.star       ;
            const plus        = productions.plus       ;
            const opt         = productions.opt        ;
            const sequence    = productions.sequence   ;
            const choice      = productions.choice     ;
            const has         = productions.has        ;
            const hasNot      = productions.hasNot     ;
            const alternation = productions.alternation;
            const regroup     = productions.regroup    ;
            const xform       = productions.xform      ;
            const test        = productions.test       ;
            const lateBound   = productions.lateBound  ;

            const hex = choice("Hex", [
                xform("0h", false, literal("0"), z =>  0),
                xform("1h", false, literal("1"), z =>  1),
                xform("2h", false, literal("2"), z =>  2),
                xform("3h", false, literal("3"), z =>  3),
                xform("4h", false, literal("4"), z =>  4),
                xform("5h", false, literal("5"), z =>  5),
                xform("6h", false, literal("6"), z =>  6),
                xform("7h", false, literal("7"), z =>  7),
                xform("8h", false, literal("8"), z =>  8),
                xform("9h", false, literal("9"), z =>  9),

                xform("ah", false, literal("a"), z => 10),
                xform("bh", false, literal("b"), z => 11),
                xform("ch", false, literal("c"), z => 12),
                xform("dh", false, literal("d"), z => 13),
                xform("eh", false, literal("e"), z => 14),
                xform("fh", false, literal("f"), z => 15),

                xform("Ah", false, literal("A"), z => 10),
                xform("Bh", false, literal("B"), z => 11),
                xform("Ch", false, literal("C"), z => 12),
                xform("Dh", false, literal("D"), z => 13),
                xform("Eh", false, literal("E"), z => 14),
                xform("Fh", false, literal("F"), z => 15)
            ]);

            const d0 = xform("0n", false, literal("0"), z => 0n);
            const d1 = xform("1n", false, literal("1"), z => 1n);
            const d2 = xform("2n", false, literal("2"), z => 2n);
            const d3 = xform("3n", false, literal("3"), z => 3n);
            const d4 = xform("4n", false, literal("4"), z => 4n);
            const d5 = xform("5n", false, literal("5"), z => 5n);
            const d6 = xform("6n", false, literal("6"), z => 6n);
            const d7 = xform("7n", false, literal("7"), z => 7n);
            const d8 = xform("8n", false, literal("8"), z => 8n);
            const d9 = xform("9n", false, literal("9"), z => 9n);
            const d19 = [d1, d2, d3, d4, d5, d6, d7, d8, d9];
            const d09 = [d0, ...d19];

            const digits19 = choice("Digit 1-9", d19);
            const digits09 = choice("Digit 0-9", d09);

            function hexJoin(chars) {
                testType(chars, [INT]);
                let out = 0;
                for (const c of chars) {
                    out *= 16;
                    out += c;
                }
                return out;
            }

            const escapedCharBmp = xform(
                "Unicode escape \\uXXXX",
                false,
                sequence("Unicode escape sequence \\uXXXX", [literal("u"), hex, hex, hex, hex]),
                z => String.fromCodePoint(hexJoin(z.slice(1)))
            );

            const joinedHex = test("Valid hex join", false, xform("Hex join", true, plus(hex), hexJoin), UnicodeTable.isUsableCodePoint);

            const escapedCharEs2015 = xform(
                "Unicode ES2015 escape \\u{X...}",
                false,
                sequence("Unicode escape sequence \\u{X...}", [literal("u"), literal("{"), joinedHex, literal("}")]),
                z => String.fromCodePoint(z[2])
            );

            const identifierEscapeCodeChoices = flags.allowES2015Escapes ? choice("Escape sequence in identifier", [escapedCharBmp, escapedCharEs2015]) : escapedCharBmp;
            const fullEscapeBmp = xform("Full escape in identifier", false, sequence("Full escape sequence \\uXXXX", [literal("\\"), identifierEscapeCodeChoices]), z => z[1]);

            const charPossiblyEscaped    = choice("Possibly escaped char", [fullEscapeBmp, anyChar]);
            const startIdentifierChar    = test("Starting identifier char"    , false, charPossiblyEscaped, UnicodeTable.isStartingIdentifierSymbol    );
            const continueIdentifierChar = test("Continuation identifier char", false, charPossiblyEscaped, UnicodeTable.isContinuationIdentifierSymbol);

            const identifier = xform(
                "Identifier",
                true,
                sequence("Identifier characters", [startIdentifierChar, star(continueIdentifierChar)]),
                z => {
                    testType(z, Array);
                    testType(z[0], STRING);
                    testType(z[1], [STRING]);
                    return [z[0], ...z[1]].join("");
                }
            );

            const escapeCodeChoices = [
                literal('"'),
                literal("\\"),
                literal("/"),
                xform("Backspace"      , false, literal("b"), z => "\b"),
                xform("Form feed"      , false, literal("f"), z => "\f"),
                xform("New line"       , false, literal("n"), z => "\n"),
                xform("Carriage return", false, literal("r"), z => "\r"),
                xform("Tab"            , false, literal("t"), z => "\t"),
                escapedCharBmp
            ];
            if (flags.allowSingleQuoteEscapes) escapeCodeChoices.push(literal("'"));
            if (flags.allowES2015Escapes     ) escapeCodeChoices.push(escapedCharEs2015);

            const escapeCodes = choice("Escape code", escapeCodeChoices);

            const escape = xform("Escaped char", false, sequence("Escape sequence", [literal("\\"), escapeCodes]), z => z[1]);

            const valid1 = test("Plain string char on single-quoted", false, anyChar, z => z !== "'" && z !== "\\" && !UnicodeTable.isControlSymbol(z));
            const valid2 = test("Plain string char on double-quoted", false, anyChar, z => z !== '"' && z !== "\\" && !UnicodeTable.isControlSymbol(z));

            const strChar1 = choice("Any string char on single-quoted", [valid1, escape]);
            const strChar2 = choice("Any string char on double-quoted", [valid2, escape]);

            const strContent1 = xform("String content on single-quoted", true, star(strChar1), z => z.join(""));
            const strContent2 = xform("String content on double-quoted", true, star(strChar2), z => z.join(""));

            const strQuoted1 = sequence("Single-quoted string", [literal("'"), strContent1, literal("'")]);
            const strQuoted2 = sequence("Double-quoted string", [literal('"'), strContent2, literal('"')]);
            const strQuotedChoices = flags.allowSingleQuotedStrings ? [strQuoted1, strQuoted2] : [strQuoted2];
            const strQuoted = choice("Quoted string", strQuotedChoices);

            const str = xform("String", false, strQuoted, z => z[1]);

            function fold(z) {
                testType(z, [BIGINT]);
                return [z.reduce((a, v) => 10n * a + v, 0n), z.length];
            }

            const digits = xform("Digits", true, plus(digits09), fold);
            const nonZero = xform("Digits-ok", true, sequence(">= 1", [digits19, star(digits09)]), z => fold([z[0], ...z[1]]));
            const num = choice("Number", [xform("Zero", false, d0, z => [0n, 1]), nonZero]);
            const signal = xform("Signal", false, opt(choice("+/-", [literal("+"), literal("-")])), z => z === "-" ? -1n : 1n);
            const signed = xform("Signed number", false, sequence("Signal and number", [signal, num]), z => z[0] * z[1][0]);
            const exponent = xform("Exponent", false, sequence("Exponent literal", [choice("E", [literal("e"), literal("E")]), signed]), z => z[1]);
            const frac = xform("Fraction", true, sequence("Fractional part", [literal("."), star(digits09)]), z => fold(z[1]));

            function makeNumber(z) {
                const [a, b, c] = z;
                if (b === empty && c === empty) return a;
                if (b === empty) return c < 0 ? parseFloat(a + "e" + c) : a * 10n ** c;
                if (c === empty) return parseFloat(a + "." + b);
                return parseFloat(a + "." + b) * 10 ** Number(c);
            }

            const fullNumber = xform("Full number", true, sequence("Full number parts", [signed, opt(frac), opt(exponent)]), makeNumber);

            const lineBreak = choice("Line break", [literal("\r"), literal("\n")]);
            const notLineBreak = sequence("Not a line break", [hasNot(lineBreak), anyChar]);
            const notStar = sequence("Not */", [hasNot(literal("*/")), anyChar]);

            const comment1 = sequence("/* comment */", [literal("/*"), star(notStar     ), literal("*/")]);
            const comment2 = sequence("// comment"   , [literal("//"), star(notLineBreak), lineBreak    ]);

            const wsx = choice("Whitespace", [literal(" "), literal("\n"), literal("\r"), literal("\t")]);
            const ignored = flags.allowComments ? choice("ignored", [comment1, comment2, wsx]) : wsx;
            const ws = star(ignored);

            const pTrue  = xform("Literal true" , false, literal("true" ), z => true );
            const pFalse = xform("Literal false", false, literal("false"), z => false);
            const pNull  = xform("Literal null" , false, literal("null" ), z => null );

            const obj = lateBound();
            const arr = lateBound();

            const keyName = flags.allowUnquotedKeys ? choice("Key without ws", [str, identifier]) : str;

            const possibleValue = choice("Value without ws", [str, fullNumber, pTrue, pFalse, pNull, obj.production, arr.production]);
            const value = xform("Value"    , false, sequence("Value with ws"    , [ws , possibleValue, ws   ]), z => z[1]);
            const key   = xform("Key"      , false, sequence("Key with ws"      , [ws , keyName      , ws   ]), z => z[1]);
            const kv    = xform("Key-value", false, sequence("Key-value with ws", [key, literal(":") , value]), z => [z[0], z[2]]);

            const comma = sequence("Comma", [ws, literal(","), ws]);

            function commas(n, x) {
                const alt = xform(n + " with alternating commas", false, alternation(x, comma), z => z[0]);
                const seq = sequence(n + " possibly with extra comma", [alt, opt(comma)])
                const fin = xform(n + " regardless of commas", false, seq, z => z[0]);
                return flags.allowFinishingCommas ? fin : alt;
            }

            function makeObj(z) {
                testType(z, Array);
                testType(z[1], Array);

                const pairs = z[1];
                const x = {};
                for (const p of pairs) {
                    testType(p[0], STRING);
                    x[p[0]] = p[1];
                }
                return x;
            }

            obj.inner = xform("Object", true , sequence("Object with curly" , [literal("{"), commas("Object properties", kv   ), literal("}")]), makeObj);
            arr.inner = xform("List"  , false, sequence("List with brackets", [literal("["), commas("List items"       , value), literal("]")]), z => z[1]);

            const root = xform("Json", false, sequence("Json sequence", [bof, value, eof]), z => z[1]);

            return function parse(txt) {
                testType(txt, STRING);
                const s = Source.forString(txt);
                const ctx = s.start();
                try {
                    const result = root.parse(ctx);
                    return result.content;
                } finally {
                    console.log(ctx.memo.deadStacks);
                }
            };
        }
    }

    return XJSON;
})();