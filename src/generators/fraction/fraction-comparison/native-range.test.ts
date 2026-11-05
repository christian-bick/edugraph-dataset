import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {FractionComparisonGenerator} from './generator.ts';
import type {FractionComparisonGeneratorConfig} from './spec.ts';

type Family = 'common-denominator' | 'common-numerator' | 'benchmark';
type Relation = 'greater' | 'equal' | 'less';
type Frame = {a: number; b: number; c: number; d: number};
type Rational = {n: bigint; d: bigint};
const gcd = (a: bigint, b: bigint): bigint => b ? gcd(b, a % b) : a;
const fraction = (numerator: number | bigint, denominator: number | bigint = 1): Rational => {
    const n = BigInt(numerator), d = BigInt(denominator), divisor = gcd(n, d);
    return {n: n / divisor, d: d / divisor};
};
const plus = (a: Rational, b: Rational) => fraction(a.n * b.d + b.n * a.d, a.d * b.d);
const divide = (a: Rational, b: Rational) => fraction(a.n * b.d, a.d * b.n);
const key = ({a, b, c, d}: Frame) => `${a}/${b}:${c}/${d}`;
const denominators = [2, 3, 4, 6, 8];
const commonDenominators = [3, 4, 6, 8];
const belongs = (a: number, b: number, upper: number) => (Math.max(a, b) <= 5 ? 5 : 10) === upper;
const relationLabel = (relation: Relation) => relation === 'greater' ? Scope.Greater : relation === 'less' ? Scope.Less : Scope.Equal;
const config = (family: Family, relation: Relation, upper: 5 | 10): FractionComparisonGeneratorConfig => ({
    comparisonMode: family === 'common-denominator' ? Area.FractionCommonDenominatorComparison
        : family === 'common-numerator' ? Area.FractionCommonNumeratorComparison
            : relation === 'equal' ? Area.NumericEquality : Area.NumericInequality,
    usesReferenceComparison: family === 'benchmark',
    usesCommonDenominator: family === 'common-denominator',
    usesCommonNumerator: family === 'common-numerator',
    relation: relationLabel(relation),
    range: createCanonicalNumericRange(upper)
});

/** Original law: uniform denominator/ordered pair, then its original numerator law. */
function original(family: Family, relation: Relation): Map<string, Rational> {
    const expected = new Map<string, Rational>();
    const record = (frame: Frame, weight: Rational) => expected.set(key(frame), plus(expected.get(key(frame)) ?? fraction(0), weight));
    if (family === 'common-denominator') {
        for (const denominator of commonDenominators)
            for (let a = 1; a < denominator; a++)
                for (let c = 1; c < a; c++) record(relation === 'greater'
                    ? {a, b: denominator, c, d: denominator} : {a: c, b: denominator, c: a, d: denominator},
                fraction(1, 2 * (denominator - 1) * (denominator - 2)));
    } else if (family === 'common-numerator') {
        for (const b of denominators) for (const d of denominators.filter(value => value > b))
            for (let n = 1; n < b; n++) record(relation === 'greater'
                ? {a: n, b, c: n, d} : {a: n, b: d, c: n, d: b}, fraction(1, 10 * (b - 1)));
    } else {
        const proper = denominators.flatMap(d => Array.from({length: d - 1}, (_, index) => ({n: index + 1, d})));
        const pairs = proper.flatMap(first => proper.map(second => ({first, second}))).filter(({first: a, second: b}) =>
            a.n !== b.n && a.d !== b.d && (relation === 'greater' ? 2 * a.n > a.d && 2 * b.n < b.d
                : relation === 'less' ? 2 * a.n < a.d && 2 * b.n > b.d
                    : a.d < b.d && 2 * a.n === a.d && 2 * b.n === b.d && a.d > 2));
        for (const {first, second} of pairs) record({a: first.n, b: first.d, c: second.n, d: second.d}, fraction(1, pairs.length));
    }
    return expected;
}

const cases = (['common-denominator', 'common-numerator', 'benchmark'] as const).flatMap(family =>
    (family === 'benchmark' ? ['greater', 'equal', 'less'] as const : ['greater', 'less'] as const).flatMap(relation =>
        (relation === 'equal' ? [10] as const : [5, 10] as const).map(upper => ({family, relation, upper}))));
afterEach(() => vi.restoreAllMocks());

