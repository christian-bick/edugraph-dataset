import {beforeAll, describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import type {DecimalStandardAddSubtractProblem} from '../../../types/problems.ts';
import {buildDecimalStandardAddSubtractProblem, StandardAlgorithmDecimalAddSubtractGenerator} from './generator.ts';
import type {StandardAlgorithmDecimalAddSubtractGeneratorConfig} from './spec.ts';

const generator = new StandardAlgorithmDecimalAddSubtractGenerator();
type Operation = DecimalStandardAddSubtractProblem['operation'];
const config = (operation: Operation = 'addition', max = 100000): StandardAlgorithmDecimalAddSubtractGeneratorConfig =>
    ({operation, range: createCanonicalNumericRange(max), zeroPresence: true});

function assertTrace(data: DecimalStandardAddSubtractProblem): void {
    const scale = Math.max(data.top.scale, data.bottom.scale);
    const literalCoefficient = (numeral: string) => BigInt(numeral.replace('.', ''));
    const alignLiteral = (numeral: string) => literalCoefficient(numeral) * 10n ** BigInt(scale - (numeral.split('.')[1]?.length ?? 0));
    const a = alignLiteral(data.top.numeral);
    const b = alignLiteral(data.bottom.numeral);
    const expected = data.operation === 'addition' ? a + b : a - b;
    expect(BigInt(data.alignment.topCoefficient)).toBe(a);
    expect(BigInt(data.alignment.bottomCoefficient)).toBe(b);
    expect(data.alignment.scale).toBe(scale);
    expect(data.result.scale).toBe(scale);
    expect(literalCoefficient(data.result.numeral)).toBe(expected);
    expect(BigInt(data.result.coefficient)).toBe(expected);
    expect(data.alignment.topNumeral.split('.')[1]?.length ?? 0).toBe(scale);
    expect(data.alignment.bottomNumeral.split('.')[1]?.length ?? 0).toBe(scale);
    expect(data.columns.length).toBeGreaterThanOrEqual(scale + 1);
    let resultCoefficient = 0n;
    data.columns.forEach((column, index) => {
        const power = 10n ** BigInt(index);
        expect(column.placeExponent).toBe(index - scale);
        expect(column.topDigit).toBe(Number(a / power % 10n));
        expect(column.bottomDigit).toBe(Number(b / power % 10n));
        expect(column.regroupIn).toBe(index === 0 ? 0 : data.columns[index - 1]!.regroupOut);
        const w = data.operation === 'addition'
            ? column.topDigit + column.bottomDigit + column.regroupIn
            : column.topDigit - column.regroupIn + 10 * column.regroupOut;
        expect(column.workingValue).toBe(w);
        expect(w).toBeGreaterThanOrEqual(0);
        expect(column.resultDigit).toBe(data.operation === 'addition' ? w % 10 : w - column.bottomDigit);
        expect(column.resultDigit).toBeGreaterThanOrEqual(0);
        expect(column.resultDigit).toBeLessThanOrEqual(9);
        expect(column.regroupOut).toBe(data.operation === 'addition'
            ? Number(w >= 10) : Number(column.topDigit - column.regroupIn < column.bottomDigit));
        resultCoefficient += BigInt(column.resultDigit) * power;
    });
    expect(data.columns.at(-1)!.regroupOut).toBe(0);
    expect(resultCoefficient).toBe(expected);
}

describe('decimal standard addition/subtraction exact traces', () => {
    it.each([
        ['addition', '12.345', '0.067', '12.412'], ['addition', '9.995', '0.005', '10.000'],
        ['addition', '1.20', '0.3', '1.50'], ['addition', '0.001', '0.002', '0.003'],
        ['addition', '0.00', '0.000', '0.000'], ['addition', '9007199254740990', '1', '9007199254740991'],
        ['subtraction', '100.005', '0.017', '99.988'], ['subtraction', '5.20', '0.004', '5.196'],
        ['subtraction', '12.0', '12.00', '0.00'], ['subtraction', '1.000', '0.001', '0.999'],
        ['subtraction', '0.000', '0.000', '0.000'], ['subtraction', '9007199254740991', '1', '9007199254740990']
    ] as const)('%s preserves %s and %s with result %s', (operation, top, bottom, result) => {
        const data = buildDecimalStandardAddSubtractProblem(operation, top, bottom);
        expect(data.top.numeral).toBe(top);
        expect(data.bottom.numeral).toBe(bottom);
        expect(data.result.numeral).toBe(result);
        assertTrace(data);
    });

    it('supplies the full literal carry oracle including the overflow column', () => {
        expect(buildDecimalStandardAddSubtractProblem('addition', '9.9', '0.1').columns).toEqual([
            {placeExponent: -1, topDigit: 9, bottomDigit: 1, regroupIn: 0, regroupOut: 1, workingValue: 10, resultDigit: 0},
            {placeExponent: 0, topDigit: 9, bottomDigit: 0, regroupIn: 1, regroupOut: 1, workingValue: 10, resultDigit: 0},
            {placeExponent: 1, topDigit: 0, bottomDigit: 0, regroupIn: 1, regroupOut: 0, workingValue: 1, resultDigit: 1}
        ]);
    });

    it('supplies a borrow cascade with nonnegative corrected digits', () => {
        expect(buildDecimalStandardAddSubtractProblem('subtraction', '10.00', '0.01').columns).toEqual([
            {placeExponent: -2, topDigit: 0, bottomDigit: 1, regroupIn: 0, regroupOut: 1, workingValue: 10, resultDigit: 9},
            {placeExponent: -1, topDigit: 0, bottomDigit: 0, regroupIn: 1, regroupOut: 1, workingValue: 9, resultDigit: 9},
            {placeExponent: 0, topDigit: 0, bottomDigit: 0, regroupIn: 1, regroupOut: 1, workingValue: 9, resultDigit: 9},
            {placeExponent: 1, topDigit: 1, bottomDigit: 0, regroupIn: 1, regroupOut: 0, workingValue: 0, resultDigit: 0}
        ]);
    });

    it('rejects negative subtraction, unsafe alignment/result and unsupported operations', () => {
        expect(() => buildDecimalStandardAddSubtractProblem('subtraction', '0.1', '1.0')).toThrow(GeneratorValidationError);
        expect(() => buildDecimalStandardAddSubtractProblem('addition', '900719925474099.1', '0.01')).toThrow(GeneratorValidationError);
        expect(() => buildDecimalStandardAddSubtractProblem('addition', '9007199254740991', '1')).toThrow(GeneratorValidationError);
        expect(() => buildDecimalStandardAddSubtractProblem('multiplication' as Operation, '1', '2')).toThrow(GeneratorValidationError);
        expect(() => buildDecimalStandardAddSubtractProblem('addition', '1e2', '2')).toThrow(GeneratorValidationError);
    });
});

describe('decimal standard addition/subtraction configured generation', () => {
    it('rejects missing fields, unsupported operations and incomplete/noncanonical bounds', () => {
        for (const invalid of [{}, {operation: 'addition'}, {range: createCanonicalNumericRange(100)},
            {...config(), operation: 'multiply'}, {...config(), operation: 1}, {...config(), range: {min: 0, max: 10000}},
            {...config(), range: createCanonicalNumericRange(1000000)}])
            expect(() => generator.generate(invalid as StandardAlgorithmDecimalAddSubtractGeneratorConfig)).toThrow(GeneratorValidationError);
    });

    describe.each(['addition', 'subtraction'] as const)('%s native scalar and column bounds', operation => {
        const maxima = [10, 20, 100, 120, 1000, 10000, 100000];
        let fixtures: ReadonlyMap<number, readonly DecimalStandardAddSubtractProblem[]>;

        beforeAll(() => {
            fixtures = new Map(maxima.map(max => {
                const draws: DecimalStandardAddSubtractProblem[] = [];
                for (const zeroPresence of [true, false]) {
                    if (!zeroPresence && max === 10) continue;
                    for (let seed = 0; seed < 30; seed++) {
                        setSeed(seed);
                        draws.push(generator.generate({...config(operation, max), zeroPresence}).data);
                    }
                }
                return [max, Object.freeze(draws)] as const;
            }));
        });

        it.each(maxima)('upper%s retains every native trace and canonical quantity bound', max => {
            const draws = fixtures.get(max)!;
            expect(draws).toHaveLength(max === 10 ? 30 : 60);
            const range = createCanonicalNumericRange(max);
            for (const data of draws) {
                assertTrace(data);
                const topWidth = data.top.numeral.split('.')[0]!.length, bottomWidth = data.bottom.numeral.split('.')[0]!.length;
                const quantities = [data.top.coefficient / 10 ** data.top.scale, data.bottom.coefficient / 10 ** data.bottom.scale,
                    data.result.coefficient / 10 ** data.result.scale, ...data.columns.flatMap(c => [c.workingValue,
                        ...(c.placeExponent < topWidth ? [c.topDigit] : []), ...(c.placeExponent < bottomWidth ? [c.bottomDigit] : []),
                        ...(c.regroupIn > 0 ? [c.regroupIn] : []), ...(operation === 'subtraction' ? [c.resultDigit] : [])])];
                expect(hasCanonicalRangeWitness(quantities, range)).toBe(true);
                expect(data.top.coefficient).toBeLessThanOrEqual(1000000);
                expect(data.result.coefficient).toBeLessThanOrEqual(1000000);
                expect(data.top.scale > 0 || data.bottom.scale > 0).toBe(true);
            }
        });

        it('retains complete precision and regrouping support across all 390 original draws', () => {
            const draws = [...fixtures.values()].flat();
            expect(draws).toHaveLength(390);
            const observed = new Set<string>();
            for (const data of draws) {
                if (data.top.scale === 3 || data.bottom.scale === 3) observed.add('thousandths');
                if (data.top.scale !== data.bottom.scale) observed.add('different-precision');
                if (data.columns.some(c => c.regroupOut === 1)) observed.add('regroup');
                if (data.result.coefficient === 0) observed.add('zero-result');
                if (data.columns.at(-1)!.topDigit === 0 && data.columns.at(-1)!.regroupIn === 1) observed.add('overflow');
                if (data.columns.filter(c => c.regroupOut === 1).length >= 2) observed.add('cascade');
            }
            for (const feature of ['thousandths', 'different-precision', 'regroup']) expect(observed.has(feature)).toBe(true);
            expect(observed.has(operation === 'addition' ? 'overflow' : 'zero-result')).toBe(true);
            if (operation === 'subtraction') expect(observed.has('cascade')).toBe(true);
        });
    });

    it('makes its mathematical range select distinct canonical value bands', () => {
        for (const operation of ['addition', 'subtraction'] as const) for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const small = generator.generate(config(operation, 20)).data;
            setSeed(seed);
            const large = generator.generate(config(operation, 100000)).data;
            const scalar = (data: DecimalStandardAddSubtractProblem) => operation === 'addition'
                ? data.result.coefficient / 10 ** data.result.scale : data.top.coefficient / 10 ** data.top.scale;
            expect(scalar(small)).toBeLessThanOrEqual(20);
            expect(scalar(large)).toBeGreaterThan(10000);
        }
    });

    it('retains both original overflow boundaries and replays the native random continuation', () => {
        for (const whole of [99, 999]) {
            const data = buildDecimalStandardAddSubtractProblem('addition', `${whole}.991`, '0.009');
            expect(data.result.coefficient).toBe((whole + 1) * 1000);
            assertTrace(data);
        }
        setSeed(149);
        const first = generator.generate(config('subtraction')), state = getRandomState();
        setSeed(149);
        expect(generator.generate(config('subtraction'))).toEqual(first);
        expect(getRandomState()).toBe(state);
        expect(Object.keys(first)).toEqual(['data']);
    });
});
