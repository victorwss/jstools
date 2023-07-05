"use strict";

const typeName = function typeName(s) {
    if (typeof s === "number") {
        if (s !== s) return "NaN";
        if ([Infinity, -Infinity].contains(s)) return "Infinity";
        return s % 1 === 0 ? "int" : "float";
    }
    if (typeof s !== "object") return typeof s;
    return s === null ? "null" : s.constructor.name;
}

const defaultTypes = {};

const makeType = function makeType(t) {
    if (!(t in defaultTypes)) defaultTypes[t] = {name: t};
    return defaultTypes[t];
}

const [INT, FLOAT, BOOLEAN, FUNCTION, BIGINT, UNDEFINED, NULL, NAN, STRING, INFINITY] =
    ["int", "float", "boolean", "function", "bigint", "undefined", "null", "NaN", "string", "Infinity"]
        .map(makeType);

const getType = function getType(s) {
    const t = typeof s;
    return t === "number" ? (s !== s ? NAN : [Infinity, -Infinity].includes(s) ? INFINITY : s % 1 === 0 ? INT : FLOAT)
            : t !== "object" ? makeType(t)
            : s === null ? NULL
            : s.constructor;
}

const testType = function testType(whatGot, whatShouldBe) {
    const whatIs = getType(whatGot);
    if (whatIs !== whatShouldBe && (typeof whatShouldBe !== "function" || !(whatGot instanceof whatShouldBe))) {
        throw new TypeError(`Is ${whatIs.name} but should be ${whatShouldBe.name}.`);
    }
}

Object.prototype.checkFinal = function checkFinal(myClass) {
    if (this.constructor !== myClass) throw new TypeError("Class isn't extensible.");
};

Object.prototype.checkAbstract = function checkAbstract(myClass) {
    if (this.constructor === myClass) throw new TypeError("Class is abstract.");
};