"use strict";

const [isStartingIdentifierSymbol, isContinuationIdentifierSymbol, identifierTable] = (() => {
    const identifierTable = new Array(0x10FFFF + 1);

    function parses(junk) {
        try {
            eval(junk);
        } catch (e) {
            return false;
        }
        return true;
    }

    for (let i = 0; i <= 0x10FFFF; i++) {
        const c = String.fromCodePoint(i);
        const x = () => parses(`"use strict"; (() => { let x${c}z${c} = 42; })();`);
        const y = () => parses(`"use strict"; (() => { let  ${c}      = 42; })();`);

        identifierTable[i] = x() ? (y() ? 2 : 1) : 0;
        if (i % 65536 === 0) console.log(i);
    }

    function checkString(c) {
        if (c.length === 0) return 0;
        const i = c.codePointAt(0);
        if (c !== String.fromCodePoint(i)) return 0;
        return i;
    }

    function isStartingIdentifierSymbol(c) {
        return identifierTable[checkString(c)] === 2;
    }

    function isContinuationIdentifierSymbol(c) {
        return identifierTable[checkString(c)] !== 0;
    }

    return [isStartingIdentifierSymbol, isContinuationIdentifierSymbol, identifierTable];
})();