"use strict";

const [INT, FLOAT, BOOLEAN, FUNCTION, BIGINT, UNDEFINED, NULL, NAN, STRING, INFINITY, ANY, typeName, getType, orType, testType] = (() => {
    function typeName(s) {
        if (typeof s === "number") {
            if (s !== s) return "NaN";
            if ([Infinity, -Infinity].contains(s)) return "Infinity";
            return s % 1 === 0 ? "int" : "float";
        }
        if (typeof s !== "object") return typeof s;
        return s === null ? "null" : s.constructor.name;
    }

    const defaultTypes = {};

    function makeType(t) {
        if (!(t in defaultTypes)) defaultTypes[t] = {name: t};
        return defaultTypes[t];
    }

    const [INT, FLOAT, BOOLEAN, FUNCTION, BIGINT, UNDEFINED, NULL, NAN, STRING, INFINITY, ANY] =
        ["int", "float", "boolean", "function", "bigint", "undefined", "null", "NaN", "string", "Infinity", "?"]
            .map(makeType);

    function getType(s) {
        const t = typeof s;
        return t === "number" ? (s !== s ? NAN : [Infinity, -Infinity].includes(s) ? INFINITY : s % 1 === 0 ? INT : FLOAT)
                : t !== "object" ? makeType(t)
                : s === null ? NULL
                : s.constructor;
    }

    class OrType {
        #subtypes;

        constructor(subtypes) {
            this.#subtypes = subtypes;
        }

        get subtypes() {
            return this.#subtypes;
        }

        get name() {
            return "[" + this.subtypes.map(z => z.name).join(" OR ") + "]";
        }
    }

    function orType(types) {
        return new OrType(types);
    }

    function testType(whatGot, whatShouldBe) {
        const whatIs = getType(whatGot);

        if (whatShouldBe === ANY || whatIs === whatShouldBe) {
            return;
        }

        if (whatShouldBe.constructor === OrType) {
            const errors = [];
            for (const t of whatShouldBe.subtypes) {
                try {
                    testType(whatGot, t);
                    return;
                } catch (e) {
                    if (!(e instanceof TypeError)) throw e;
                    errors.push(e);
                }
            }
            throw new TypeError(`Is ${whatIs.name} but should be ${whatShouldBe.name}.`);
        }

        if (whatShouldBe.constructor === Array) {
            if (whatShouldBe.length === 0) throw new TypeError(`Array has no type.`);
            if (whatShouldBe.length !== 1) throw new TypeError(`Array has more than one type.`);
            testType(whatGot, Array);
            for (const element of whatGot) {
                testType(element, whatShouldBe[0]);
            }
            return;
        }

        if (whatShouldBe.constructor === Object) {
            if (whatIs !== Object) throw new TypeError(`Is ${whatIs.name} but should be plain object.`);
            for (const p in properties) {
                if (!(p in whatGot)) throw new TypeError(`Missing property ${p}.`);
            }
            for (const p in whatGot) {
                if (!(p in properties)) throw new TypeError(`Unexpected property ${p}.`);
            }
            for (const p in properties) {
                testType(whatIs[p], properties[p]);
            }
            return;
        }

        if (typeof whatShouldBe !== "function" || !(whatGot instanceof whatShouldBe)) {
            throw new TypeError(`Is ${whatIs.name} but should be ${whatShouldBe.name}.`);
        }
    };

    Object.prototype.checkFinal = function checkFinal(myClass) {
        if (this.constructor !== myClass) throw new TypeError(`The class ${myClass.name} isn't extensible.`);
    };

    Object.prototype.checkAbstract = function checkAbstract(myClass) {
        if (this.constructor === myClass) throw new TypeError(`The class ${myClass.name} is abstract.`);
    };

    return [INT, FLOAT, BOOLEAN, FUNCTION, BIGINT, UNDEFINED, NULL, NAN, STRING, INFINITY, ANY, typeName, getType, orType, testType];
})();