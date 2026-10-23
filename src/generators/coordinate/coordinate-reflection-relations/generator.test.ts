import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {CoordinateReflectionRelationProblem, RationalCoordinateAxes, RationalCoordinateAxis, RationalCoordinatePoint,
    SignedRational, SignedRationalNotation} from '../../../types/problems.ts';
import {buildCoordinateReflectionRelationProblem, CoordinateReflectionRelationsGenerator, type CoordinateReflectionModelParameters} from './generator.ts';
import type {CoordinateReflectionRelationsGeneratorConfig} from './spec.ts';

const generator = new CoordinateReflectionRelationsGenerator();
const gcd = (first: bigint, second: bigint): bigint => second === 0n ? first : gcd(second, first % second);
const abs = (value: bigint): bigint => value < 0n ? -value : value;
const rational = (n: number, d = 1): SignedRational => {
    const divisor = gcd(abs(BigInt(n)), BigInt(d));
    return {numerator: Number(BigInt(n) / divisor), denominator: Number(BigInt(d) / divisor)};
};
const cross = (a: SignedRational, b: SignedRational): bigint => BigInt(a.numerator) * BigInt(b.denominator) - BigInt(b.numerator) * BigInt(a.denominator);

function notation(value: SignedRational, kind: SignedRationalNotation['kind']): SignedRationalNotation {
    if (kind === 'fraction') return {kind, numerator: value.numerator, denominator: value.denominator};
    if (kind === 'integer') return {kind, numeral: String(value.numerator)};
    const coefficient = Number(BigInt(value.numerator) * 100n / BigInt(value.denominator));
    const digits = String(Math.abs(coefficient)).padStart(3, '0');
    return {kind, coefficient, scale: 2, numeral: `${coefficient < 0 ? '-' : ''}${digits.slice(0, -2)}.${digits.slice(-2)}`};
}

/** Independent literal frame construction, without imports from the production coordinate helpers. */
function axis(first: number, last: number, step: SignedRational, kind: SignedRationalNotation['kind'] = 'fraction'): RationalCoordinateAxis {
    const ticks = Array.from({length: last - first + 1}, (_, index) => rational((first + index) * step.numerator, step.denominator));
    return {minimum: ticks[0]!, maximum: ticks.at(-1)!, step, ticks, zeroIndex: first === 0 ? 0 : -first,
        tickNotations: ticks.map(value => notation(value, kind)), stepNotation: notation(step, kind)};
}
const literalAxes: RationalCoordinateAxes = {x: axis(-4, 4, rational(1, 2)), y: axis(-5, 5, rational(1, 4))};
const parameters: CoordinateReflectionModelParameters = {axes: literalAxes, xTickIndex: 1, yTickIndex: 10, reflectionAxes: ['x', 'y']};

function assertScalar(value: SignedRational): void {
    expect(Number.isSafeInteger(value.numerator)).toBe(true);
    expect(Number.isSafeInteger(value.denominator)).toBe(true);
    expect(value.denominator).toBeGreaterThan(0);
    expect(gcd(abs(BigInt(value.numerator)), BigInt(value.denominator))).toBe(1n);
    expect(Object.is(value.numerator, -0)).toBe(false);
}

