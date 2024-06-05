"use strict";

// Check if those were correctly imported.
Types;

const ProductionFactory = (() => {

    const testSignature = Types.testSignature;
    const unionType = Types.unionType;
    const testType = Types.testType;
    const funcType = Types.funcType;
    const optParam = Types.optParam;
    const STRING = Types.STRING;
    const INT = Types.INT;
    const ANY = Types.ANY;

    class Source {
        #raw;
        #slicer;
        #length;
        #uuid;

        constructor(raw, slicer, length) {
            testSignature([unionType(STRING, Array), funcType(2), INT], arguments);
            this.checkFinal(Source);
            this.#slicer = slicer;
            this.#raw = raw;
            this.#length = length;
            this.#uuid = newUuid();
            Object.freeze(this);
        }

        get raw() {
            return this.#raw;
        }

        get length() {
            return this.#length;
        }

        at(n) {
            testSignature([INT], arguments);
            if (n < 0 || n > this.length) throw new Error(`Bad value ${n} is not between 0 and ${this.length - 1}.`);
            return new ParsePosition(this, n);
        }

        slice(from, to) {
            testSignature([ParsePosition, ParsePosition], arguments);
            if (from.src !== this) throw new Error(`Initial position is not from this source.`);
            if (to.src !== this) throw new Error(`End position is not from this source.`);
            return this.#slicer(from.location, to.location);
        }

        start() {
            return new ParseContext(this, new Memory(this), this.at(0));
        }

        static create(raw) {
            testSignature([unionType(STRING, Array)], arguments);
            const slicer = raw instanceof Array ? (b, c) => raw.slice(b, c) : (b, c) => raw.substring(b, c);
            return new Source(raw, slicer, raw.length);
        }

        toString() {
            return `${this.#uuid}, (len = ${this.#length})`;
        }
    }
    Object.freeze(Source.prototype);

    class ParsePosition {
        #src;
        #location;

        constructor(src, location) {
            testSignature([Source, INT], arguments);
            this.checkFinal(ParsePosition);
            if (location < 0 || location > src.length) throw new Error(`Bad value ${n} is not between 0 and ${src.length - 1}.`);
            this.#src = src;
            this.#location = location;
            Object.freeze(this);
        }

        get src() {
            return this.#src;
        }

        get location() {
            return this.#location;
        }

        get begin() {
            return this.location === 0;
        }

        get end() {
            return this.location === this.src.length;
        }

        move(n) {
            testSignature([INT], arguments);
            let p = this.location + n;
            if (p < 0) p = 0;
            if (p > this.src.length) p = this.src.length;
            return new ParsePosition(this.src, p);
        }

        slice(length) {
            testSignature([INT], arguments);
            return this.src.slice(this, this.move(length));
        }

        parsedTo(what, end) {
            testSignature([ANY, ParsePosition], arguments);
            return new Parsed(this.src, this, end, what);
        }

        parsed(what, size) {
            testSignature([ANY, INT], arguments);
            return this.parsedTo(what, this.move(size));
        }

        toString() {
            testSignature([], arguments);
            return `${this.location} [${this.src}]`;
        }
    }
    Object.freeze(ParsePosition.prototype);

    class Parsed {
        #src;
        #from;
        #to;
        #content;

        constructor(src, from, to, content) {
            testSignature([Source, ParsePosition, ParsePosition, ANY], arguments);
            this.checkFinal(Parsed);
            if (from.src !== src) throw new Error(`Initial position is not from this source.`);
            if (to.src !== src) throw new Error(`End position is not from this source.`);
            this.#src = src;
            this.#from = from;
            this.#to = to;
            this.#content = content;
            Object.freeze(this);
        }

        get src() {
            return this.#src;
        }

        get from() {
            return this.#from;
        }

        get location() {
            return this.from.location;
        }

        get to() {
            return this.#to;
        }

        get content() {
            return this.#content;
        }

        withContent(newContent) {
            return new Parsed(this.src, this.from, this.to, newContent);
        }

        get snippet() {
            return this.src.slice(this.#from, this.#to);
        }

        toString() {
            testSignature([], arguments);
            return `${this.src} from ${this.from} to ${this.to} [${this.content}]`;
        }
    }
    Object.freeze(Parsed.prototype);

    class ParseError extends Error {
        #pos;

        constructor(p, pos) {
            testSignature([Production, ParsePosition], arguments);
            super(`${p} not found at ${pos}.`);
            this.#pos = pos;
        }

        get from() {
            return this.#pos;
        }

        get location() {
            return this.from.location;
        }

        get src() {
            return this.#pos.src;
        }
    }
    Object.freeze(ParseError.prototype);

    class NotFoundError extends Error {
    }
    Object.freeze(NotFoundError.prototype);

    class Memory {
        #src;
        #memo;
        #tracingCalls;
        #deadStacks;

        constructor(src) {
            testSignature([Source, Memory], arguments);
            this.checkFinal(Memory);
            this.#src = src;
            this.#memo = {};
            this.#tracingCalls = [];
            this.#deadStacks = [];
            Object.seal(this);
        }

        get src() {
            return this.#src;
        }

        #forProduction(p) {
            testSignature([Production], arguments);
            let sub = this.#memo[p.name];
            if (!sub) {
                sub = this.#memo[p.name] = new Array(this.#src.length);
            }
            return sub;
        }

        save(p, what) {
            testSignature([Production, Parsed], arguments);
            if (what.src !== this.#src) throw new Error(`Incompatible source, was ${what.src} expected ${this.#src}.`);
            this.#forProduction(p)[what.location] = what;
        }

        saveError(p, what) {
            testSignature([Production, Parsed], arguments);
            if (what.src !== this.#src) throw new Error(`Incompatible source, was ${what.src} expected ${this.#src}.`);
            this.#forProduction(p)[what.location] = what;
        }

        load(p, pos) {
            testSignature([Production, ParsePosition], arguments);
            if (pos.src !== this.#src) throw new Error(`Incompatible source, was ${pos.src} expected ${this.#src}.`);
            const e = this.#forProduction(p)[pos.location];
            if (!e) throw new NotFoundError();
            if (e instanceof ParseError) throw e;
            return e;
        }

        toString() {
            testSignature([], arguments);
            return `{src: ${this.src}}`;
        }

        pushTracingCall(call) {
            testSignature([Trace], arguments);
            if (this.#tracingCalls.length > 0) this.#tracingCalls.at(-1).subcall(call);
            this.#tracingCalls.push(call);
        }

        popTracingCall() {
            testSignature([], arguments);
            if (this.#tracingCalls.length === 1) this.#deadStacks.push(this.#tracingCalls[0]);
            this.#tracingCalls.pop();
        }

        get deadStacks() {
            return [...this.#deadStacks];
        }
    }
    Object.freeze(Memory.prototype);

    class Warning {
        #pos;
        #text;

        constructor(pos, text) {
            testSignature([ParsePosition, STRING], arguments);
            this.checkFinal(Warning);
            this.#pos = pos;
            this.#text = text;
        }

        get pos() {
            return this.#pos;
        }

        get text() {
            return this.#text;
        }
    }
    Object.freeze(Warning.prototype);

    class ParseContext {
        #src;
        #memo;
        #pos;
        #data;
        #warnings;

        constructor(src, memo, pos, data = {}, warnings = []) {
            testSignature([Source, Memory, ParsePosition, Object, [Warning]], arguments);
            if (pos.src !== src) throw new Error(`Incompatible source, was ${pos.src} expected ${src}.`);
            if (memo.src !== src) throw new Error(`Incompatible source, was ${memo.src} expected ${src}.`);
            this.checkFinal(ParseContext);
            this.#src = src;
            this.#memo = memo;
            this.#pos = pos;
            this.#data = data;
            this.#warnings = warnings;
            Object.freeze(this);
        }

        get src() {
            return this.#src;
        }

        get memo() {
            return this.#memo;
        }

        get pos() {
            return this.#pos;
        }

        get location() {
            return this.pos.location;
        }

        get begin() {
            return this.pos.begin;
        }

        get end() {
            return this.pos.end;
        }

        move(n) {
            testSignature([INT], arguments);
            return this.pos.move(n);
        }

        slice(length) {
            testSignature([INT], arguments);
            return this.pos.slice(length);
        }

        parsedTo(what, end) {
            testSignature([ANY, ParsePosition], arguments);
            return this.pos.parsedTo(what, end);
        }

        parsed(what, size) {
            testSignature([ANY, INT], arguments);
            return this.pos.parsed(what, size);
        }

        on(otherPos) {
            testSignature([ParsePosition], arguments);
            if (otherPos.src !== this.src) throw new Error(`Incompatible source, was ${otherPos.src} expected ${this.src}.`);
            return new ParseContext(this.#src, this.#memo, otherPos, this.#data, this.#warnings);
        }

        withData(newData) {
            testSignature([Object], arguments);
            return new ParseContext(this.#src, this.#memo, this.#pos, { ...newData }, this.#warnings);
        }

        addWarning(warning) {
            testSignature([STRING], arguments);
            return new ParseContext(this.#src, this.#memo, this.#pos, this.#data, [...this.#warnings, new Warning(this.pos, warning)]);
        }

        get data() {
            return {...this.#data};
        }

        get warnings() {
            return [...this.#warnings];
        }

        toString() {
            testSignature([], arguments);
            return `{memo: ${this.memo}, pos: ${this.pos}}`;
        }
    }
    Object.freeze(ParseContext.prototype);

    class Trace {
        #production;
        #pos;
        #result;
        #subcalls;

        constructor(production, ctx) {
            testSignature([Production, ParseContext], arguments);
            this.checkFinal(Trace);
            this.#production = production;
            this.#pos = ctx.pos;
            this.#result = null;
            this.#subcalls = [];
            Object.seal(this);
        }

        get production() {
            return this.#production;
        }

        get pos() {
            return this.#pos;
        }

        get result() {
            return this.#result;
        }

        subcall(t) {
            testSignature([Trace], arguments);
            if (t.result) throw new Error("Subcall already ended.");
            if (this.#result) throw new Error("Current call already ended.");
            this.#subcalls.push(t);
        }

        set returned(value) {
            testSignature([ANY], arguments);
            if (this.#result) throw new Error("Current call already ended, can't end twice.");
            this.#result = {ok: value};
        }

        set thrown(value) {
            testSignature([Error], arguments);
            if (this.#result) throw new Error("Current call already ended, can't end twice.");
            this.#result = {error: value, msg: value + ""};
        }
    }
    Object.freeze(Trace.prototype);

    class Production {
        #name;
        #namer;
        #memoized;
        #innerProductions;
        #innerParse;

        constructor(namer, memoized, innerProductions, innerParse) {
            testSignature([unionType(STRING, funcType(0)), BOOLEAN, unionType([Production], Production, funcType(0)), funcType(2)], arguments);
            this.checkFinal(Production);
            if (getType(namer) === STRING) {
                const n = namer;
                namer = () => n;
            }
            this.#namer = namer;
            this.#name = namer();
            this.#memoized = memoized;
            if (innerProductions instanceof Production) {
                innerProductions = [innerProductions];
            }
            if (innerProductions instanceof Array) {
                const arr = [...innerProductions]; // A copy, so changes in the given array can't corrupt this object.
                innerProductions = () => [...arr]; // Returns a copy, so changes in the returned array can't also corrupt this object.
            }
            this.#innerProductions = innerProductions;
            this.#innerParse = innerParse;
            Object.freeze(this);
        }

        parse(ctx) {
            testSignature([ParseContext], arguments);
            const tracing = new Trace(this, ctx);
            ctx.memo.pushTracingCall(tracing);
            try {
                let r;
                try {
                    r = this.#middleParse(ctx);
                } catch (e) {
                    tracing.thrown = e;
                    if (e instanceof ParseError) throw new ParseError(this, ctx.pos);
                    throw e;
                }
                tracing.returned = r;
                return r;
            } finally {
                ctx.memo.popTracingCall();
            }
        }

        #middleParse(ctx) {
            testSignature([ParseContext], arguments);
            const makeError = (function makeError() {
                testSignature([], arguments);
                throw new ParseError(this, ctx.pos);
            });
            if (!this.#memoized) {
                return this.#innerParse(ctx, makeError);
            }
            try {
                return ctx.memo.load(this, ctx.pos);
            } catch (e1) {
                if (!(e1 instanceof NotFoundError)) throw e1;
            }
            try {
                const out = this.#innerParse(ctx, makeError);
                testType(out, Parsed);
                ctx.memo.save(this, out);
                return out;
            } catch (e2) {
                if (!(e2 instanceof ParseError)) throw e2;
                ctx.memo.saveError(this, e2);
                throw e2;
            }
        }

        toString() {
            testSignature([], arguments);
            this.#name = this.#namer();
            return this.#name;
        }

        get name() {
            return this.toString();
        }

        get memoized() {
            return this.#memoized;
        }

        get innerProductions() {
            return this.#innerProductions();
        }
    }
    Object.freeze(Production.prototype);

    class Grammar {
        #root;
        #productions;

        constructor(root) {
            testSignature([Production], arguments);

            const pending = [root];
            const prods = {};

            while (pending.length >= 1) {
                const current = pending.pop();
                const alreadyHave = prods[current.name];
                if (alreadyHave === current) continue;
                if (alreadyHave) throw new Error(`Two or more productions can't have the same name in the same grammar: ${current.name}.`);
                prods[current.name] = current;
                pending.push(...current.innerProductions);
            }

            this.#root = root;
            this.#productions = prods;
        }

        get parse() {
            const root = this.#root;

            return (function parse(txt) {
                testSignature([unionType(STRING, Array)], arguments);
                const s = Source.create(txt);
                const ctx = s.start();
                try {
                    const result = root.parse(ctx);
                    return result.content;
                } finally {
                    console.log(ctx.memo.deadStacks);
                }
            });
        };
    }
    Object.freeze(Grammar.prototype);

    function literal(value, output = value, name = `Literal ${value}`) {
        testSignature([ANY, STRING, STRING], arguments);
        if (value.length === 0) throw new Error("The value is empty. Consider using the empty production instead.");

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            const len = value.length;
            const s = ctx.slice(len);
            if (s === value) return ctx.parsed(output, len);
            makeError();
        }

        return new Production(name, false, [], action);
    }

    function anyChar() {
        testSignature([], arguments);

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            const s = ctx.slice(1);
            if (s === "") makeError();
            return ctx.parsed(s, 1);
        }

        return new Production("Any character", false, [], action);
    }

    function bof() {
        testSignature([], arguments);
        let prod;

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            if (!ctx.begin) makeError();
            return ctx.parsed(prod, 0);
        }

        prod = new Production("BOF", false, [], action);
        return prod;
    }

    function eof() {
        testSignature([], arguments);
        let prod;

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            if (!ctx.end) makeError();
            return ctx.parsed(prod, 0);
        }

        prod = new Production("EOF", false, [], action);
        return prod;
    }

    function empty() {
        testSignature([], arguments);
        let prod;

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            return ctx.parsed(prod, 0);
        }

        prod = new Production("Empty", false, [], action);
        return prod;
    }

    function rejects() {
        testSignature([], arguments);

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            makeError();
        }

        return new Production("Rejects", false, [], action);
    }

    function sequence(name, ps, f = x => x) {
        testSignature([String, [Production], funcType(1)], arguments, 1);
        if (ps.length < 2) throw new Error("This sequence is too short to make sense.");

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            const a = ctx;
            const r = [];
            for (const p of ps) {
                const k = p.parse(ctx);
                r.push(k.content);
                ctx = ctx.on(k.to);
            }
            const fkt = f(r);
            return a.parsedTo(fkt, ctx.pos);
        }

        return new Production(name, true, ps, action);
    }

    function star(p, f = x => x) {
        testSignature([Production, funcType(1)], arguments, 1);

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            const a = ctx;
            const r = [];
            try {
                while (true) {
                    const k = p.parse(ctx);
                    r.push(k.content);
                    ctx = ctx.on(k.to);
                }
            } catch (e) {
                if (!(e instanceof ParseError)) throw e;
                const fkt = f(r);
                return a.parsedTo(fkt, ctx.pos);
            }
        }

        return new Production(() => p + "*", true, p, action);
    }

    function plus(p, f = x => x) {
        testSignature([Production, funcType(1)], arguments, 1);

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            const a = ctx;
            const r = [];
            try {
                while (true) {
                    const k = p.parse(ctx);
                    r.push(k.content);
                    ctx = ctx.on(k.to);
                }
            } catch (e) {
                if (!(e instanceof ParseError)) throw e;
                if (r.length === 0) makeError();
                const fkt = f(r);
                return a.parsedTo(fkt, ctx.pos);
            }
        }

        return new Production(() => p + "+", true, p, action);
    }

    function choice(name, ps, f = x => x) {
        testSignature([STRING, [Production], funcType(1, 2)], arguments, 1);
        if (ps.length < 2) throw new Error("This choice has too few options to make sense.");

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            for (const p of ps) {
                let k;
                try {
                    k = p.parse(ctx);
                } catch (e) {
                    if (!(e instanceof ParseError)) throw e;
                    continue;
                }
                const kt = k.content;
                const kd = k.data;
                const fkt = f(kt, kd);
                return k.withContent(fkt);
            }
            makeError();
        }

        return new Production(name, true, ps, action);
    }

    function has(p) {
        testSignature([Production], arguments);

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            const a = pos;
            const k = p.parse(ctx);
            return a.parsed(k, 0);
        }

        return new Production(() => "&" + p, true, p, action);
    }

    function hasNot(p) {
        testSignature([Production], arguments);

        let prod;
        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            try {
                p.parse(ctx);
            } catch (e) {
                if (!(e instanceof ParseError)) throw e;
                return ctx.parsed(prod, 0);
            }
            makeError(ctx);
        }

        prod = new Production(() => "!" + p, true, p, action);
        return prod;
    }

    function xform(name, memoized, p, f) {
        testSignature([STRING, BOOLEAN, Production, funcType(1, 2)], arguments);

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            const k = p.parse(ctx);
            const kt = k.content;
            const kd = k.data;
            const fkt = f(kt, kd);
            return k.withContent(fkt);
        }

        return new Production(name, memoized, p, action);
    }

    function warn(name, memoized, p, f) {
        testSignature([STRING, BOOLEAN, Production, funcType(1, 2)], arguments);

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            const k = p.parse(ctx);
            const kt = k.content;
            const kd = k.data;
            const fkt = f(kt, kd);
            testType(fkt, STRING);
            return k.addWarning(fkt);
        }

        return new Production(name, memoized, p, action);
    }

    function xformData(name, memoized, p, f) {
        testSignature([STRING, BOOLEAN, Production, funcType(1, 2)], arguments);

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            const k = p.parse(ctx);
            const kt = k.content;
            const kd = k.data;
            const fkt = f(kt, kd);
            return k.withData(fkt);
        }

        return new Production(name, memoized, p, action);
    }

    function test(name, memoized, p, f) {
        testSignature([STRING, BOOLEAN, Production, funcType(1, 2)], arguments);

        function action(ctx, makeError) {
            testSignature([ParseContext, funcType(0)], arguments);
            const k = p.parse(ctx);
            const kt = k.content;
            const kd = k.data;
            const fkt = f(kt, kd);
            testType(fkt, BOOLEAN);
            if (fkt) return k;
            makeError(ctx);
        };

        return new Production(name, memoized, p, action);
    }

    class LateBound {
        #outer;
        #inner;

        constructor(wrapper = x => x) {
            testSignature([funcType(1)], arguments, 1);

            this.#inner = null;
            const rawInner = () => this.#inner;

            function getInner() {
                testSignature([], arguments);
                const raw = rawInner();
                if (!raw) throw new Error("Inner production not bound yet.");
                return [raw];
            }

            function action(ctx, makeError) {
                testSignature([ParseContext, funcType(0)], arguments);
                return rawInner()[0].parse(ctx);
            }

            function toS() {
                testSignature([], arguments);
                const raw = rawInner();
                return raw ? raw + " (late bound)" : "<NOT BOUND>";
            }

            this.#outer = wrapper(new Production(toS, false, getInner, action));
        }

        set inner(inner) {
            testSignature([Production], arguments);
            if (this.#inner) throw new Error("Already set.");
            this.#inner = inner;
        }

        get production() {
            return this.#outer;
        }
    }
    Object.freeze(LateBound.prototype);

    class ProductionFactory {
        #wrapper;
        #anyChar;
        #bof;
        #eof;
        #empty;
        #rejects;
        #literal;
        #sequence;
        #star;
        #plus;
        #choice;
        #opt;
        #has;
        #hasNot;
        #xform;
        #warn;
        #xformData;
        #test;
        #lateBound;
        #alternation;
        #regroup;

        constructor(wrapper = x => x) {
            testSignature([funcType(1)], arguments, 1);
            this.checkFinal(ProductionFactory);
            this.#wrapper = wrapper;

            const me = this;
            const cAnyChar = wrapper(anyChar());
            const cBof = wrapper(bof());
            const cEof = wrapper(eof());
            const cEmpty = wrapper(empty());
            const cRejects = wrapper(rejects());

            this.#anyChar = (function anyChar() { testSignature([], arguments); return cAnyChar; });
            this.#bof     = (function bof    () { testSignature([], arguments); return cBof    ; });
            this.#eof     = (function eof    () { testSignature([], arguments); return cEof    ; });
            this.#empty   = (function empty  () { testSignature([], arguments); return cEmpty  ; });
            this.#rejects = (function rejects() { testSignature([], arguments); return cRejects; });

            const originalLiteral = literal;
            this.#literal = (function literal(value, output = value, name = undefined) {
                testSignature([STRING, STRING, unionType(STRING, UNDEFINED)], arguments, 2);
                return wrapper(originalLiteral(value, output, name));
            });

            const originalSequence = sequence;
            this.#sequence = (function sequence(name, ps, f = x => x) {
                testSignature([STRING, [Production], funcType(1)], arguments, 1);
                return wrapper(originalSequence(name, ps, f));
            });

            const originalStar = star;
            this.#star = (function star(p, f = x => x) {
                testSignature([Production, funcType(1)], arguments, 1);
                return wrapper(originalStar(p, f));
            });

            const originalPlus = plus;
            this.#plus = (function plus(p, f = x => x) {
                testSignature([Production, funcType(1)], arguments, 1);
                return wrapper(originalPlus(p, f));
            });

            const originalChoice = choice;
            this.#choice = (function choice(name, ps, f = x => x) {
                testSignature([STRING, [Production], funcType(1, 2)], arguments, 1);
                return wrapper(originalChoice(name, ps, f));
            });

            this.#opt = (function(p, defaultValue = cEmpty) {
                testSignature([Production, ANY], arguments, 1);
                return me.choice(p + "?", [p, xform(p + "? [NOT FOUND]", false, cEmpty, x => defaultValue)]);
            });

            const originalHas = has;
            this.#has = (function has(p) {
                testSignature([Production], arguments);
                return wrapper(originalHas(p));
            });

            const originalHasNot = hasNot;
            this.#hasNot = (function hasNot(p) => {
                testSignature([Production], arguments);
                return wrapper(originalHasNot(p));
            });

            const originalXform = xform;
            this.#xform = (function xform(name, memoized, p, f) {
                testSignature([STRING, BOOLEAN, Production, funcType(1, 2)], arguments);
                return wrapper(originalXform(name, memoized, p, f));
            });

            const originalWarn = warn;
            this.#warn = (function warn(name, memoized, p, f) {
                testSignature([STRING, BOOLEAN, Production, funcType(1, 2)], arguments);
                return wrapper(originalWarn(name, memoized, p, f));
            });

            const originalXformData = xformData;
            this.#xformData = (function xformData(name, memoized, p, f) {
                testSignature([STRING, BOOLEAN, Production, funcType(1, 2)], arguments);
                return wrapper(originalXformData(name, memoized, p, f));
            });

            const originalTest = test;
            this.#test = (function test(name, memoized, p, f) {
                testSignature([STRING, BOOLEAN, Production, funcType(1, 2)], arguments);
                return wrapper(originalTest(name, memoized, p, f));
            });

            this.#lateBound = (function lateBound() {
                testSignature([], arguments);
                return new LateBound(wrapper);
            });

            this.#alternation = (function alternation(p, q, f = x => x) {
                testSignature([Production, Production, funcType(1)], arguments, 1);

                function rearrange(x) {
                    const a = [x[0]];
                    const b = [];
                    for (const c of x[1]) {
                        b.push(c[0]);
                        a.push(c[1]);
                    }
                    return f([a, b]);
                }

                const continuation = me.sequence(q + " - " + p, [q, p]);
                const unp = me.sequence(`unprocessed alternating<${p}, ${q}>`, [p, me.star(continuation)]);
                return me.xform(`alternating<${p}, ${q}>`, true, unp, rearrange);
            });

            this.#regroup = (function regroup(name, ps, f = x => x) {
                testSignature([STRING, [Production], funcType(1)], arguments, 1);

                function rearrange(x) {
                    const out = [];
                    for (const g in ps) {
                        out.push([]);
                    }
                    for (const p of x) {
                        for (let i = 0; i < ps.length; i++) {
                            out[i].push(p[i]);
                        }
                    }
                    return f(out);
                }

                const part = me.star(me.sequence(`unprocessed ${name}`, ps));
                return me.xform(name, true, part, rearrange);
            });

            Object.freeze(this);
        }

        get anyChar    () { return this.#anyChar    ; }
        get bof        () { return this.#bof        ; }
        get eof        () { return this.#eof        ; }
        get empty      () { return this.#empty      ; }
        get rejects    () { return this.#rejects    ; }
        get literal    () { return this.#literal    ; }
        get sequence   () { return this.#sequence   ; }
        get star       () { return this.#star       ; }
        get plus       () { return this.#plus       ; }
        get choice     () { return this.#choice     ; }
        get opt        () { return this.#opt        ; }
        get has        () { return this.#has        ; }
        get hasNot     () { return this.#hasNot     ; }
        get xform      () { return this.#xform      ; }
        get warn       () { return this.#warn       ; }
        get xformData  () { return this.#xformData  ; }
        get test       () { return this.#test       ; }
        get lateBound  () { return this.#lateBound  ; }
        get alternation() { return this.#alternation; }
        get regroup    () { return this.#regroup    ; }

        static get Source       () { return Source       ; }
        static get ParsePosition() { return ParsePosition; }
        static get ParseError   () { return ParseError   ; }
        static get ParseContext () { return ParseContext ; }
        static get Memory       () { return Memory       ; }
        static get Production   () { return Production   ; }
        static get Grammar      () { return Grammar      ; }
        static get LateBound    () { return LateBound    ; }
        static get Warning      () { return Warning      ; }
        static get Trace        () { return Trace        ; }
    };
    Object.freeze(ProductionFactory.prototype);

    return ProductionFactory;
})();
