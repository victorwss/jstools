"use strict";

// Check if this was correctly imported.
Types;

const BIGINT = Types.BIGINT;
const FLOAT = Types.FLOAT;
const STRING = Types.STRING;
const testSignature = Types.testSignature;
const getType = Types.getType;

// Copied from https://stackoverflow.com/a/78431217/540552.
function getNumberParts(x) {
    testSignature([FLOAT], arguments);
    const asDouble = new Float64Array(1);
    const asBytes = new Uint8Array(asDouble.buffer);

    asDouble[0] = x;

    const sign = asBytes[7] >> 7;
    const exponent = ((asBytes[7] & 0x7f) << 4 | asBytes[6] >> 4);

    asBytes[7] = 0x43;
    asBytes[6] &= 0x0f;
    asBytes[6] |= 0x30;

    const value = BigInt(asDouble[0]);
    const mantissaBits = value - 2n ** 52n;
    const denormal = exponent === -1023;

    return {
        sign: sign * -2 + 1,
        signBit: sign,
        denormal: denormal,
        rawExponent: exponent,
        biasedExponent: exponent - 1023,
        mantissaBits: Number(mantissaBits),
        mantissaValue: denormal ? mantissaBits : value
    };
}

class RoundingMode {
    static #TOWARDS_ZERO              = new RoundingMode();
    static #TOWARDS_POSITIVE_INFINITY = new RoundingMode();
    static #TOWARDS_NEGATIVE_INFINITY = new RoundingMode();
    static #TOWARDS_EVEN              = new RoundingMode();
    static #TOWARDS_ODD               = new RoundingMode();

    constructor() {
        if (this.constructor !== RoundingMode) throw new TypeError("RoundingMode can't be subclassed");
    }