function assertModel(data: CoordinateReflectionRelationProblem): void {
    const assertPoint = (point: RationalCoordinatePoint): void => {
        for (const component of ['x', 'y'] as const) {
            const location = point[component];
            const frame = data.axes[component];
            assertScalar(location.value);
            assertScalar(location.magnitude);
            expect(Number.isInteger(location.tickIndex)).toBe(true);
            expect(location.value).toEqual(frame.ticks[location.tickIndex]);
            expect(location.sign).toBe(location.value.numerator === 0 ? 0 : location.value.numerator < 0 ? -1 : 1);
            expect(cross(location.magnitude, {...location.value, numerator: Math.abs(location.value.numerator)})).toBe(0n);
        }
    };
    for (const frame of [data.axes.x, data.axes.y]) {
        expect(frame.minimum).toEqual(frame.ticks[0]);
        expect(frame.maximum).toEqual(frame.ticks.at(-1));
        expect(frame.ticks[frame.zeroIndex]).toEqual(rational(0));
        for (let index = 1; index < frame.ticks.length; index++) {
            const previous = frame.ticks[index - 1]!;
            const current = frame.ticks[index]!;
            expect(cross(current, previous) * BigInt(frame.step.denominator)).toBe(
                BigInt(frame.step.numerator) * BigInt(current.denominator) * BigInt(previous.denominator));
        }
    }
    assertPoint(data.original);
    let previous = data.original;
    for (const step of data.steps) {
        expect(step.before).toEqual(previous);
        assertPoint(step.before);
        assertPoint(step.after);
        assertPoint(step.mirror.foot);
        const unchanged = step.axis;
        const negated = step.axis === 'x' ? 'y' : 'x';
        expect(step.unchanged).toEqual({component: unchanged, value: step.before[unchanged].value});
        expect(step.after[unchanged]).toEqual(step.before[unchanged]);
        expect(step.negated.component).toBe(negated);
        expect(step.negated.before).toEqual(step.before[negated].value);
        expect(step.negated.after).toEqual(step.after[negated].value);
        expect(cross(step.negated.before, {...step.negated.after, numerator: -step.negated.after.numerator})).toBe(0n);
        expect(step.negated.valueChanged).toBe(step.before[negated].value.numerator !== 0);
        expect(step.mirror.foot[unchanged].value).toEqual(step.before[unchanged].value);
        expect(step.mirror.foot[negated].value).toEqual(rational(0));
        expect(step.mirror.beforeDistance).toEqual(step.before[negated].magnitude);
        expect(step.mirror.afterDistance).toEqual(step.after[negated].magnitude);
        expect(cross(step.mirror.beforeDistance, step.mirror.afterDistance)).toBe(0n);
        previous = step.after;
    }
    expect(Object.keys(data).sort()).toEqual(['axes', 'kind', 'original', 'steps']);
}

