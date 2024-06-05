"use strict";

// Check if this was correctly imported.
UnicodeTable;

function buildTable() {
    const identifierTable = new Uint8Array(0x10FFFF + 1);

    let outerIsStartingIdentifierCodePointNoTable    ;
    let outerIsContinuationIdentifierCodePointNoTable;
    let outerIsSpaceCodePointNoTable                 ;

    function checkString(c, n) {
        if (c.length === 0) return n;
        const i = c.codePointAt(0);
        if (c !== String.fromCodePoint(i)) return n;
        return i;
    }

    const planes = [
        {n: "ANSI"  , a: 0x000000, b: 0x00007F},
        {n: "BMP"   , a: 0x000080, b: 0x00FFFF},
        {n: "SMP"   , a: 0x010000, b: 0x01FFFF},
        {n: "SIP"   , a: 0x020000, b: 0x02FFFF},
        {n: "TIP"   , a: 0x030000, b: 0x03FFFF},
        {n: "P4"    , a: 0x040000, b: 0x04FFFF}, // Should be empty.
        {n: "P5"    , a: 0x050000, b: 0x05FFFF}, // Should be empty.
        {n: "P6"    , a: 0x060000, b: 0x06FFFF}, // Should be empty.
        {n: "P7"    , a: 0x070000, b: 0x07FFFF}, // Should be empty.
        {n: "P8"    , a: 0x080000, b: 0x08FFFF}, // Should be empty.
        {n: "P9"    , a: 0x090000, b: 0x09FFFF}, // Should be empty.
        {n: "PA"    , a: 0x0A0000, b: 0x0AFFFF}, // Should be empty.
        {n: "PB"    , a: 0x0B0000, b: 0x0BFFFF}, // Should be empty.
        {n: "PC"    , a: 0x0C0000, b: 0x0CFFFF}, // Should be empty.
        {n: "PD"    , a: 0x0D0000, b: 0x0DFFFF}, // Should be empty.
        {n: "SSP"   , a: 0x0E0000, b: 0x0EFFFF},
        {n: "SPUA-A", a: 0x0F0000, b: 0x0FFFFF}, // Should be empty.
        {n: "SPUA-B", a: 0x100000, b: 0x10FFFF}  // Should be empty.
    ];

    function splitRanges(ranges, min, max) {
        if (ranges.length === 0) return "";
        if (ranges.length === 1) {
            const r = ranges[0];
            if (r[0] === r[1]) return `(c === ${r[0]})`
            if (min  === r[0]) return `(c <= ${r[1]})`;
            if (max  === r[1]) return `(c >= ${r[0]})`;
            return `(c >= ${r[0]} && c <= ${r[1]})`;
        }
        const a = Math.floor(ranges.length / 2);
        const mid = ranges[a - 1][1];
        if (a === 1) {
            const x = splitRanges(ranges.slice(0, 1), min, mid + 1);
            const y = splitRanges(ranges.slice(1   ), mid, max    );
            return `(${x} || ${y})`;
        }
        const x = splitRanges(ranges.slice(0, a), min    , mid);
        const y = splitRanges(ranges.slice(a   ), mid + 1, max);
        return `(c <= ${mid} ? ${x} : ${y})`;
    }

    function tracePlanes(plane) {
        const ranges1  = [];
        const ranges2  = [];
        const ranges4  = [];
        const ranges12 = [];

        let start1 = -1, start2 = -1, start12 = -1, start4 = -1, lastT = 0, lastU = 0;
        for (let i = plane.a; i <= plane.b + 1; i++) {
            const t = identifierTable[i] & 3;
            if (t !== lastT) {
                if (lastT === 0) start12 = i;
                if (t === 0) {
                    if (start12 <= i - 1) ranges12.push([start12, i - 1]);
                    start12 = 0;
                }
                if (lastT !== 1) start1  = i;
                if (t !== 1) {
                    if (start1  <= i - 1) ranges1 .push([start1 , i - 1]);
                    start1  = 0;
                }
                if (lastT !== 2) start2  = i;
                if (t !== 2) {
                    if (start2  <= i - 1) ranges2 .push([start2 , i - 1]);
                    start2  = 0;
                }
                lastT = t;
            }
            const u = identifierTable[i] & 4;
            if (u !== lastU) {
                if (lastU !== 4) start4  = i;
                if (u !== 4) {
                    if (start4  <= i - 1) ranges4 .push([start4 , i - 1]);
                    start4  = 0;
                }
                lastU = u;
            }
        }

        console.log(ranges12);
        console.log(ranges1 );
        console.log(ranges2 );
        console.log(ranges4 );
        plane.arr12 = ranges12;
        plane.arr1  = ranges1 ;
        plane.arr2  = ranges2 ;
        plane.arr4  = ranges4 ;

        if (ranges12.length > 0) {
            plane.start12 = ranges12[0][0];
            plane.end12   = ranges12.at(-1)[1];
            plane.expr12  = "(" + splitRanges(ranges12, plane.start12 - 1, plane.end12 + 1) + ")";
        } else {
            plane.expr12  = "";
        }
        if (ranges1.length > 0) {
            plane.start1  = ranges1 [0][0];
            plane.end1    = ranges1 .at(-1)[1];
            plane.expr1   = "(" + splitRanges(ranges1 , plane.start1  - 1, plane.end1  + 1) + ")";
        } else {
            plane.expr1   = "";
        }
        if (ranges2.length > 0) {
            plane.start2  = ranges2 [0][0];
            plane.end2    = ranges2 .at(-1)[1];
            plane.expr2   = "(" + splitRanges(ranges2 , plane.start2  - 1, plane.end2  + 1) + ")";
        } else {
            plane.expr2   = "";
        }
        if (ranges4.length > 0) {
            plane.start4  = ranges4 [0][0];
            plane.end4    = ranges4 .at(-1)[1];
            plane.expr4   = "(" + splitRanges(ranges4 , plane.start4  - 1, plane.end4  + 1) + ")";
        } else {
            plane.expr4   = "";
        }
    }

    function parses(code) {
        try {
            eval(code);
        } catch (e) {
            return false;
        }
        return true;
    }

    console.log("start");
    const cw = c => parses(`"use strict";${c}(() =>${c}{ ${c}return       42; })();`);
    const cx = c => parses(`"use strict";    (() =>    { let x${c}z${c} = 42; })();`);
    const cy = c => parses(`"use strict";    (() =>    { let  ${c}      = 42; })();`);

    for (const plane of planes) {
        for (let q = plane.a; q <= plane.b; q++) {
            const c = String.fromCodePoint(q);
            identifierTable[q] = cx(c) ? (cy(c) ? 2 : 1) : (cw(c) ? 4 : 0);
        }
        tracePlanes(plane);
        console.log(plane.n + " ok.");
    }
    console.log(identifierTable);

    const rg12 = planes.filter(r => r.expr12 !== "").map(r => r.expr12).join(" || ");
  //const rg1  = planes.filter(r => r.expr1  !== "").map(r => r.expr1 ).join(" || ");
    const rg2  = planes.filter(r => r.expr2  !== "").map(r => r.expr2 ).join(" || ");
    const rg4  = planes.filter(r => r.expr4  !== "").map(r => r.expr4 ).join(" || ");
    const w = `(function outerIsSpaceCodePointNoTable                 (c) { return ${rg4 }; })`;
    const x = `(function outerIsStartingIdentifierCodePointNoTable    (c) { return ${rg2 }; })`;
    const y = `(function outerIsContinuationIdentifierCodePointNoTable(c) { return ${rg12}; })`;

    console.log(w);
    console.log(x);
    console.log(y);

    const arr12 = planes.flatMap(p => p.arr12);
    const arr1  = planes.flatMap(p => p.arr1 );
    const arr2  = planes.flatMap(p => p.arr2 );
    const arr4  = planes.flatMap(p => p.arr4 );
    console.log(arr12);
    console.log(arr1 );
    console.log(arr2 );
    console.log(arr4 );

    function tableBuilder(arr1, arr2, arr4) {
        const identifierTable = new Uint8Array(0x10FFFF);
        const arrs = [arr1, arr2, arr4];
        const offs = [1, 2, 4];
        for (let i in arrs) {
            for (const range of arrs[i]) {
                for (let codePoint = range[0]; codePoint <= range[1]; codePoint++) {
                    identifierTable[codePoint] = offs[i];
                }
            }
        }
        return identifierTable;
    }

    function mp(e) {
        return `[${e[0]},${e[1]}]`;
    }

    const builder = [
        `(() => {`,
        `    ${tableBuilder}`,
        `    const a = [${arr1.map(mp)}];`,
        `    const b = [${arr2.map(mp)}];`,
        `    const c = [${arr4.map(mp)}];`,
        `    return tableBuilder(a, b, c);`,
        `})();`
    ].join("\n");
    console.log(builder);

    outerIsStartingIdentifierCodePointNoTable     = eval(x);
    outerIsContinuationIdentifierCodePointNoTable = eval(y);
    outerIsSpaceCodePointNoTable                  = eval(w);
}