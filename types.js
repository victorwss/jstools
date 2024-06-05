"use strict";

const Types = (() => {

    class UnionType {
        #subtypes;
        #name;

        constructor(...subtypes) {
            testType(subtypes, Array);
            if (subtypes.length < 2) throw new TypeError("Too few types to OR-out.");
            this.#subtypes = subtypes;
            this.#name = "[" + this.subtypes.map(spellOutType).join(" OR ") + "]";
        }

        get subtypes() {
            return this.#subtypes;
        }

        get name() {
            return this.#name;
        }

        toString() {
            if (arguments.length !== 0) throw new TypeError("Bad parameter count");
            return this.#name;
        }
    }

    class FuncType {
        #min;
        #max;
        #name;

        constructor(...specs) {
            if (specs.length === 0) {
                this.#min = 0;
                this.#max = Infinity;
            } else if (specs.length === 1) {
                testType(specs[0], INT);
                this.#min = specs[0];
                this.#max = specs[0];
            } else if (specs.length === 2) {
                testType(specs[0], INT);
                testType(specs[1], unionType(INT, INFINITY));
                if (specs[1] < specs[0]) throw new TypeError("The maximum number of parameters can't be smaller than the minimum.");
                this.#min = specs[0];
                this.#max = specs[1];
            } else {
                throw new TypeError("Too many parameters.");
            }
            this.#name = `Function(${this.count})`;
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
            return this.#name;
        }

        toString() {
            if (arguments.length !== 0) throw new TypeError("Bad parameter count");
            return this.#name;
        }
    }

    class OptionalParam {
        #value;

        constructor(value) {
            if (arguments.length !== 1) throw new TypeError("Bad parameter count");
            if (typeof value !== "object" || value === null) throw new TypeError("Bad parameter type");
            this.#value = value;
        }

        toString() {
            return this.#value + "?";
        }

        get value() {
            return this.#value;
        }
    }

    class SimpleType {
        #name;

        constructor(name) {
            if (arguments.length !== 1) throw new TypeError("Bad parameter count");
            if (typeof name !== "string") throw new TypeError("Bad parameter type");
            this.#name = name;
        }

        toString() {
            return this.#name;
        }

        get name() {
            return this.#name;
        }
    }

    const defaultTypes = {};
    const defaultTypesList = [];

    function makeDefaultType(t) {
        if (arguments.length !== 1) throw new TypeError("Bad parameter count");
        if (!(t in defaultTypes)) {
            defaultTypes[t] = new SimpleType(t);
            defaultTypesList.push(defaultTypes[t]);
        }
        return defaultTypes[t];
    }

    const [INT, FLOAT, BOOLEAN, FUNCTION, BIGINT, UNDEFINED, NULL, NAN, STRING, INFINITY, ANY] =
        ["int", "float", "boolean", "function", "bigint", "undefined", "null", "NaN", "string", "Infinity", "?"]
            .map(makeDefaultType);

    class Types {
        constructor() {
            throw new TypeError();
        }

        static get INT      () { return INT      ; }
        static get FLOAT    () { return FLOAT    ; }
        static get BOOLEAN  () { return BOOLEAN  ; }
        static get FUNCTION () { return FUNCTION ; }
        static get BIGINT   () { return BIGINT   ; }
        static get UNDEFINED() { return UNDEFINED; }
        static get NULL     () { return NULL     ; }
        static get NAN      () { return NAN      ; }
        static get STRING   () { return STRING   ; }
        static get INFINITY () { return INFINITY ; }
        static get ANY      () { return ANY      ; }

        static getType(s) {
            if (arguments.length !== 1) throw new TypeError("Bad parameter count");
            const t = typeof s;
            return t === "number" ? (s !== s ? NAN : [Infinity, -Infinity].includes(s) ? INFINITY : s % 1 === 0 ? INT : FLOAT)
                    : t !== "object" ? makeDefaultType(t) // boolean, function, bigint, undefined, string
                    : s === null ? NULL
                    : s.constructor;
        }

        static spellOutType(what) {
            if (arguments.length !== 1) throw new TypeError("Bad parameter count");
            if (what instanceof Array) {
                return "[" + what.map(spellOutType).join(", ") + "]";
            }
            if (what instanceof Object) {
                return "{" + what.keys().map(k => k + ": " + spellOutType(what[k])).join(", ") + "}";
            }
            const name = what.name;
            if (name) return name;
            throw new Error(`Can't find a name for ${what}`);
        }

        static unionType(...types) {
            return new UnionType(...types);
        }

        static funcType(...specs) {
            return new FuncType(...specs);
        }

        static optParam(...specs) {
            return new OptionalParam(...specs);
        }

        static testType(whatGot, whatShouldBe) {
            if (arguments.length !== 2) throw new TypeError("Bad parameter count");

            const whatIs = getType(whatGot);

            const errorTxt = () => `Is ${spellOutType(whatIs)} but should be ${spellOutType(whatShouldBe)}.`;

            if (whatShouldBe === ANY || whatIs === whatShouldBe) {
                return;
            }

            if (defaultTypesList.includes(whatShouldBe)) {
                throw new TypeError(errorTxt());
            }

            if (whatShouldBe.constructor === ParamType) {
                throw new TypeError("Bad optional parameter usage");
            }

            if (whatShouldBe.constructor === UnionType) {
                for (const t of whatShouldBe.subtypes) {
                    try {
                        testType(whatGot, t);
                        return;
                    } catch (e) {
                        if (!(e instanceof TypeError)) throw e;
                    }
                }
                throw new TypeError(errorTxt());
            }

            if (whatShouldBe.constructor === FuncType) {
                if (whatIs !== FUNCTION) throw new TypeError(errorTxt());
                const d = whatShouldBe.min === whatShouldBe.max;
                const m1 = d ? "at least " : "";
                const m2 = d ? "at most "  : "";
                if (whatGot.length < whatShouldBe.min) throw new TypeError(`${errorTxt()} Function should have ${m1}${whatShouldBe.min} parameters, but have ${whatGot.length}.`);
                if (whatGot.length > whatShouldBe.max) throw new TypeError(`${errorTxt()} Function should have ${m2}${whatShouldBe.max} parameters, but have ${whatGot.length}.`);
                return;
            }

            if (whatShouldBe.constructor === Array) {
                if (whatShouldBe.length === 0) throw new TypeError(`Type array has no types.`);
                if (whatShouldBe.length !== 1) throw new TypeError(`Type array has more than one type.`);
                testType(whatGot, Array);
                for (const element of whatGot) {
                    testType(element, whatShouldBe[0]);
                }
                return;
            }

            if (whatShouldBe.constructor === Object) {
                if (whatIs !== Object) throw new TypeError(errorTxt());
                const properties = whatShouldBe.keys();
                for (const p in properties) {
                    if (!(p in whatGot)) throw new TypeError(`${errorTxt()} Missing property ${p}.`);
                }
                for (const p in whatGot) {
                    if (!(p in properties)) throw new TypeError(`${errorTxt()} Unexpected property ${p}.`);
                }
                for (const p in properties) {
                    testType(whatIs[p], properties[p]);
                }
                return;
            }

            if (typeof whatShouldBe !== "function" || !(whatGot instanceof whatShouldBe)) {
                throw new TypeError(errorTxt);
            }
        }

        static testSignature(signature, args, optionals = 0) {
            if (![2, 3].includes(arguments.length)) throw new TypeError("Bad parameter count");
            testType(signature, [ANY]);
            testType(args, [ANY]);
            testType(optionals, [INT]);
            if (optionals < 0 || optionals > arguments.length) throw new TypeError("Bad optional parameter count");
            if (args.length < signature.length - optionals || args.length > signature.length) {
                throw new TypeError("Bad parameter count");
            }
            for (let i = 0; i < args.length; i++) {
                testType(args[i], signature[i]);
            }
        }
    }

    return Types;
})();