describe('complete exact coordinate reflection relations', () => {
    it('preserves the mixed-denominator oracle, intermediate point and exact perpendicular feet', () => {
        const data = buildCoordinateReflectionRelationProblem(parameters);
        expect(data.original).toMatchObject({id: 'P', x: {value: rational(-3, 2), tickIndex: 1}, y: {value: rational(5, 4), tickIndex: 10}, locationTag: 'quadrant-II'});
        expect(data.steps[0].after).toMatchObject({x: {value: rational(-3, 2), tickIndex: 1}, y: {value: rational(-5, 4), tickIndex: 0}, locationTag: 'quadrant-III'});
        expect(data.steps[0].mirror.foot).toMatchObject({x: {value: rational(-3, 2), tickIndex: 1}, y: {value: rational(0), tickIndex: 5}, locationTag: 'x-axis'});
        expect(data.steps[0].mirror.beforeDistance).toEqual(rational(5, 4));
        expect(data.steps[1]!.after).toMatchObject({x: {value: rational(3, 2), tickIndex: 7}, y: {value: rational(-5, 4), tickIndex: 0}, locationTag: 'quadrant-IV'});
        expect(data.steps[1]!.mirror.beforeDistance).toEqual(rational(3, 2));
        assertModel(data);
    });

    it('retains both reflection orders and distinguishes their intermediates from the shared final point', () => {
        const xy = buildCoordinateReflectionRelationProblem(parameters);
        const yx = buildCoordinateReflectionRelationProblem({...parameters, reflectionAxes: ['y', 'x']});
        expect(yx.steps[0].after).toMatchObject({x: {value: rational(3, 2)}, y: {value: rational(5, 4)}, locationTag: 'quadrant-I'});
        expect(yx.steps[0].after).not.toEqual(xy.steps[0].after);
        expect(yx.steps[1]!.after).toEqual(xy.steps[1]!.after);
        assertModel(yx);
    });

    it.each([['x'], ['y'], ['x', 'x'], ['y', 'y']] as const)('accepts single-axis and repeated-axis involutions %j', (...axes) => {
        const reflectionAxes = axes.flat() as readonly ('x' | 'y')[];
        const data = buildCoordinateReflectionRelationProblem({...parameters, reflectionAxes});
        assertModel(data);
        if (reflectionAxes.length === 2) {
            expect(data.steps[1]!.after.x).toEqual(data.original.x);
            expect(data.steps[1]!.after.y).toEqual(data.original.y);
        }
    });

    it('recognizes both axis fixed sets and the origin without inventing a negative zero', () => {
        for (const [xTickIndex, yTickIndex, reflectionAxes] of [[4, 1, ['y']], [1, 5, ['x']], [4, 5, ['x', 'y']]] as const) {
            const data = buildCoordinateReflectionRelationProblem({...parameters, xTickIndex, yTickIndex, reflectionAxes});
            assertModel(data);
            for (const step of data.steps) {
                expect(step.negated.valueChanged).toBe(false);
                expect(step.negated.before).toEqual(rational(0));
                expect(step.negated.after).toEqual(rational(0));
                expect(step.mirror.beforeDistance).toEqual(rational(0));
                expect(step.after.x.value).toEqual(step.before.x.value);
                expect(step.after.y.value).toEqual(step.before.y.value);
            }
        }
    });

    it('preserves decimal precision and literal unreduced fractions when signs change', () => {
        const decimalAxes = {x: axis(-2, 2, rational(1), 'integer'), y: axis(-2, 2, rational(1, 4), 'decimal')};
        const decimal = buildCoordinateReflectionRelationProblem({axes: decimalAxes, xTickIndex: 3, yTickIndex: 3, reflectionAxes: ['x']});
        expect(decimal.original.y.notation).toEqual({kind: 'decimal', coefficient: 25, scale: 2, numeral: '0.25'});
        expect(decimal.steps[0].after.y.notation).toEqual({kind: 'decimal', coefficient: -25, scale: 2, numeral: '-0.25'});
        const integer = buildCoordinateReflectionRelationProblem({axes: decimalAxes, xTickIndex: 3, yTickIndex: 2, reflectionAxes: ['y', 'x']});
        expect(integer.steps[0].after.x.notation).toEqual({kind: 'integer', numeral: '-1'});
        expect(integer.steps[1]!.after.y.notation).toEqual({kind: 'decimal', coefficient: 0, scale: 2, numeral: '0.00'});
        const fractionAxes = structuredClone(literalAxes);
        fractionAxes.x.tickNotations = fractionAxes.x.tickNotations.map((form, index) => index === 3 ? {kind: 'fraction', numerator: -2, denominator: 4} : form);
        const fraction = buildCoordinateReflectionRelationProblem({axes: fractionAxes, xTickIndex: 3, yTickIndex: 5, reflectionAxes: ['y', 'y']});
        expect(fraction.steps[0].after.x.notation).toEqual({kind: 'fraction', numerator: 2, denominator: 4});
        expect(fraction.steps[1]!.after.x.notation).toEqual({kind: 'fraction', numerator: -2, denominator: 4});
        assertModel(decimal);
        assertModel(integer);
        assertModel(fraction);
    });

    it('accepts coherent asymmetric frames and wide exact values without a sampler-only domain guard', () => {
        const axes = {x: axis(-2, 4, rational(100)), y: axis(-3, 2, rational(1, 3))};
        const data = buildCoordinateReflectionRelationProblem({axes, xTickIndex: 1, yTickIndex: 2, reflectionAxes: ['x', 'y']});
        expect(data.original.x.value).toEqual(rational(-100));
        expect(data.steps[1]!.after.x.value).toEqual(rational(100));
        assertModel(data);
    });

    it('rejects malformed frames, indices, sparse/invalid sequences and images outside the supplied frame', () => {
        for (const value of [undefined, null, 'model', []]) expect(() => buildCoordinateReflectionRelationProblem(value as never)).toThrow(GeneratorValidationError);
        for (const axes of [undefined, {}, {...literalAxes, x: {...literalAxes.x, zeroIndex: 0}},
            {...literalAxes, y: {...literalAxes.y, step: rational(1, 3)}}]) {
            expect(() => buildCoordinateReflectionRelationProblem({...parameters, axes} as never)).toThrow(GeneratorValidationError);
        }
        for (const invalid of [-1, -0, 11, 0.5, NaN, Infinity]) {
            expect(() => buildCoordinateReflectionRelationProblem({...parameters, xTickIndex: invalid})).toThrow(GeneratorValidationError);
            expect(() => buildCoordinateReflectionRelationProblem({...parameters, yTickIndex: invalid})).toThrow(GeneratorValidationError);
        }
        for (const reflectionAxes of [undefined, [], ['x', 'y', 'x'], ['z'], ['x', null], new Array(1)]) {
            expect(() => buildCoordinateReflectionRelationProblem({...parameters, reflectionAxes} as never)).toThrow(GeneratorValidationError);
        }
        const nonnegative = {x: axis(0, 4, rational(1), 'integer'), y: axis(0, 4, rational(1), 'integer')};
        expect(() => buildCoordinateReflectionRelationProblem({axes: nonnegative, xTickIndex: 1, yTickIndex: 1, reflectionAxes: ['x']})).toThrow('contain every reflected point');
    });
});

