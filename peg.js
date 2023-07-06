"use strict";

const [Source, ParsePosition, Parsed, ParseError, Production, Literal, AnyChar, Bof, Eof, Empty, Sequence, Star, Choice, Has, HasNot, Xform, Test, LateBound] = (() => {
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

        static forString(raw) {
            testType(raw, STRING);
            return new Source(raw, (b, c) => raw.substring(b, c), raw.length);
        }

        static forArray(raw) {
            testType(raw, Array);
            return new Source(raw, (b, c) => raw.slice(b, c), raw.length);
        }
    }

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

        move(n) {
            testType(n, INT);
            let p = this.location + n;
            if (p < 0) p = 0;
            if (p > this.src.length) p = this.src.length;
            return new ParsePosition(this.src, p);
        }

        parsedTo(what, end) {
            return new Parsed(this.src, this, end, what);
        }

        parsed(what, size) {
            return this.parsedTo(what, this.move(size));
        }
    }

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

    class ParseError extends Error {
        constructor(p, pos) {
            testType(p, Production);
            testType(pos, ParsePosition);
            super(`${p} not found at ${pos.location}.`);
        }
    }

    class Production {
        constructor() {
            this.checkAbstract(Production);
        }

        parse(pos) {
            throw new TypeError("Abstract");
        }

        error(pos) {
            testType(pos, ParsePosition);
            throw new ParseError(this, pos);
        }

        toString() {
            return this.constructor.name;
        }
    }

    class Literal extends Production {
        #value;

        constructor(value) {
            testType(value, STRING);
            super();
            this.checkFinal(Literal);
            this.#value = value;
            Object.freeze(this);
        }

        parse(pos) {
            testType(pos, ParsePosition);
            const len = this.#value.length;
            const s = pos.src.slice(pos, pos.move(len));
            if (s === this.#value) return pos.parsed(s, len);
            this.error(pos);
        }

        toString() {
            return `"LITERAL ${this.#value}"`;
        }
    }

    class AnyChar extends Production {

        constructor() {
            super();
            this.checkFinal(AnyChar);
            Object.freeze(this);
        }

        parse(pos) {
            testType(pos, ParsePosition);
            const s = pos.src.slice(pos, pos.move(1));
            if (s === "") this.error(pos);
            return pos.parsed(s, 1);
        }
    }

    class Bof extends Production {

        constructor() {
            super();
            this.checkFinal(Bof);
            Object.freeze(this);
        }

        parse(pos) {
            testType(pos, ParsePosition);
            if (pos.location !== 0) this.error(pos);
            return pos.parsed(this, 0);
        }
    }

    class Eof extends Production {

        constructor() {
            super();
            this.checkFinal(Eof);
            Object.freeze(this);
        }

        parse(pos) {
            testType(pos, ParsePosition);
            if (pos.location !== pos.src.length) this.error(pos);
            return pos.parsed(this, 0);
        }
    }

    class Empty extends Production {

        constructor() {
            super();
            this.checkFinal(Empty);
            Object.freeze(this);
        }

        parse(pos) {
            testType(pos, ParsePosition);
            return pos.parsed(this, 0);
        }
    }

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

        parse(pos) {
            testType(pos, ParsePosition);
            const a = pos;
            const r = [];
            for (const p of this.#ps) {
                const k = p.parse(pos);
                r.push(k.content);
                pos = k.to;
            }
            return a.parsedTo(r, pos);
        }

        toString() {
            return this.#name;
        }
    }

    class Star extends Production {
        #p;

        constructor(p) {
            testType(p, Production);
            super();
            this.checkFinal(Star);
            this.#p = p;
            Object.freeze(this);
        }

        parse(pos) {
            testType(pos, ParsePosition);
            const a = pos;
            const r = [];
            while (true) {
                try {
                    const k = this.#p.parse(pos);
                    r.push(k.content);
                    pos = k.to;
                } catch (e) {
                    if (!(e instanceof ParseError)) throw e;
                    return a.parsedTo(r, pos);
                }
            }
        }

        toString() {
            return this.#p + "*";
        }
    }

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

        parse(pos) {
            testType(pos, ParsePosition);
            for (const p of this.#ps) {
                try {
                    return p.parse(pos);
                } catch (e) {
                    if (!(e instanceof ParseError)) throw e;
                }
            }
            return this.error(pos);
        }

        toString() {
            return this.#name;
        }
    }

    class Has extends Production {
        #p;

        constructor(p) {
            testType(p, Production);
            super();
            this.checkFinal(Has);
            this.#p = p;
            Object.freeze(this);
        }

        parse(pos) {
            testType(pos, ParsePosition);
            const a = pos.from;
            const k = this.#p.parse(pos);
            return a.parsed(k, 0);
        }

        toString() {
            return "&" + this.#p;
        }
    }

    class HasNot extends Production {
        #p;

        constructor(p) {
            testType(p, Production);
            super();
            this.checkFinal(HasNot);
            this.#p = p;
            Object.freeze(this);
        }

        parse(pos) {
            testType(pos, ParsePosition);
            try {
                this.#p.parse(pos);
            } catch (e) {
                if (!(e instanceof ParseError)) throw e;
                return pos.parsed(this, 0);
            }
            this.error(pos);
        }

        toString() {
            return "!" + this.#p;
        }
    }

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

        parse(pos) {
            testType(pos, ParsePosition);
            const k = this.#p.parse(pos);
            return k.withContent(this.#f(k.content));
        }

        toString() {
            return this.#name;
        }
    }

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

        parse(pos) {
            testType(pos, ParsePosition);
            const k = this.#p.parse(pos);
            if (this.#f(k.content)) return k;
            this.error(pos);
        }

        toString() {
            return this.#name;
        }
    }

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

        parse(pos) {
            const p = this.#p;
            if (!p) throw new Error("Not set yet.");
            testType(pos, ParsePosition);
            return p.parse(pos);
        }

        toString() {
            return (this.#p || "<unbounded>") + "";
        }
    }

    return [Source, ParsePosition, Parsed, ParseError, Production, Literal, AnyChar, Bof, Eof, Empty, Sequence, Star, Choice, Has, HasNot, Xform, Test, LateBound];
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

    /*notChars: function(name, values) {
        testType(name, STRING);
        testType(values, [STRING]);
        return test(name, productions.anyChar, z => !values.includes(z));
    },*/

    sequence: function sequence(name, ps) {
        testType(name, STRING);
        testType(ps, [Production]);
        return new Sequence(name, ps);
    },

    star: function star(p) {
        testType(p, Production);
        return new Star(p);
    },

    plus: function plus(p) {
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
        return new Xform(name, p, f);
    },

    test: function test(name, p, f) {
        testType(name, STRING);
        testType(p, Production);
        testType(f, FUNCTION);
        return new Test(name, p, f);
    },

    alternation: function alternation(p, q) {
        function rearrage(x) {
            const a = [x[0]];
            const b = [];
            for (const c of x[1]) {
                b.push(c[0]);
                a.push(c[1]);
            }
            return [a, b];
        }

        testType(p, Production);
        testType(q, Production);
        const continuation = productions.sequence(q + p, [q, p]);
        return productions.xform(`alternating<${p}, ${q}>`, productions.sequence(`unprocessed alternating<${p}, ${q}>`, [p, productions.star(continuation)]), rearrage);
    }
};

Object.freeze(productions);