describe('fraction-comparison independently assessed part-count ranges', () => {
    it.each(cases)('preserves the exact native $family/$relation law in upper$upper', ({family, relation, upper}) => {
        const generator = new FractionComparisonGenerator();
        const draw = vi.spyOn(rng, 'random');
        const old = original(family, relation);
        const expected = new Map([...old].filter(([id]) => {
            const [first, second] = id.split(':').map(value => Number(value.split('/')[1]));
            return belongs(first!, second!, upper);
        }));
        const oldMass = [...expected.values()].reduce(plus, fraction(0));
        const actual = new Map<string, Rational>();
        const visit = (tape: number[], weight: Rational) => {
            draw.mockClear();
            tape.forEach(value => draw.mockReturnValueOnce(value));
            const data = generator.generate(config(family, relation, upper)).data;
            expect(draw).toHaveBeenCalledTimes(family === 'benchmark' ? 1 : 3);
            const frame = {a: data.first.numerator, b: data.first.denominator, c: data.second.numerator, d: data.second.denominator};
            actual.set(key(frame), plus(actual.get(key(frame)) ?? fraction(0), weight));
            const quantities = [frame.a / frame.b, frame.c / frame.d, frame.a, frame.b, frame.c, frame.d, data.sharedWhole,
                ...('benchmark' in data ? [data.benchmark.numerator / data.benchmark.denominator, data.benchmark.numerator, data.benchmark.denominator] : [])];
            expect(Math.max(...quantities)).toBeLessThanOrEqual(upper);
            expect(Math.max(...quantities)).toBeGreaterThan(upper === 5 ? -1 : 5);
            expect(Math.min(...quantities)).toBeGreaterThan(0);
            expect(Math.min(...quantities)).toBeLessThan(5);
            expect(data.relation).toBe(relation);
            const difference = data.first.numerator * data.second.denominator - data.second.numerator * data.first.denominator;
            if (relation === 'greater') expect(difference).toBeGreaterThan(0);
            else if (relation === 'less') expect(difference).toBeLessThan(0);
            else expect(difference).toBe(0);
        };
        if (family === 'common-denominator') {
            const allowed = commonDenominators.filter(d => belongs(d, d, upper));
            allowed.forEach((d, i) => {
                for (let a = 0; a < d - 1; a++) for (let c = 0; c < d - 2; c++)
                    visit([(i + 0.5) / allowed.length, (a + 0.5) / (d - 1), (c + 0.5) / (d - 2)], fraction(1, allowed.length * (d - 1) * (d - 2)));
            });
        } else if (family === 'common-numerator') {
            const pairs = denominators.flatMap(b => denominators.filter(d => b !== d && belongs(b, d, upper)).map(d => ({b, d})));
            pairs.forEach(({b}, i) => {
                const seconds = pairs.filter(pair => pair.b === b).map(pair => pair.d);
                seconds.forEach((d, j) => {
                    for (let n = 0; n < Math.min(b, d) - 1; n++)
                        visit([(i + 0.5) / pairs.length, (j + 0.5) / seconds.length, (n + 0.5) / (Math.min(b, d) - 1)],
                            fraction(1, pairs.length * seconds.length * (Math.min(b, d) - 1)));
                });
            });
        } else [...expected].forEach((_, i) => visit([(i + 0.5) / expected.size], fraction(1, expected.size)));
        expect([...actual.keys()].sort()).toEqual([...expected.keys()].sort());
        for (const [id, weight] of expected) expect(actual.get(id), id).toEqual(divide(weight, oldMass));
        expect([...actual.values()].reduce(plus, fraction(0))).toEqual(fraction(1));
        expect(expected.size).toBe(family === 'common-denominator' ? upper === 5 ? 4 : 31
            : family === 'common-numerator' ? upper === 5 ? 4 : 17 : relation === 'equal' ? 3 : upper === 5 ? 2 : 29);
    });

    it.each([undefined, {min: 0, max: 5}, createCanonicalNumericRange(20), createCanonicalNumericRange(10, 5),
        {...createCanonicalNumericRange(5), min: -0}, {...createCanonicalNumericRange(5), maximumAbove: 0}])(
        'rejects malformed/unsupported canonical range %j before mathematical entropy', range => {
            const draw = vi.spyOn(rng, 'random');
            expect(() => new FractionComparisonGenerator().generate({...config('common-denominator', 'greater', 5), range} as never)).toThrow();
            expect(draw).not.toHaveBeenCalled();
        }
    );
    it('rejects the unsupported benchmark-equality upper5 cell before mathematical entropy', () => {
        const draw = vi.spyOn(rng, 'random');
        expect(() => new FractionComparisonGenerator().generate(config('benchmark', 'equal', 5))).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