    static get TOWARDS_ZERO             () { return RoundingMode.#TOWARDS_ZERO             ; }
    static get TOWARDS_POSITIVE_INFINITY() { return RoundingMode.#TOWARDS_POSITIVE_INFINITY; }
    static get TOWARDS_NEGATIVE_INFINITY() { return RoundingMode.#TOWARDS_NEGATIVE_INFINITY; }
    static get TOWARDS_EVEN             () { return RoundingMode.#TOWARDS_EVEN             ; }
    static get TOWARDS_ODD              () { return RoundingMode.#TOWARDS_ODD              ; }
}

class BigRational {
    #numerator;
    #denominator;
    static #F_0   = new BigRational( 0n, 1n);
    static #F_1   = new BigRational( 1n, 1n);
    static #F_2   = new BigRational( 2n, 1n);
    static #F_3   = new BigRational( 3n, 1n);

    constructor(numerator, denominator) {
        if (this.constructor !== BigRational) throw new TypeError("BigRational can't be subclassed");
        testSignature([BIGINT, BIGINT], arguments);
        if (denominator === 0n) throw new ValueError("BigRational divide by zero");

        if (numerator === 0n) {
            this.#numerator = 0n;
            this.#denominator = 1n;
            return;
        }

        if (denominator < 0n) {
            denominator = -denominator;
            numerator = -numerator;
        }

        const negative = numerator < 0n;
        if (negative) numerator = -numerator;

        const simplifier = gcd(numerator, denominator);
        this.#numerator = numerator / simplifier;
        this.#denominator = denominator / simplifier;
        if (negative) this.#numerator = -this.#numerator;
        Object.freeze(this);
    }

    static get V_0() {
        return BigRational.#F_0;
    }

    static get V_1() {
        return BigRational.#F_1;
    }

    static get V_2() {
        return BigRational.#F_2;
    }

    static get V_3() {
        return BigRational.#F_3;
    }

    get numerator() {
        return this.#numerator;
    }

    get denominator() {
        return this.#denominator;
    }

    get minus() {
        return new BigRational(-this.numerator, this.denominator);
    }

    get inverse() {
        return new BigRational(this.denominator, this.numerator);
    }

    get sign() {
        return this.numerator.isZero ? 0 : this.numerator > 0n ? 1 : -1;
    }

    get abs() {
        return this.numerator >= 0n ? this : this.minus;
    }

    get isZero() {
        return this.numerator === 0n;
    }

    get isInteger() {
        return this.denominator === 1n;
    }

    get floor() {
        return new BigRational(this.numerator / this.denominator, 1n);
    }

    get ceil() {
        const r = this.numerator % this.denominator;
        return new BigRational((r === 0 ? 0n : r < 0n ? -1n : 1n) + this.numerator / this.denominator, 1n);
    }

    /*
    get round() {
        const t = this.trunc;
        const r = this.abs.numerator % this.denominator;
        return new BigRational(this.numerator / this.denominator, 1n);
    }
    */

    round(decimalPlaces) {
        testSignature([BIGINT], arguments);
        return this.roundBase(decimalPlaces, 10n);
    }

    roundBase(places, base) {
        testSignature([BIGINT, BIGINT], arguments);
        const pow = new BigRational(base, 1n).intPow(places);
        return this.multiply(pow).trunc.divide(pow);
    }

    get truncToBigInt() {
        return this.numerator / this.denominator;
    }

    static sum(...values) {
        let total = BigRational.V_0;
        for (const value of values) {
            if (!(value instanceof BigRational)) throw new TypeError("All the arguments should be BigRational values");
            total = total.add(value);
        }
        return total;
    }

    static product(...values) {
        let total = BigRational.V_1;
        for (const value of values) {
            if (!(value instanceof BigRational)) throw new TypeError("All the arguments should be BigRational values");
            total = total.multiply(value);
        }
        return total;
    }

    static hypot(precision, ...values) {
        testType(precision, BIGINT);
        if (precision <= 0n) throw new RangeError("The precision must be positive");
        const vals = [...arguments];
        vals.shift();
        let total = BigRational.V_0;
        for (const arg of values) {
            if (!(arg instanceof BigRational)) throw new TypeError("All the arguments should be BigRational values");
            total = total.add(arg.intPow(2n));
        }
        return total.intRoot(2n, precision);
    }

    add(that) {
        testSignature([BigRational], arguments);
        const common = this.denominator * that.denominator;
        return new BigRational(this.numerator * that.denominator + that.numerator * this.denominator, common);
    }

    subtract(that) {
        testSignature([BigRational], arguments);
        return this.add(that.minus);
    }

    multiply(that) {
        testSignature([BigRational], arguments);
        return new BigRational(this.numerator * that.numerator, this.denominator * that.denominator);
    }

    divide(that) {
        testSignature([BigRational], arguments);
        return this.multiply(that.inverse);
    }

    mod(that) {
        testSignature([BigRational], arguments);
        const div = this.divide(that).trunc;
        return this.subtract(that.multiply(div));
    }

    intPow(exponent) {
        testSignature([BIGINT], arguments);
        if (exponent === 0n) {
            if (this.isZero) throw new RangeError("The result is indeterminate");
            return BigRational.V_1;
        }
        if (exponent === 1n) return this;
        if (exponent < 0n) return new BigRational(this.denominator ** -exponent, this.numerator ** -exponent);
        return new BigRational(this.numerator ** exponent, this.denominator ** exponent);
    }

    intRootOf(index, precision = 1n) {
        testSignature([BIGINT, BIGINT], arguments, 1);
        if (precision <= 0n) throw new RangeError("The precision must be positive");
        if (index < 0n) return this.inverse().intRootOf(-index, precision);
        if (index === 0n) throw new RangeError("Not a BigRational value");
        if (index === 1n) return this;
        const v1 = BigRational.#bissectForRationalRadical(this.numerator  , index, precision);
        const v2 = BigRational.#bissectForRationalRadical(this.denominator, index, precision);
        return v1.divide(v2);
    }

    intLogOf(base, precision = 1n) {
        testSignature([BIGINT, BIGINT], arguments, 1);
        if (precision <= 0n) throw new RangeError("The precision must be positive");
        if (base <= 1n) throw new RangeError("Not a BigRational value");
        if (base === 1n) return this;
        const v1 = BigRational.#bissectForRationalLog(this.numerator  , base, precision);
        const v2 = BigRational.#bissectForRationalLog(this.denominator, base, precision);
        return v1.subtract(v2);
    }

    pow(exponent, precision = 1n) {
        testSignature([BigRational, BIGINT], arguments, 1);
        if (precision !== undefined && precision <= 0n) throw new RangeError("The precision must be positive");
        return this.intPow(exponent.numerator).intRootOf(exponent.denominator, precision);
    }

    root(index, precision = 1n) {
        testSignature([BigRational, BIGINT], arguments, 1);
        if (precision !== undefined && precision <= 0n) throw new RangeError("The precision must be positive");
        return this.pow(index.inverse, precision);
    }

    log(base, precision = 1n) {
        testSignature([BigRational, BIGINT], arguments, 1);
        if (precision !== undefined && precision <= 0n) throw new RangeError("The precision must be positive");
        throw new Error("Not yet implemented");
    }

    compareTo(that) {
        testSignature([BigRational], arguments);
        return this.subtract(that).sign;
    }

    eq(that) {
        testSignature([BigRational], arguments);
        return this.compareTo(that) === 0;
    }

    neq(that) {
        testSignature([BigRational], arguments);
        return this.compareTo(that) !== 0;
    }

    gt(that) {
        testSignature([BigRational], arguments);
        return this.compareTo(that) > 0;
    }

    ge(that) {
        testSignature([BigRational], arguments);
        return this.compareTo(that) >= 0;
    }

    lt(that) {
        testSignature([BigRational], arguments);
        return this.compareTo(that) < 0;
    }

    le(that) {
        testSignature([BigRational], arguments);
        return this.compareTo(that) <= 0;
    }

    static from(f) {
        testSignature([unionType(BIGINT, INT, FLOAT, STRING)], arguments);
        if (arguments.length !== 1) throw new TypeError("Bad parameter count");
        if (getType(f) === BIGINT) return new BigRational(f, 1n);
        if (getType(f) === FLOAT) {
            const parts = getNumberParts(f);
            if (parts.denormal) {
                return new BigRational(parts.sign * parts.mantissaValue, 2n ** 1074n);
            } else if (parts.biasedExponent < 52) {
                const denominator = 2n ** BigInt(52 - parts.biasedExponent);
                return new BigRational(parts.sign * parts.mantissaValue, denominator);
            } else {
                const power = 2n ** BigInt(parts.biasedExponent - 52);
                return new BigRational(parts.sign * parts.mantissaValue * power, 1n);
            }
        }
        if (getType(f) === STRING && /^(?:+|-)?[0-9]+(?:(?:\/| \/ )[0-9]+)?$/.test(f)) {
            const parts = f.split("/");
            if (parts.length === 1) return new BigRational(BigInt(f), 1n);
            if (parts.length === 2) return new BigRational(BigInt(parts[0].trim()), BigInt(parts[1].trim()));
        }
        throw new TypeError("Malformed value.");
    }

    toString() {
        testSignature([], arguments);
        return this.denominator === 1n ? `${this.numerator}` : `${this.numerator} / ${this.denominator}`;
    }

    static #bissectForRationalRadical(value, index, precision) {
        testSignature([BIGINT, BIGINT, BIGINT], arguments);
        if (value <= 0n) throw new RangeError("The value must be positive");
        if (index <= 0n) throw new RangeError("The index must be positive");
        if (precision <= 0n) throw new RangeError("The precision must be positive");
        const ans = BigRational.#bissectForIntegerRadical(value * precision ** index, index);
        return new BigRational(ans[0], precision);
    }

    static #bissectForIntegerRadical(value, index) {
        testSignature([BIGINT, BIGINT], arguments);
        if (value <= 0n) throw new RangeError("The value must be positive");
        if (index <= 0n) throw new RangeError("The index must be positive");
        const f = x => value - x ** index;
        return BigRational.#bissectForFunctionRoot(f, 0n, value);
    }

    static #bissectForRationalLog(value, base, precision) {
        testSignature([BIGINT, BIGINT, BIGINT], arguments);
        if (value <= 0n) throw new RangeError("The value must be positive");
        if (base <= 1n) throw new RangeError("The base must be greaater than 1");
        if (precision <= 0n) throw new RangeError("The precision must be positive");
        const ans = BigRational
            .#bissectForIntegerLog(value ** precision, base)
            .multiply(new BigRational(1n, precision));
        return new BigRational(ans[0], precision);
    }

    static #bissectForIntegerLog(value, base) {
        testSignature([BIGINT, BIGINT], arguments);
        if (value <= 0n) throw new RangeError("The value must be positive");
        if (base <= 1n) throw new RangeError("The base must be greater than 1");
        const f = x => value - base ** x;
        return BigRational.#bissectForFunctionRoot(f, 0n, value);
    }

    static #bissectForFunctionRoot(f, ax, bx) {
        testSignature([funcType(1), BIGINT, BIGINT], arguments);

        function fv(z) {
            testSignature([BIGINT], arguments);
            const t = f(z);
            if (typeof t !== "bigint") throw new TypeError(z + "|" + t);
            return t;
        }

        function sgn(x) {
            testSignature([BIGINT], arguments);
            return x === 0n ? 0n : x > 0n ? 1n : -1n;
        }

        if (ax > bx) [ax, bx] = [bx, ax];
        let ay = fv(ax);
        let by = fv(bx);
        if (ay === 0n) return [ax, ax, true];
        if (by === 0n) return [bx, bx, true];
        if (sgn(ay) === sgn(by)) throw new RangeError("Failed to converge");

        for (let tries = 0; tries < 20000; tries++) {
            if (ax === bx) throw new RangeError("Failed to converge");
            if (bx - ax === 1n) return [ax, bx, false];
            const cx = (ax + bx) / 2n;
            const cy = fv(cx);
            if (cy === 0n) return [cx, cx, true];
            if (sgn(cy) === sgn(ay)) {
                ay = cy;
                ax = cx;
            } else {
                by = cy;
                bx = cx;
            }
        }
        throw new RangeError("Failed to converge");
    }

    // Uses the ancient Liu Hui's algorithm.
    static pi(precision) {
        testSignature([BIGINT], arguments);
        const doublePrecision = precision * 2n;
        const small = BigRational(1n, precision);
        const radius = BigRational.V_1;
        let sideCount = BigRational.V_3;
        let oldSideLength = radius;
        let newSideLength = oldSideLength;
        do {
            oldSideLength = newSideLength;
            let approximation = BigRational.V_3;
            let littleSquare = oldSideLength.divide(BigRational.V_2).intPow(2n);
            let sideHeight = radius/*.intPow(2n)*/.subtract(littleSquare).intRootOf(2n, doublePrecision);
            let excess = radius.subtract(sideHeight);
            let newSideLength = litteSquare.add(excess.intPow(2n)).intRootOf(2n, doublePrecision);
            sideCount = sideCount.multiply(BigRational.V_2);
        } while (newSideLength.subtract(oldSideLength).lt(small));
        return newSideLength;
    }
}