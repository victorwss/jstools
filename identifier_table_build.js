function buildTable() {
    const identifierTable = new Uint8Array(0x10FFFF + 1);

    let outerIsStartingIdentifierCodePointNoTable    ;
    let outerIsContinuationIdentifierCodePointNoTable;

    function checkString(c, n) {
        if (c.length === 0) return n;
        const i = c.codePointAt(0);
        if (c !== String.fromCodePoint(i)) return n;
        return i;
    }

    const planes = [
        {n: "ANSI", a: 0x000000, b: 0x0000FF},
        {n: "BMP" , a: 0x000100, b: 0x00FFFF},
        {n: "SMP" , a: 0x010000, b: 0x01FFFF},
        {n: "SIP" , a: 0x020000, b: 0x02FFFF},
        {n: "TIP" , a: 0x030000, b: 0x03FFFF},
        {n: "P4"  , a: 0x040000, b: 0x04FFFF},
        {n: "P5"  , a: 0x050000, b: 0x05FFFF},
        {n: "P6"  , a: 0x060000, b: 0x06FFFF},
        {n: "P7"  , a: 0x070000, b: 0x07FFFF},
        {n: "P8"  , a: 0x080000, b: 0x08FFFF},
        {n: "P9"  , a: 0x090000, b: 0x09FFFF},
        {n: "PA"  , a: 0x0A0000, b: 0x0AFFFF},
        {n: "PB"  , a: 0x0B0000, b: 0x0BFFFF},
        {n: "PC"  , a: 0x0C0000, b: 0x0CFFFF},
        {n: "PD"  , a: 0x0D0000, b: 0x0DFFFF},
        {n: "SSP" , a: 0x0E0000, b: 0x0EFFFF}
        // Don't bother with SPUA-A and SPUA-B.
    ];

    function parses(code) {
        try {
            eval(code);
        } catch (e) {
            return false;
        }
        return true;
    }

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

    function tracePlane12(plane) {
        const ranges1  = [];
        const ranges2  = [];
        const ranges12 = [];

        if (plane.hasSomething) {
            let start1 = -1, start2 = -1, start12 = -1, lastT = 0;
            for (let i = plane.a; i <= plane.b + 1; i++) {
                const t = identifierTable[i];
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
            }
        }
        console.log(ranges12);
        console.log(ranges1);
        console.log(ranges2);
        plane.arr12 = ranges12;
        plane.arr1  = ranges1 ;
        plane.arr2  = ranges2 ;
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
    }

    console.log("start");
    const cx = c => parses(`"use strict"; (() => { let x${c}z${c} = 42; })();`);
    const cy = c => parses(`"use strict"; (() => { let  ${c}      = 42; })();`);

    for (const plane of planes) {
        plane.hasSomething = false;
        for (let q = plane.a; q <= plane.b; q++) {
            const c = String.fromCodePoint(q);

            identifierTable[q] = cx(c) ? (cy(c) ? 2 : 1) : 0;
            plane.hasSomething |= identifierTable[q] !== 0;
        }
        tracePlane12(plane);
        console.log(plane.n + " ok.");
    }
    console.log(identifierTable);

    const rg12 = planes.filter(r => r.expr12 !== "").map(r => r.expr12).join(" || ");
  //const rg1  = planes.filter(r => r.expr1  !== "").map(r => r.expr1 ).join(" || ");
    const rg2  = planes.filter(r => r.expr2  !== "").map(r => r.expr2 ).join(" || ");
    const x = `(function outerIsStartingIdentifierCodePointNoTable    (c) { return ${rg2 }; })`;
    const y = `(function outerIsContinuationIdentifierCodePointNoTable(c) { return ${rg12}; })`;

    console.log(x);
    console.log(y);

    const arr12 = planes.flatMap(p => p.arr12);
    const arr1  = planes.flatMap(p => p.arr1 );
    const arr2  = planes.flatMap(p => p.arr2 );
    console.log(arr12);
    console.log(arr1 );
    console.log(arr2 );

    function tableBuilder(arr1, arr2) {
        const identifierTable = new Uint8Array(0x10FFFF);
        const arrs = [arr1, arr2];
        for (let i of [0, 1]) {
            for (const range of arrs[i]) {
                for (let codePoint = range[0]; codePoint <= range[1]; codePoint++) {
                    identifierTable[codePoint] = i + 1;
                }
            }
        }
        return identifierTable;
    }

    function mp(e) {
        return `[${e[0]},${e[1]}]`;
    }

    const builder = `(() => {\n    ${tableBuilder}\n    const a = [${arr1.map(mp)}];\n    const b = [${arr2.map(mp)}];\n    return tableBuilder(a, b);\n})();`;
    console.log(builder);

    outerIsStartingIdentifierCodePointNoTable     = eval(x);
    outerIsContinuationIdentifierCodePointNoTable = eval(y);
}