describe('coordinate reflection absolute-range sampling', () => {
    it.each([5, 10, Number.MAX_SAFE_INTEGER])('samples complete witnesses within absolute cap %s', maximum => {
        const cap = maximum === Number.MAX_SAFE_INTEGER ? 10 : maximum;
        const features = new Set<string>();
        for (let seed = 0; seed < 1000; seed++) {
            setSeed(seed);
            const stub = generator.generate({range: {min: 0, max: maximum}});
            expect(Object.keys(stub)).toEqual(['data']);
            const data = stub.data;
            assertModel(data);
            features.add(data.steps.map(({axis}) => axis).join(''));
            features.add(data.original.locationTag);
            if (cross(data.axes.x.step, data.axes.y.step) !== 0n) features.add('unequal-steps');
            if (data.axes.x.zeroIndex !== data.axes.y.zeroIndex) features.add('unequal-zero-indices');
            if (data.original.x.tickIndex === 0 || data.original.x.tickIndex === data.axes.x.ticks.length - 1) features.add('endpoint');
            for (const step of data.steps) if (!step.negated.valueChanged) features.add('fixed');
            const points = [data.original, ...data.steps.flatMap(step => [step.before, step.after, step.mirror.foot])];
            const values = [...Object.values(data.axes).flatMap(frame => [frame.step, ...frame.ticks]),
                ...points.flatMap(point => [point.x.value, point.y.value, point.x.magnitude, point.y.magnitude]),
                ...data.steps.flatMap(step => [step.unchanged.value, step.negated.before, step.negated.after, step.mirror.beforeDistance, step.mirror.afterDistance])];
            for (const value of values) {
                expect(abs(BigInt(value.numerator))).toBeLessThanOrEqual(BigInt(cap) * BigInt(value.denominator));
                expect(Math.abs(value.numerator)).toBeLessThanOrEqual(cap);
                expect(value.denominator).toBeLessThanOrEqual(cap);
                if (value.denominator > 1) features.add('fraction');
                if (abs(BigInt(value.numerator)) > 5n * BigInt(value.denominator)) features.add('above-five');
            }
        }
        for (const feature of ['x', 'y', 'xy', 'yx', 'quadrant-I', 'quadrant-II', 'quadrant-III', 'quadrant-IV', 'x-axis', 'y-axis', 'origin', 'unequal-steps', 'unequal-zero-indices', 'endpoint', 'fixed', 'fraction']) {
            expect(features.has(feature)).toBe(true);
        }
        expect(features.has('above-five')).toBe(cap === 10);
    }, 15_000);

    it('rejects missing and malformed range configuration without silent defaults', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate(null!)).toThrow(GeneratorValidationError);
        for (const range of [null, [], 'range', {min: 1, max: 5}, {min: -0, max: 5}, {min: 0, max: 6}, {min: 0, max: Infinity}, {min: 0}]) {
            expect(() => generator.generate({range} as CoordinateReflectionRelationsGeneratorConfig)).toThrow(GeneratorValidationError);
        }
    });

    it('replays exact data and omits learner actions, schema labels and invented sign scopes', () => {
        setSeed(444);
        const first = generator.generate({range: {min: 0, max: 10}});
        setSeed(444);
        expect(generator.generate({range: {min: 0, max: 10}})).toEqual(first);
        expect(Object.keys(first)).toEqual(['data']);
        expect(first.data).not.toHaveProperty('range');
        expect(first.data).not.toHaveProperty('question');
    });
});
