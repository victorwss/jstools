"use strict";

// Check if those were correctly imported.
INT; FLOAT; BOOLEAN; FUNCTION; BIGINT; UNDEFINED; NULL; NAN; STRING; INFINITY; ANY; typeName; getType; orType; testType; [].checkFinal; [].checkAbstract;

const [Source, ParsePosition, Parsed, ParseError, ParseContext, Memory, Production, Literal, AnyChar, Bof, Eof, Empty, Sequence, Star, Choice, Has, HasNot, Xform, Test, LateBound, Memoized] = (() => {
    class Source {

        #raw;
        #slicer;
        #length;

        constructor(raw, slicer, length) {
            testType(slicer, FUNCTION);
            testType(length, INT);
            this.checkFinal(Source);
            this.#slicer = slicer;
            this.#raw = raw;
            this.#length = length;
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
            if (n < 0 || n > this.length) throw new ValueError();
            return new ParsePosition(this, n);
        }

        slice(from, to) {
            testType(from, ParsePosition);
            testType(to, ParsePosition);
            if (from.src !== this) throw new ValueError();
            if (to.src !== this) throw new ValueError();
            return this.#slicer(from.location, to.location);
        }

        start() {
            return new ParseContext(this, new Memory(this), this.at(0));
        }

        static forString(raw) {
            testType(raw, STRING);
            return new Source(raw, (b, c) => raw.substring(b, c), raw.length);
        }

        static forArray(raw) {
            testType(raw, Array);
            return new Source(raw, (b, c) => raw.slice(b, c), raw.length);
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
            if (location < 0 || location > src.length) throw new ValueError();
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
            return new Parsed(this.src, this, end, what);
        }

        parsed(what, size) {
            return this.parsedTo(what, this.move(size));
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
            if (from.src !== src) throw new ValueError();
            if (to.src !== src) throw new ValueError();
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
    }
    Object.freeze(Parsed.prototype);

    class ParseError extends Error {
        #pos;

        constructor(p, pos) {
            testType(p, Production);
            testType(pos, ParsePosition);
            super(`${p} not found at ${pos.location}.`);
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

        constructor(src) {
            testType(src, Source);
            this.#src = src;
            this.#memo = {};
        }

        get src() {
            return this.#src;
        }

        #forProduction(p) {
            testType(p, Production);
            let sub = this.#memo[p.uuid];
            if (!sub) {
                sub = this.#memo[p.uuid] = new Array(this.#src.length);
            }
            return sub;
        }

        save(p, what) {
            testType(p, Production);
            testType(what, Parsed);
            if (what.src !== this.#src) throw new ValueError("Incompatible source.");
            this.#forProduction(p)[what.location] = what;
        }

        saveError(p, what) {
            testType(p, Production);
            testType(what, ParseError);
            if (what.src !== this.#src) throw new ValueError("Incompatible source.");
            this.#forProduction(p)[what.location] = what;
        }

        load(p, pos) {
            testType(p, Production);
            testType(pos, ParsePosition);
            if (pos.src !== this.#src) throw new ValueError("Incompatible source.");
            const e = this.#forProduction(p)[pos.location];
            if (!e) throw new NotFoundError();
            if (e instanceof ParseError) throw e;
            return e;
        }
    }
    Object.freeze(Memory.prototype);

    class ParseContext {
        #src;
        #memo;
        #pos;

        constructor(src, memo, pos) {
            testType(src, Source);
            testType(memo, Memory);
            testType(pos, ParsePosition);
            if (pos.src !== src) throw new ValueError("Incompatible source.");
            this.#src = src;
            this.#memo = memo;
            this.#pos = pos;
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
            return this.pos.slice(length);
        }

        parsedTo(what, end) {
            return this.pos.parsedTo(what, end);
        }

        parsed(what, size) {
            return this.pos.parsed(what, size);
        }

        on(otherPos) {
            testType(otherPos, ParsePosition);
            if (otherPos.src !== this.src) throw new ValueError("Incompatible source.");
            return new ParseContext(this.src, this.memo, otherPos);
        }
    }
    Object.freeze(ParseContext.prototype);

    class Production {
        #uuid;

        constructor() {
            this.checkAbstract(Production);
            this.#uuid = URL.createObjectURL(new Blob([])).slice(-36);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            throw new TypeError("Abstract");
        }

        error(ctx) {
            testType(ctx, ParseContext);
            throw new ParseError(this, ctx.pos);
        }

        toString() {
            return this.constructor.name;
        }

        get uuid() {
            return this.#uuid;
        }
    }
    Object.freeze(Production.prototype);

    class Literal extends Production {
        #value;

        constructor(value) {
            testType(value, STRING);
            super();
            this.checkFinal(Literal);
            this.#value = value;
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            const len = this.#value.length;
            const s = ctx.slice(len);
            if (s === this.#value) return ctx.parsed(s, len);
            this.error(ctx);
        }

        toString() {
            return `"LITERAL ${this.#value}"`;
        }
    }
    Object.freeze(Literal.prototype);

    class AnyChar extends Production {

        constructor() {
            super();
            this.checkFinal(AnyChar);
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            const s = ctx.slice(1);
            if (s === "") this.error(ctx);
            return ctx.parsed(s, 1);
        }
    }
    Object.freeze(AnyChar.prototype);

    class Bof extends Production {

        constructor() {
            super();
            this.checkFinal(Bof);
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            if (!ctx.begin) this.error(ctx);
            return ctx.parsed(this, 0);
        }
    }
    Object.freeze(Bof.prototype);

    class Eof extends Production {

        constructor() {
            super();
            this.checkFinal(Eof);
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            if (!ctx.end) this.error(ctx);
            return ctx.parsed(this, 0);
        }
    }
    Object.freeze(Eof.prototype);

    class Empty extends Production {

        constructor() {
            super();
            this.checkFinal(Empty);
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            return ctx.parsed(this, 0);
        }
    }
    Object.freeze(Empty.prototype);

    class Sequence extends Production {
        #name;
        #ps;

        constructor(name, ps) {
            testType(name, STRING);
            testType(ps, [Production]);
            super();
            this.checkFinal(Sequence);
            this.#name = name;
            this.#ps = ps;
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            const a = ctx;
            const r = [];
            for (const p of this.#ps) {
                const k = p.parse(ctx);
                r.push(k.content);
                ctx = ctx.on(k.to);
            }
            return a.parsedTo(r, ctx.pos);
        }

        toString() {
            return this.#name;
        }
    }
    Object.freeze(Sequence.prototype);

    class Star extends Production {
        #p;

        constructor(p) {
            testType(p, Production);
            super();
            this.checkFinal(Star);
            this.#p = p;
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            const a = ctx;
            const r = [];
            while (true) {
                try {
                    const k = this.#p.parse(ctx);
                    r.push(k.content);
                    ctx = ctx.on(k.to);
                } catch (e) {
                    if (!(e instanceof ParseError)) throw e;
                    return a.parsedTo(r, ctx.pos);
                }
            }
        }

        toString() {
            return this.#p + "*";
        }
    }
    Object.freeze(Star.prototype);

    class Choice extends Production {
        #name;
        #ps;

        constructor(name, ps) {
            testType(name, STRING);
            testType(ps, [Production]);
            super();
            this.checkFinal(Choice);
            this.#name = name;
            this.#ps = ps;
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            for (const p of this.#ps) {
                try {
                    return p.parse(ctx);
                } catch (e) {
                    if (!(e instanceof ParseError)) throw e;
                }
            }
            return this.error(ctx);
        }

        toString() {
            return this.#name;
        }
    }
    Object.freeze(Choice.prototype);

    class Has extends Production {
        #p;

        constructor(p) {
            testType(p, Production);
            super();
            this.checkFinal(Has);
            this.#p = p;
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            const a = pos;
            const k = this.#p.parse(ctx);
            return a.parsed(k, 0);
        }

        toString() {
            return "&" + this.#p;
        }
    }
    Object.freeze(Has.prototype);

    class HasNot extends Production {
        #p;

        constructor(p) {
            testType(p, Production);
            super();
            this.checkFinal(HasNot);
            this.#p = p;
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            try {
                this.#p.parse(ctx);
            } catch (e) {
                if (!(e instanceof ParseError)) throw e;
                return ctx.parsed(this, 0);
            }
            this.error(ctx);
        }

        toString() {
            return "!" + this.#p;
        }
    }
    Object.freeze(HasNot.prototype);

    class Xform extends Production {
        #name;
        #p;
        #f;

        constructor(name, p, f) {
            testType(name, STRING);
            testType(p, Production);
            testType(f, FUNCTION);
            super();
            this.checkFinal(Xform);
            this.#name = name;
            this.#p = p;
            this.#f = f;
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            const k = this.#p.parse(ctx);
            return k.withContent(this.#f(k.content));
        }

        toString() {
            return this.#name;
        }
    }
    Object.freeze(Xform.prototype);

    class Test extends Production {
        #name;
        #p;
        #f;

        constructor(name, p, f) {
            testType(name, STRING);
            testType(p, Production);
            testType(f, FUNCTION);
            super();
            this.checkFinal(Test);
            this.#name = name;
            this.#p = p;
            this.#f = f;
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            const k = this.#p.parse(ctx);
            if (this.#f(k.content)) return k;
            this.error(ctx);
        }

        toString() {
            return this.#name;
        }
    }
    Object.freeze(Test.prototype);

    class LateBound extends Production {
        #p;

        constructor() {
            super();
            Object.seal(this);
        }

        set inner(p) {
            testType(p, Production);
            this.#p = p;
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            const p = this.#p;
            if (!p) throw new Error("Not set yet.");
            return p.parse(ctx);
        }

        toString() {
            return (this.#p || "<unbounded>") + "";
        }
    }
    Object.freeze(LateBound.prototype);

    class Memoized extends Production {
        #p;

        constructor(p) {
            testType(p, Production);
            super();
            this.checkFinal(Memoized);
            this.#p = p;
            Object.freeze(this);
        }

        parse(ctx) {
            testType(ctx, ParseContext);
            try {
                return ctx.memo.load(this, ctx.pos);
            } catch (e1) {
                if (!(e1 instanceof NotFoundError)) throw e1;
            }
            try {
                const out = this.#p.parse(ctx);
                ctx.memo.save(this, out);
                return out;
            } catch (e2) {
                if (!(e2 instanceof ParseError)) throw e2;
                ctx.memo.saveError(this, e2);
                throw e2;
            }
        }

        toString() {
            return `[memoized ${this.#p}]`;
        }
    }
    Object.freeze(Memoized.prototype);

    return [Source, ParsePosition, Parsed, ParseError, ParseContext, Memory, Production, Literal, AnyChar, Bof, Eof, Empty, Sequence, Star, Choice, Has, HasNot, Xform, Test, LateBound, Memoized];
})();

const productions = {
    anyChar: new AnyChar(),
    bof: new Bof(),
    eof: new Eof(),
    empty: new Empty(),

    literal: function literal(value) {
        testType(value, STRING);
        return new Literal(value);
    },

    sequence: function sequence(name, ps) {
        testType(name, STRING);
        testType(ps, [Production]);
        return productions.memo(new Sequence(name, ps));
    },

    star: function star(p) {
        testType(p, Production);
        return productions.memo(new Star(p));
    },

    plus: function plus(p) {
        testType(p, Production);
        return productions.test(p + "+", productions.star(p), z => z.length > 0);
    },

    choice: function choice(name, ps) {
        testType(name, STRING);
        testType(ps, [Production]);
        return new Choice(name, ps);
    },

    opt: function opt(p) {
        testType(p, Production);
        return productions.choice(p + "?", [p, productions.empty]);
    },

    has: function has(p) {
        testType(p, Production);
        return new Has(p);
    },

    hasNot: function hasNot(p) {
        testType(p, Production);
        return new HasNot(p);
    },

    xform: function xform(name, p, f) {
        testType(name, STRING);
        testType(p, Production);
        testType(f, FUNCTION);
        return productions.memo(new Xform(name, p, f));
    },

    test: function test(name, p, f) {
        testType(name, STRING);
        testType(p, Production);
        testType(f, FUNCTION);
        return productions.memo(new Test(name, p, f));
    },

    memo: function memo(p) {
        testType(p, Production);
        if (p instanceof Memoized) return p;
        return new Memoized(p);
    },

    alternation: function alternation(p, q) {
        testType(p, Production);
        testType(q, Production);

        function rearrange(x) {
            const a = [x[0]];
            const b = [];
            for (const c of x[1]) {
                b.push(c[0]);
                a.push(c[1]);
            }
            return [a, b];
        }

        const continuation = productions.sequence(q + " - " + p, [q, p]);
        const unp = productions.sequence(`unprocessed alternating<${p}, ${q}>`, [p, productions.star(continuation)]);
        return productions.xform(`alternating<${p}, ${q}>`, unp, rearrange);
    },

    regroup: function regroup(name, ps) {
        testType(name, STRING);
        testType(ps, [Production]);

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
            return out;
        }

        const part = productions.star(productions.sequence(`unprocessed ${name}`, ps));
        return productions.xform(name, part, rearrange);
    }
};

Object.freeze(productions);