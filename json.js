"use strict";

// Check if those were correctly imported.
INT; FLOAT; BOOLEAN; FUNCTION; BIGINT; UNDEFINED; NULL; NAN; STRING; INFINITY; ANY; typeName; getType; orType; testType; [].checkFinal; [].checkAbstract;
UnicodeTable;
Source; ParsePosition; Parsed; ParseError; ParseContext; Memory; Production; LateBound; Trace; ProductionFactory;

const [ParseFlags, XJSON] = (() => {
    class ParseFlags {
        static #standardFlagsValues = [false, 0, false, false, false, 1, false, false, true, true, true, true];
        static #json5FlagsValues    = [true , 3, true , true , true , 2, true , true , true, true, true, true];

        static #standardFlags = new ParseFlags(...ParseFlags.#standardFlagsValues);
        static #json5Flags    = new ParseFlags(...ParseFlags.#json5FlagsValues   );

        #allowComments;
        #allowExtraEscapes;
        #allowSingleQuotedStrings;
        #allowUnquotedKeys;
        #allowTrailingCommas;
        #allowWhitespace;
        #allowExtendedNumberNotation;
        #allowControlCharacters;
        #allowSurrogateCharacters;
        #allowPrivateUseCharacters;
        #allowNonCharacters;
        #useBigInts;

        constructor(
                allowComments,
                allowExtraEscapes,
                allowSingleQuotedStrings,
                allowUnquotedKeys,
                allowTrailingCommas,
                allowWhitespace,
                allowExtendedNumberNotation,
                allowControlCharacters,
                allowSurrogateCharacters,
                allowPrivateUseCharacters,
                allowNonCharacters,
                useBigInts
        ) {
            testType(allowComments              , BOOLEAN);
            testType(allowExtraEscapes          , INT    );
            testType(allowSingleQuotedStrings   , BOOLEAN);
            testType(allowUnquotedKeys          , BOOLEAN);
            testType(allowTrailingCommas        , BOOLEAN);
            testType(allowWhitespace            , INT    );
            testType(allowExtendedNumberNotation, BOOLEAN);
            testType(allowControlCharacters     , BOOLEAN);
            testType(allowSurrogateCharacters   , BOOLEAN);
            testType(allowPrivateUseCharacters  , BOOLEAN);
            testType(allowNonCharacters         , BOOLEAN);
            testType(useBigInts                 , BOOLEAN);

            this.#allowComments               = allowComments              ;
            this.#allowExtraEscapes           = allowExtraEscapes          ;
            this.#allowSingleQuotedStrings    = allowSingleQuotedStrings   ;
            this.#allowUnquotedKeys           = allowUnquotedKeys          ;
            this.#allowTrailingCommas         = allowTrailingCommas        ;
            this.#allowWhitespace             = allowWhitespace            ;
            this.#allowExtendedNumberNotation = allowExtendedNumberNotation;
            this.#allowControlCharacters      = allowControlCharacters     ;
            this.#allowSurrogateCharacters    = allowSurrogateCharacters   ;
            this.#allowPrivateUseCharacters   = allowPrivateUseCharacters  ;
            this.#allowNonCharacters          = allowNonCharacters         ;
            this.#useBigInts                  = useBigInts                 ;
            if (allowExtraEscapes < 0 || allowExtraEscapes > 3) throw new Error("allowExtraEscapes must be 0-3");
            if (allowWhitespace   < 0 || allowWhitespace   > 2) throw new Error("allowWhitespace must be 0-2");
        }

        get #params() {
            return [
                this.#allowComments,
                this.#allowExtraEscapes,
                this.#allowSingleQuotedStrings,
                this.#allowUnquotedKeys,
                this.#allowTrailingCommas,
                this.#allowWhitespace,
                this.#allowExtendedNumberNotation,
                this.#allowControlCharacters,
                this.#allowSurrogateCharacters,
                this.#allowPrivateUseCharacters,
                this.#allowNonCharacters,
                this.#useBigInts
            ];
        }

        #fixParams(idx, val) {
            const p = this.#params;
            if (p[idx] === val) return this;
            p[idx] = val;
            return new ParseFlags(...p);
        }

        get allowComments              () { return this.#allowComments              ; }
        get allowSingleQuoteEscapes    () { return this.#allowExtraEscapes >= 1     ; }
        get allowES2015Escapes         () { return this.#allowExtraEscapes >= 2     ; }
        get allowAllEscapes            () { return this.#allowExtraEscapes >= 3     ; }
        get allowSingleQuotedStrings   () { return this.#allowSingleQuotedStrings   ; }
        get allowUnquotedKeys          () { return this.#allowUnquotedKeys          ; }
        get allowTrailingCommas        () { return this.#allowTrailingCommas        ; }
        get allowAnsiWhitespace        () { return this.#allowWhitespace >= 1       ; }
        get allowUnicodeWhitespace     () { return this.#allowWhitespace >= 2       ; }
        get allowExtendedNumberNotation() { return this.#allowExtendedNumberNotation; }
        get allowControlCharacters     () { return this.#allowControlCharacters     ; }
        get allowSurrogateCharacters   () { return this.#allowSurrogateCharacters   ; }
        get allowPrivateUseCharacters  () { return this.#allowPrivateUseCharacters  ; }
        get allowNonCharacters         () { return this.#allowNonCharacters         ; }
        get useBigInts                 () { return this.#useBigInts                 ; }

        get allowAllCharacters         () { return this.#allowControlCharacters && this.#allowSurrogateCharacters && this.#allowPrivateUseCharacters && this.#allowNonCharacters; }

        get isStandard() {
            return !this.#params === ParseFlags.#standardFlagsValues;
        }

        get isJson5() {
            return !this.#params === ParseFlags.#json5FlagsValues;
        }

        get withAllowComments                () { return this.#fixParams( 0, true ); }
        get withNoAllowComments              () { return this.#fixParams( 0, false); }
        get withAllowAllEscapes              () { return this.#fixParams( 1, 3    ); }
        get withAllowES2015Escapes           () { return this.#fixParams( 1, 2    ); }
        get withAllowSingleQuoteEscapes      () { return this.#fixParams( 1, 1    ); }
        get withNoAllowExtraEscapes          () { return this.#fixParams( 1, 0    ); }
        get withAllowSingleQuotedStrings     () { return this.#fixParams( 2, true ); }
        get withNoAllowSingleQuotedStrings   () { return this.#fixParams( 2, false); }
        get withAllowUnquotedKeys            () { return this.#fixParams( 3, true ); }
        get withNoAllowUnquotedKeys          () { return this.#fixParams( 3, false); }
        get withAllowTrailingCommas          () { return this.#fixParams( 4, true ); }
        get withNoAllowTrailingCommas        () { return this.#fixParams( 4, false); }
        get withAllowUnicodeWhitespace       () { return this.#fixParams( 5, 2    ); }
        get withAllowAnsiWhitespace          () { return this.#fixParams( 5, 1    ); }
        get withNoAllowWhitespace            () { return this.#fixParams( 5, 0    ); }
        get withAllowExtendedNumberNotation  () { return this.#fixParams( 6, true ); }
        get withNoAllowExtendedNumberNotation() { return this.#fixParams( 6, false); }
        get withAllowControlCharacters       () { return this.#fixParams( 7, true ); }
        get withNoAllowControlCharacters     () { return this.#fixParams( 7, false); }
        get withAllowSurrogateCharacters     () { return this.#fixParams( 8, true ); }
        get withNoAllowSurrogateCharacters   () { return this.#fixParams( 8, false); }
        get withAllowPrivateUseCharacters    () { return this.#fixParams( 9, true ); }
        get withNoPrivateUseCharacters       () { return this.#fixParams( 9, false); }
        get withAllowNonCharacters           () { return this.#fixParams(10, true ); }
        get withNoNonCharacters              () { return this.#fixParams(10, false); }
        get withUseBigInts                   () { return this.#fixParams(11, true ); }
        get withNoUseBigInts                 () { return this.#fixParams(11, false); }

        get withAllowSpecialCharacters  () {
            return this.withAllowControlCharacters  .withAllowSurrogateCharacters  .withAllowPrivateUseCharacters  .withAllowNonCharacters  ;
        }

        get withNoAllowSpecialCharacters() {
            return this.withNoAllowControlCharacters.withNoAllowSurrogateCharacters.withNoAllowPrivateUseCharacters.withNoAllowNonCharacters;
        }

        static get standardFlags() {
            return ParseFlags.#standardFlags
        }

        static get json5Flags() {
            return ParseFlags.#json5Flags
        }
    }

    class XJSON {

        static #standard = XJSON.#create(ParseFlags.standardFlags);
        static #json5 = XJSON.#create(ParseFlags.json5Flags);

        static get standard() {
            return XJSON.#standard;
        }

        static get json5() {
            return XJSON.#json5;
        }

        static get standardFlags() {
            return ParseFlags.standardFlags;
        }

        static get json5Flags() {
            return ParseFlags.json5Flags;
        }

        constructor() {
            throw new TypeError();
        }

        static parser(flags) {
            testType(flags, ParseFlags);
            const x = (flags.isStandard ? XJSON.#standard : flags.isJson5 ? XJSON.#json5 : XJSON.#create(flags));
            return function(s) {
                testType(s, STRING);
                return x(s);
            };
        }

        static #create(flags) {
            testType(flags, ParseFlags);

            const productions = new ProductionFactory();
            const anyChar     = productions.anyChar()  ;
            const bof         = productions.bof()      ;
            const eof         = productions.eof()      ;
            const empty       = productions.empty()    ;
            const rejects     = productions.rejects()  ;
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

            const useBig = flags.useBigInts;

            // Part 1: Defining character classes.

            const isAcceptableSymbol = z =>
                   (flags.allowControlCharacters    || !UnicodeTable.isControlSymbol     (z)) &&
                   (flags.allowSurrogateCharacters  || !UnicodeTable.isSurrogateSymbol   (z)) &&
                   (flags.allowPrivateUseCharacters || !UnicodeTable.isPrivateUseSymbol  (z)) &&
                   (flags.allowNonCharacters        || !UnicodeTable.isNonCharacterSymbol(z));

            // Acceptable chars. Standard JSON forbid only control chars, JSON5 allows all.
            // Sometimes, non-characters, private-use, surrogates and control aren't acceptable and that can be configured in the flags.
            const validChar = flags.allowAllCharacters ? anyChar : test("Valid char", false, anyChar, isAcceptableSymbol);

            // json.org lists only four whitespaces other than the empty string: standard space, new line, carriage return and tab.
            const wsa = choice("Standard whitespace", [literal(" "), literal("\n"), literal("\r"), literal("\t")]);

            // json5.org tells that any unicode whitespace is to be considered valid whitespace.
            const wsu = test("Unicode whitespace", false, validChar, UnicodeTable.isWhitespaceSymbol);

            // Defined in json5.org. Useful in comments and for multi-line strings. Not used in standard JSON.
            // Important: \r\n must come before \r in the choice.
            const lineTerminator = choice("Line terminator", [literal("\r\n"), literal("\r"), literal("\n"), literal("\u2028"), literal("\u2029")]);
            const notLineTerminator = sequence("Not a line break", [hasNot(lineTerminator), validChar]);

            // Part 2: Defining character classes for digits.

            const d0 = literal("0",  0n);
            const d1 = literal("1",  1n);
            const d2 = literal("2",  2n);
            const d3 = literal("3",  3n);
            const d4 = literal("4",  4n);
            const d5 = literal("5",  5n);
            const d6 = literal("6",  6n);
            const d7 = literal("7",  7n);
            const d8 = literal("8",  8n);
            const d9 = literal("9",  9n);
            const da = literal("a", 10n);
            const dA = literal("A", 10n);
            const db = literal("b", 11n);
            const dB = literal("B", 11n);
            const dc = literal("c", 12n);
            const dC = literal("C", 12n);
            const dd = literal("d", 13n);
            const dD = literal("D", 13n);
            const de = literal("e", 14n);
            const dE = literal("E", 14n);
            const df = literal("f", 15n);
            const dF = literal("F", 15n);

            const d19 = [d1, d2, d3, d4, d5, d6, d7, d8, d9];
            const d09 = [d0, ...d19];
            const dhx = [...d09, da, dA, db, dB, dc, dC, dd, dD, de, dE, df, dF];

            // json.org calls this as onenine. json5.org calls this as NonZeroDigit.
            const digit19 = choice("onenine", d19);

            // json.org calls this as digit.   json5.org calls this as DecimalDigit.
            const digit09 = choice("digit"  , d09);

            // json.org calls this as hex.     json5.org calls this as HexDigit.
            const digit0F = choice("hex"    , dhx);

            // Defined in json5.org with the intent of ignoring the preceding reverse solidus if that is not followed by a digit.
            const notDigit = sequence("Not digit", [hasNot(digit09), validChar], z => z[1]);

            // Part 3: Building integer number from digit sequences.

            const fold10 = z => { testType(z, [BIGINT]); return z.reduce((a, v) => 10n * a + v, 0n); };
            const fold16 = z => { testType(z, [BIGINT]); return z.reduce((a, v) => 16n * a + v, 0n); };

            // json.org calls this as digits. json5.org calls this as DecimalDigits.
            const digits = plus(digit09);

            // For cases where leading zeros are forbidden.
            const nonZero = sequence("Non zero integer", [digit19, star(digit09)], z => fold10([z[0], ...z[1]]));

            // An integer value that is guaranteed free of leading zeros, except if it is just a zero.
            const decimalIntegerLiteral = choice("Decimal digits", [d0, nonZero]);

            // json.org uses this as part of the escape production. json5.org also uses as part of the UnicodeEscapeSequence.
            const hex4 = sequence("hex4", [digit0F, digit0F, digit0F, digit0F], fold16);

            // json5.org also uses as part of the HexEscapeSequence.
            const hex2 = sequence("hex2", [digit0F, digit0F], fold16);

            // Also part of the \u{XXX...} espace sequence.
            const hexn = plus(digit0F, fold16);

            // Part 4: Whitespaces and comments.

            // Comments.
            const notStarSlash = sequence("Not */", [hasNot(literal("*/")), validChar]);
            const comment1 = sequence("/* comment */", [literal("/*"), star(notStarSlash     ), literal("*/") ]);
            const comment2 = sequence("// comment"   , [literal("//"), star(notLineTerminator), lineTerminator]);

            // Decides what should be considered as whitespaces accordingly to the flags.
            const ignoreList = [];
            if (flags.allowComments) {
                ignoreList.push(comment1, comment2);
            }
            if (flags.allowUnicodeWhitespace) {
                ignoreList.push(wsu);
            } else if (flags.allowAnsiWhitespace) {
                ignoreList.push(wsa);
            }
            const ignored = choice("ignored", ignoreList);

            // This is what should be considered as whitespace.
            const ws = ignoreList.length === 0 ? empty : star(ignored);

            // Part 5: Escape sequences.

            // The standard JSON \u____ sequence and the JSON5 \u{...} and \x__ sequences.
            const makeChar = n => String.fromCodePoint(Number(n));
            const escapedCharBmp    = sequence("Escape sequence \\u____" , [literal("u" ), hex4              ], z => makeChar(z[1]));
            const escapedCharX      = sequence("Escape sequence \\x__"   , [literal("x" ), hex2              ], z => makeChar(z[1]));
            const escapedCharEs2015 = sequence("Escape sequence \\u{...}", [literal("u{"), hexn, literal("}")], z => makeChar(z[1]));

            // For building the simple sequences while avoiding repetitive code.
            const makeEscape = (name, symbol, value) => literal(symbol, value);

            // Simple escapes listed in the order that they're defined in json.org.
            const escapeDoubleQuote    = literal('"' );
            const escapeReverseSolidus = literal("\\");
            const escapeSolidus        = literal("/" );
            const escapeBackspace      = literal("b" , "\b");
            const escapeFormFeed       = literal("f" , "\f");
            const escapeNewLine        = literal("n" , "\n");
            const escapeCarriageReturn = literal("r" , "\r");
            const escapeTab            = literal("t" , "\t");

            // Simple escapes defined in json5.org.
            const escapeSingleQuote    = literal("'" );
            const escapeVerticalTab    = literal("v" , "\v");
            const escapeNullCharacter  = literal("0" , "\0");

            // json5.org forbids digits following \0. So we need to check those.
            const escapeNullCharacterOk = sequence("Valid null character", [escapeNullCharacter, hasNot(digit09)], z => z[0]);

            // For multi-line strings.
            const escapeLineTerminator = xform("Line terminator escape", false, lineTerminator, z => "");

            // Use the flags to decide which escape sequences are desired.
            const escapeCodeList = [
                escapeDoubleQuote, escapeReverseSolidus, escapeSolidus, escapeBackspace, escapeFormFeed, escapeNewLine, escapeCarriageReturn, escapeTab, escapedCharBmp
            ];
            if (flags.allowSingleQuoteEscapes) escapeCodeList.push(escapeSingleQuote);
            if (flags.allowES2015Escapes     ) escapeCodeList.push(escapedCharX, escapedCharEs2015, escapeVerticalTab, escapeNullCharacterOk, escapeLineTerminator);
            if (flags.allowAllEscapes        ) escapeCodeList.push(notDigit);

            // Create the escape code (still without the preceding reverse solidus, as shown in the json.org grammar).
            const escape = choice("Escape", escapeCodeList);

            // Second choice of the character production in json.org (possibly modified by the flags tricks to conform to json5.org).
            // This is actually all the escape sequences including the preceding reverse solidus.
            const escapedChar = sequence("Escape code", [literal("\\"), escape], z => z[1]);

            // Part 6: Strings.

            // Character production in json.org. The validChar already filtered out control chars (or any other undesired chars) that needed to be filtered out.
            // So we just need to filter out \ and ".
            const validChar1 = sequence("Char1", [hasNot(literal("\\")), hasNot(literal("'")), validChar], z => z[2]);
            const validChar2 = sequence("Char2", [hasNot(literal("\\")), hasNot(literal('"')), validChar], z => z[2]);

            const strChar0 = choice("Identifier character"          , [escapedChar, validChar ]);
            const strChar1 = choice("Sinqle-quoted string character", [escapedChar, validChar1]);
            const strChar2 = choice("Double-quoted string character", [escapedChar, validChar2]);

            const str1 = sequence("Single-quoted string", [literal("'"), star(strChar1), literal("'")], z => z[1].join(""));
            const str2 = sequence("Double-quoted string", [literal('"'), star(strChar2), literal('"')], z => z[1].join(""));

            const str = flags.allowSingleQuotedStrings ? choice("String", [str1, str2]) : str2;

            // Part 7: JSON5 identifiers used as keys instead of strings.

            const startIdentifierChar    = test("Starting identifier char"    , false, strChar0, UnicodeTable.isStartingIdentifierSymbol    );
            const continueIdentifierChar = test("Continuation identifier char", false, strChar0, UnicodeTable.isContinuationIdentifierSymbol);
            const identifier = sequence("Identifier", [startIdentifierChar, star(continueIdentifierChar)], z => [z[0], ...z[1]].join(""));

            // Part 8: Numbers.

            const makeNumber = (a, b, c) => {
                testType(a, BIGINT);
                testType(b, [BIGINT]);
                testType(c, BIGINT);
                while (b.at(-1) === 0n) {
                    b = b.slice(0, -1);
                }
                const bs = BigInt(b.length);
                if (!useBig || c < bs) return parseFloat(a + "." + b + "e" + c);
                return (a * 10n ** bs + fold10(b)) * 10n ** (c - bs);
            };

            // Optional signal. Standard JSON doesn't allow a following +, so we have signalm for that.
            const signalpm = choice("+/-/_", [literal("+", 1n), literal("-", -1n), literal("", 1n)]);
            const signalm  = choice("-/_"  , [                  literal("-", -1n), literal("", 1n)]);

            // Hex integers (without signal yet).
            const zeroX = choice("0x", [literal("0x"), literal("0X")]);
            const hexLiteral = sequence("Hex literal", [zeroX, hexn], z => z[1]);

            // Exponent for floating-point numbers.
            const e = choice("E", [literal("e"), literal("E")]);
            const exponent = sequence("Exponent", [e, signalpm, digits] , z => z[1] * fold10(z[2]));

            // The first three of those are the forms of DecimalLiteral as defined in JSON5. Standard JSON is the 1st and 4th.
            // The 4th form is a subset of the 3rd, so it is uneeded/redundant to JSON5. But the 3rd form is non-compliant in standard JSON, so we still need the 4th.
            const simpleNumber    = sequence("Simple number"    , [decimalIntegerLiteral,                                  opt(exponent, 0n)], z => makeNumber(z[0], [0n], z[1]));
            const dotNumber       = sequence("Dot number"       , [                       literal("."),     digits       , opt(exponent, 0n)], z => makeNumber(  0n, z[1], z[2]));
            const fullNumberLoose = sequence("Full number loose", [decimalIntegerLiteral, literal("."), opt(digits, [0n]), opt(exponent, 0n)], z => makeNumber(z[0], z[2], z[3]));
            const fullNumberRigid = sequence("Full number rigid", [decimalIntegerLiteral, literal("."),     digits       , opt(exponent, 0n)], z => makeNumber(z[0], z[2], z[3]));

            // Numeric literals for JSON5.
            const literalInfinity = literal("Infinity", Infinity);
            const literalNaN      = literal("NaN"     , NaN     );

            // Warning: Order matters. simpleNumber should be tried after the other forms.
            const extendedNumericLiteral = choice("Extended decimal literal", [dotNumber, fullNumberLoose, simpleNumber, hexLiteral, literalInfinity, literalNaN]);
            const standardNumericLiteral = choice("Standard decimal literal", [fullNumberRigid, simpleNumber]);

            const signalize = z => (getType(z[1]) === BIGINT ? z[0] : Number(z[0])) * z[1];
            const extendedNumber = sequence("Extended number", [signalpm, extendedNumericLiteral], signalize);
            const standardNumber = sequence("Standard number", [signalm , standardNumericLiteral], signalize);

            const num = flags.allowExtendedNumberNotation ? extendedNumber : standardNumber;

            // Part 9: Objects and lists.

            const pTrue  = literal("true" , true );
            const pFalse = literal("false", false);
            const pNull  = literal("null" , null );

            const obj = lateBound();
            const arr = lateBound();

            const keyName = flags.allowUnquotedKeys ? choice("Key without ws", [str, identifier]) : str;

            const possibleValue = choice("Value without ws", [str, num, pTrue, pFalse, pNull, obj.production, arr.production]);
            const value = sequence("Value"    , [ws , possibleValue, ws   ], z => z[1]);
            const key   = sequence("Key"      , [ws , keyName      , ws   ], z => z[1]);
            const kv    = sequence("Key-value", [key, literal(":") , value], z => [z[0], z[2]]);

            const comma = sequence("Comma", [ws, literal(","), ws]);

            const commas = (n, x) => {
                const alt = alternation(x, comma, z => z[0]);
                const seq = sequence(n + " possibly with extra comma", [alt, opt(comma)], z => z[0]);
                return flags.allowTrailingCommas ? seq : alt;
            };

            const makeObj = (pairs) => {
                testType(pairs, Array);
                const x = {};
                for (const p of pairs) {
                    testType(p[0], STRING);
                    x[p[0]] = p[1];
                }
                return x;
            };

            obj.inner = sequence("Object", [literal("{"), commas("Object properties", kv   ), literal("}")], z => makeObj(z[1]));
            arr.inner = sequence("List"  , [literal("["), commas("List items"       , value), literal("]")], z => z[1]         );

            // Part 10: The gran-finale.

            const root = sequence("JSON document", [bof, value, eof], z => z[1]);

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

    return [ParseFlags, XJSON];
})();