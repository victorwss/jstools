"use strict";

const [INT, FLOAT, BOOLEAN, FUNCTION, BIGINT, UNDEFINED, NULL, NAN, STRING, INFINITY, ANY, typeName, getType, orType, funcType, testType] = (() => {
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
    const defaultTypesList = [];

    function makeType(t) {
        if (!(t in defaultTypes)) {
            defaultTypes[t] = {name: t};
            defaultTypesList.push(defaultTypes[t]);
        }
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

    function spellOutType(what) {
        const name = what.name;
        if (name) return name;
        if (what instanceof Array) return "[" + what.map(spellOutType).join(", ") + "]";
        if (what instanceof Object) return "{" + what.keys().map(k => k + ": " + spellOutType(what[k])).join(", ") + "}";
        throw new Error(`Can't find a name for ${what}`);
    }

    class OrType {
        #subtypes;

        constructor(...subtypes) {
            testType(subtypes, Array);
            if (subtypes.length < 2) throw new TypeError("Too few types to OR-out.");
            this.#subtypes = subtypes;
            this.name; // Test if no error will blow up.
        }

        get subtypes() {
            return this.#subtypes;
        }

        get name() {
            return "[" + this.subtypes.map(spellOutType).join(" OR ") + "]";
        }
    }

    class FuncType {
        #min;
        #max

        constructor(...specs) {
            if (specs.length === 0) {
                this.#min = 0;
                this.#max = Infinity;
            } else if (specs.length === 1) {
                testType(specs[0], INT);
                this.#min = specs[0];
                this.#max = specs[0];
            } else if (specs.length === 2) {
                testType(specs[0], INT, x => x >= 0);
                testType(specs[1], orType(INT, INFINITY));
                if (specs[1] < specs[0]) throw new TypeError("The maximum number of parameters can't be smaller than the minimum.");
                this.#min = specs[0];
                this.#max = specs[1];
            } else {
                throw new TypeError("Too many parameters.");
            }
        }

        get min() {
            return this.#min;
        }

        get max() {
            return this.#min;
        }

        get count() {
            return this.#min === this.#max                   ? "" + this.#min
                :  this.#max === Infinity && this.#min === 0 ? "..."
                :  this.#max === Infinity                    ? this.#min + "..."
                :  this.#min + "-" + this.#max;
        }

        get name() {
            return `Function(${this.count})`;
        }
    }

    function orType(...types) {
        return new OrType(...types);
    }

    function funcType(...specs) {
        return new FuncType(...specs);
    }

    function testType(whatGot, whatShouldBe) {
        const whatIs = getType(whatGot);

        const errorTxt = `Is ${spellOutType(whatIs)} but should be ${spellOutType(whatShouldBe)}.`;

        if (whatShouldBe === ANY || whatIs === whatShouldBe) {
            return;
        }

        if (defaultTypesList.includes(whatShouldBe)) {
            throw new TypeError(errorTxt);
        }

        if (whatShouldBe.constructor === OrType) {
            for (const t of whatShouldBe.subtypes) {
                try {
                    testType(whatGot, t);
                    return;
                } catch (e) {
                    if (!(e instanceof TypeError)) throw e;
                }
            }
            throw new TypeError(errorTxt);
        }

        if (whatShouldBe.constructor === FuncType) {
            if (whatIs !== FUNCTION) throw new TypeError(errorTxt);
            const d = whatShouldBe.min === whatShouldBe.max;
            const m1 = d ? "at least " : "";
            const m2 = d ? "at most "  : "";
            if (whatGot.length < whatShouldBe.min) throw new TypeError(`${errorTxt} Function should have ${m1}${whatShouldBe.min} parameters, but have ${whatGot.length}.`);
            if (whatGot.length > whatShouldBe.max) throw new TypeError(`${errorTxt} Function should have ${m2}${whatShouldBe.max} parameters, but have ${whatGot.length}.`);
            return;
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
            if (whatIs !== Object) throw new TypeError(errorTxt);
            const properties = whatShouldBe.keys();
            for (const p in properties) {
                if (!(p in whatGot)) throw new TypeError(`${errorTxt} Missing property ${p}.`);
            }
            for (const p in whatGot) {
                if (!(p in properties)) throw new TypeError(`${errorTxt} Unexpected property ${p}.`);
            }
            for (const p in properties) {
                testType(whatIs[p], properties[p]);
            }
            return;
        }

        if (typeof whatShouldBe !== "function" || !(whatGot instanceof whatShouldBe)) {
            throw new TypeError(errorTxt);
        }
    };

    Object.prototype.checkFinal = function checkFinal(myClass) {
        if (this.constructor !== myClass) throw new TypeError(`The class ${myClass.name} isn't extensible.`);
    };

    Object.prototype.checkAbstract = function checkAbstract(myClass) {
        if (this.constructor === myClass) throw new TypeError(`The class ${myClass.name} is abstract.`);
    };

    return [INT, FLOAT, BOOLEAN, FUNCTION, BIGINT, UNDEFINED, NULL, NAN, STRING, INFINITY, ANY, typeName, getType, orType, funcType, testType];
})();