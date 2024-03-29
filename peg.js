"use strict";

// Check if those were correctly imported.
INT; FLOAT; BOOLEAN; FUNCTION; BIGINT; UNDEFINED; NULL; NAN; STRING; INFINITY; ANY; typeName; getType; orType; funcType; testType; [].checkFinal; [].checkAbstract;

const [Source, ParsePosition, Parsed, ParseError, ParseContext, Memory, Production, Grammar, LateBound, Trace, ProductionFactory] = (() => {

    function newUuid() {
        return URL.createObjectURL(new Blob([])).slice(-36);
    }

    class Source {
        #raw;
        #slicer;
        #length;
        #uuid;

        constructor(raw, slicer, length) {
            testType(raw, orType(STRING, Array));
            testType(slicer, funcType(2));
            testType(length, INT);
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
            testType(n, INT);
            if (n < 0 || n > this.length) throw new Error(`Bad value ${n} is not between 0 and ${this.length - 1}.`);
            return new ParsePosition(this, n);
        }

        slice(from, to) {
            testType(from, ParsePosition);
            testType(to, ParsePosition);
            if (from.src !== this) throw new Error(`Initial position is not from this source.`);
            if (to.src !== this) throw new Error(`End position is not from this source.`);
            return this.#slicer(from.location, to.location);
        }

        start() {
            return new ParseContext(this, new Memory(this), this.at(0));
        }

        static create(raw) {
            testType(raw, orType(STRING, Array));
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
            testType(src, Source);
            testType(location, INT);
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
            testType(n, INT);
            let p = this.location + n;
            if (p < 0) p = 0;
            if (p > this.src.length) p = this.src.length;
            return new ParsePosition(this.src, p);
        }

        slice(length) {
            testType(length, INT);
            return this.src.slice(this, this.move(length));
        }

        parsedTo(what, end) {
            testType(end, ParsePosition);
            return new Parsed(this.src, this, end, what);
        }

        parsed(what, size) {
            testType(size, INT);
            return this.parsedTo(what, this.move(size));
        }

        toString() {
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
            testType(src, Source);
            testType(from, ParsePosition);
            testType(to, ParsePosition);
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
            return `${this.src} from ${this.from} to ${this.to} [${this.content}]`;
        }
    }
    Object.freeze(Parsed.prototype);

    class ParseError extends Error {
        #pos;

        constructor(p, pos) {
            testType(p, Production);
            testType(pos, ParsePosition);
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
            testType(src, Source);
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
            testType(p, Production);
            let sub = this.#memo[p.name];
            if (!sub) {
                sub = this.#memo[p.name] = new Array(this.#src.length);
            }
            return sub;
        }

        save(p, what) {
            testType(p, Production);
            testType(what, Parsed);
            if (what.src !== this.#src) throw new Error(`Incompatible source, was ${what.src} expected ${this.#src}.`);
            this.#forProduction(p)[what.location] = what;
        }

        saveError(p, what) {
            testType(p, Production);
            testType(what, ParseError);
            if (what.src !== this.#src) throw new Error(`Incompatible source, was ${what.src} expected ${this.#src}.`);
            this.#forProduction(p)[what.location] = what;
        }

        load(p, pos) {
            testType(p, Production);
            testType(pos, ParsePosition);
            if (pos.src !== this.#src) throw new Error(`Incompatible source, was ${pos.src} expected ${this.#src}.`);
            const e = this.#forProduction(p)[pos.location];
            if (!e) throw new NotFoundError();
            if (e instanceof ParseError) throw e;
            return e;
        }

        toString() {
            return `{src: ${this.src}}`;
        }

        pushTracingCall(call) {
            testType(call, Trace);
            if (this.#tracingCalls.length > 0) this.#tracingCalls.at(-1).subcall(call);
            this.#tracingCalls.push(call);
        }

        popTracingCall() {
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
            testType(pos, ParsePosition);
            testType(text, STRING);
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
            testType(src, Source);
            testType(memo, Memory);
            testType(pos, ParsePosition);
            testType(data, Object);
            testType(warnings, [Warning]);
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
            return this.pos.move(n);
        }

        slice(length) {
            testType(length, INT);
            return this.pos.slice(length);
        }

        parsedTo(what, end) {
            testType(end, ParsePosition);
            return this.pos.parsedTo(what, end);
        }

        parsed(what, size) {
            testType(size, INT);
            return this.pos.parsed(what, size);
        }

        on(otherPos) {
            testType(otherPos, ParsePosition);
            if (otherPos.src !== this.src) throw new Error(`Incompatible source, was ${otherPos.src} expected ${this.src}.`);
            return new ParseContext(this.#src, this.#memo, otherPos, this.#data, this.#warnings);
        }

        withData(newData) {
            testType(newData, Object);
            return new ParseContext(this.#src, this.#memo, this.#pos, { ...newData }, this.#warnings);
        }

        addWarning(warning) {
            testType(warning, STRING);
            return new ParseContext(this.#src, this.#memo, this.#pos, this.#data, [...this.#warnings, new Warning(this.pos, warning)]);
        }

        get data() {
            return {...this.#data};
        }

        get warnings() {
            return [...this.#warnings];
        }

        toString() {
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
            testType(production, Production);
            testType(ctx, ParseContext);
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
            testType(t, Trace);
            if (t.result) throw new Error("Subcall already ended.");
            if (this.#result) throw new Error("Current call already ended.");
            this.#subcalls.push(t);
        }

        set returned(value) {
            if (this.#result) throw new Error("Current call already ended, can't end twice.");
            this.#result = {ok: value};
        }

        set thrown(value) {
            testType(value, Error);
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
            testType(namer, orType(STRING, funcType(0)));
            testType(memoized, BOOLEAN);
            testType(innerProductions, orType([Production], Production, funcType(0)));
            testType(innerParse, funcType(2));
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
                const arr = [...innerProductions];
                innerProductions = () => [...arr];
            }
            this.#innerProductions = innerProductions;
            this.#innerParse = innerParse;
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
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
            testType(ctx, ParseContext);
            const makeError = () => { throw new ParseError(this, ctx.pos); };
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
            testType(root, Production);

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

            return function parse(txt) {
                testType(txt, orType(STRING, Array));
                const s = Source.create(txt);
                const ctx = s.start();
                try {
                    const result = root.parse(ctx);
                    return result.content;
                } finally {
                    console.log(ctx.memo.deadStacks);
                }
            };
        };
    }
    Object.freeze(Grammar.prototype);

    function literal(value, output = value, name = `Literal ${value}`) {
        testType(value, STRING);
        testType(name, STRING);
        if (value.length === 0) throw new Error("The value is empty. Consider using the empty production instead.");

        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            const len = value.length;
            const s = ctx.slice(len);
            if (s === value) return ctx.parsed(output, len);
            makeError();
        };

        return new Production(name, false, [], action);
    }

    function anyChar() {
        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            const s = ctx.slice(1);
            if (s === "") makeError();
            return ctx.parsed(s, 1);
        };
        return new Production("Any character", false, [], action);
    }

    function bof() {
        let prod;
        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            if (!ctx.begin) makeError();
            return ctx.parsed(prod, 0);
        };
        prod = new Production("BOF", false, [], action);
        return prod;
    }

    function eof() {
        let prod;
        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            if (!ctx.end) makeError();
            return ctx.parsed(prod, 0);
        };
        prod = new Production("EOF", false, [], action);
        return prod;
    }

    function empty() {
        let prod;
        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            return ctx.parsed(prod, 0);
        };
        prod = new Production("Empty", false, [], action);
        return prod;
    }

    function rejects() {
        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            makeError();
        };
        return new Production("Rejects", false, [], action);
    }

    function sequence(name, ps, f = x => x) {
        testType(name, STRING);
        testType(ps, [Production]);
        testType(f, funcType(1));
        if (ps.length < 2) throw new Error("This sequence is too short to make sense.");

        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            const a = ctx;
            const r = [];
            for (const p of ps) {
                const k = p.parse(ctx);
                r.push(k.content);
                ctx = ctx.on(k.to);
            }
            const fkt = f(r);
            return a.parsedTo(fkt, ctx.pos);
        };

        return new Production(name, true, ps, action);
    }

    function star(p, f = x => x) {
        testType(p, Production);
        testType(f, funcType(1));

        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
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
        };

        return new Production(() => p + "*", true, p, action);
    }

    function plus(p, f = x => x) {
        testType(p, Production);
        testType(f, funcType(1));

        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
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
        };

        return new Production(() => p + "+", true, p, action);
    }

    function choice(name, ps, f = x => x) {
        testType(name, STRING);
        testType(ps, [Production]);
        testType(f, funcType(1, 2));
        if (ps.length < 2) throw new Error("This choice has too few options to make sense.");

        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
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
        };

        return new Production(name, true, ps, action);
    }

    function has(p) {
        testType(p, Production);

        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            const a = pos;
            const k = p.parse(ctx);
            return a.parsed(k, 0);
        };

        return new Production(() => "&" + p, true, p, action);
    }

    function hasNot(p) {
        testType(p, Production);

        let prod;
        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            try {
                p.parse(ctx);
            } catch (e) {
                if (!(e instanceof ParseError)) throw e;
                return ctx.parsed(prod, 0);
            }
            makeError(ctx);
        };

        prod = new Production(() => "!" + p, true, p, action);
        return prod;
    }

    function xform(name, memoized, p, f) {
        testType(name, STRING);
        testType(p, Production);
        testType(f, funcType(1, 2));

        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            const k = p.parse(ctx);
            const kt = k.content;
            const kd = k.data;
            const fkt = f(kt, kd);
            return k.withContent(fkt);
        };

        return new Production(name, memoized, p, action);
    }

    function warn(name, memoized, p, f) {
        testType(name, STRING);
        testType(p, Production);
        testType(f, funcType(1, 2));

        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            const k = p.parse(ctx);
            const kt = k.content;
            const kd = k.data;
            const fkt = f(kt, kd);
            testType(fkt, STRING);
            return k.addWarning(fkt);
        };

        return new Production(name, memoized, p, action);
    }

    function xformData(name, memoized, p, f) {
        testType(name, STRING);
        testType(p, Production);
        testType(f, funcType(1, 2));

        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
            const k = p.parse(ctx);
            const kt = k.content;
            const kd = k.data;
            const fkt = f(kt, kd);
            return k.withData(fkt);
        };

        return new Production(name, memoized, p, action);
    }

    function test(name, memoized, p, f) {
        testType(name, STRING);
        testType(p, Production);
        testType(f, funcType(1, 2));

        const action = (ctx, makeError) => {
            testType(ctx, ParseContext);
            testType(makeError, funcType(0));
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
            testType(wrapper, funcType(1));

            this.#inner = null;
            const getInner = () => {
                if (!this.#inner) throw new Error("Inner production not bound yet.");
                return [this.#inner];
            };

            const action = (ctx, makeError) => {
                testType(ctx, ParseContext);
                testType(makeError, funcType(0));
                return getInner()[0].parse(ctx);
            };

            const toS = () => this.#inner ? this.#inner + " (late bound)" : "<NOT BOUND>";

            this.#outer = wrapper(new Production(toS, false, getInner, action));
        }

        set inner(inner) {
            testType(inner, Production);
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
            testType(wrapper, funcType(1));
            this.checkFinal(ProductionFactory);
            this.#wrapper = wrapper;

            const cAnyChar = wrapper(anyChar());
            const cBof = wrapper(bof());
            const cEof = wrapper(eof());
            const cEmpty = wrapper(empty());
            const cRejects = wrapper(rejects());

            this.#anyChar = () => cAnyChar;
            this.#bof = () => cBof;
            this.#eof = () => cEof;
            this.#empty = () => cEmpty;
            this.#rejects = () => cRejects;

            this.#literal = (value, output = value, name = undefined) => {
                testType(value, STRING);
                return this.#wrapper(literal(value, output, name));
            };

            this.#sequence = (name, ps, f = x => x) => {
                testType(name, STRING);
                testType(ps, [Production]);
                testType(f, funcType(1));
                return this.#wrapper(sequence(name, ps, f));
            };

            this.#star = (p, f = x => x) => {
                testType(p, Production);
                testType(f, funcType(1));
                return this.#wrapper(star(p, f));
            };

            this.#plus = (p, f = x => x) => {
                testType(p, Production);
                testType(f, funcType(1));
                return this.#wrapper(plus(p, f));
            };

            this.#choice = (name, ps, f = x => x) => {
                testType(name, STRING);
                testType(ps, [Production]);
                testType(f, funcType(1, 2));
                return this.#wrapper(choice(name, ps, f));
            };

            this.#opt = (p, defaultValue = cEmpty) => {
                testType(p, Production);
                return this.choice(p + "?", [p, xform(p + "? [NOT FOUND]", false, cEmpty, x => defaultValue)]);
            };

            this.#has = (p) => {
                testType(p, Production);
                return this.#wrapper(has(p));
            };

            this.#hasNot = (p) => {
                testType(p, Production);
                return this.#wrapper(hasNot(p));
            };

            this.#xform = (name, memoized, p, f) => {
                testType(name, STRING);
                testType(memoized, BOOLEAN);
                testType(p, Production);
                testType(f, funcType(1, 2));
                return this.#wrapper(xform(name, memoized, p, f));
            };

            this.#warn = (name, memoized, p, f) => {
                testType(name, STRING);
                testType(memoized, BOOLEAN);
                testType(p, Production);
                testType(f, funcType(1, 2));
                return this.#wrapper(warn(name, memoized, p, f));
            };

            this.#xformData = (name, memoized, p, f) => {
                testType(name, STRING);
                testType(memoized, BOOLEAN);
                testType(p, Production);
                testType(f, funcType(1, 2));
                return this.#wrapper(xformData(name, memoized, p, f));
            };

            this.#test = (name, memoized, p, f) => {
                testType(name, STRING);
                testType(memoized, BOOLEAN);
                testType(p, Production);
                testType(f, funcType(1, 2));
                return this.#wrapper(test(name, memoized, p, f));
            };

            this.#lateBound = () => {
                return new LateBound(this.#wrapper);
            };

            this.#alternation = (p, q, f = x => x) => {
                testType(p, Production);
                testType(q, Production);
                testType(f, funcType(1));

                function rearrange(x) {
                    const a = [x[0]];
                    const b = [];
                    for (const c of x[1]) {
                        b.push(c[0]);
                        a.push(c[1]);
                    }
                    return f([a, b]);
                }

                const continuation = this.sequence(q + " - " + p, [q, p]);
                const unp = this.sequence(`unprocessed alternating<${p}, ${q}>`, [p, this.star(continuation)]);
                return this.xform(`alternating<${p}, ${q}>`, true, unp, rearrange);
            };

            this.#regroup = (name, ps, f = x => x) => {
                testType(name, STRING);
                testType(ps, [Production]);
                testType(f, funcType(1));

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

                const part = this.star(this.sequence(`unprocessed ${name}`, ps));
                return this.xform(name, true, part, rearrange);
            };

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
        get test       () { return this.#test       ; }
        get lateBound  () { return this.#lateBound  ; }
        get alternation() { return this.#alternation; }
        get regroup    () { return this.#regroup    ; }
    };
    Object.freeze(ProductionFactory.prototype);

    return [Source, ParsePosition, Parsed, ParseError, ParseContext, Memory, Production, Grammar, LateBound, Trace, ProductionFactory];
})();
