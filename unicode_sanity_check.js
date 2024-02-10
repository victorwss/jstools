function sanityCheck() {
    console.log("Checking...");
    function parses(code) {
        try {
            eval(code);
        } catch (e) {
            return false;
        }
        return true;
    }

    const cw = c => parses(`"use strict";${c}(() =>${c}{ ${c}return       42; })();`);
    const cx = c => parses(`"use strict";    (() =>    { let x${c}z${c} = 42; })();`);
    const cy = c => parses(`"use strict";    (() =>    { let  ${c}      = 42; })();`);
    const cz = c => parses(`"use strict";    (() =>    { let x = "${c}"     ; })();`);

    for (let i = 0; i <= 0x10FFFF; i++) {
        const c = String.fromCodePoint(i);
        if (UnicodeTable.isWhitespaceCodePoint            (i) !== cw(c)) console.log("CW Oops " + i);
        if (UnicodeTable.isContinuationIdentifierCodePoint(i) !== cx(c)) console.log("CX Oops " + i);
        if (UnicodeTable.isStartingIdentifierCodePoint    (i) !== cy(c)) console.log("CY Oops " + i);
        if (UnicodeTable.isStringCodePoint                (i) !== cz(c)) console.log("CZ Oops " + i);
    }
    for (const i of [-1, 0x110000]) {
        if (UnicodeTable.isWhitespaceCodePoint            (i)) console.log("CW Oops " + i);
        if (UnicodeTable.isContinuationIdentifierCodePoint(i)) console.log("CX Oops " + i);
        if (UnicodeTable.isStartingIdentifierCodePoint    (i)) console.log("CY Oops " + i);
        if (UnicodeTable.isStringCodePoint                (i)) console.log("CZ Oops " + i);
    }
    console.log("Checked!");
}