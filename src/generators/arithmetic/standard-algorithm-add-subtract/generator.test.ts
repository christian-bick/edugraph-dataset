import {afterEach, describe, expect, it, vi} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as random from '../../../lib/random.ts';
import {StandardAlgorithmColumnStep, StandardAlgorithmProblem} from '../../../types/problems.ts';
import {standardAlgorithmPresentation} from '../../../visuals/views/operations/operations-standard-algorithm/helpers.ts';
import {StandardAlgorithmAddSubtractGenerator} from './generator.ts';

const targetRange = createCanonicalNumericRange(1000000);

const reconstructResult = (columns: readonly StandardAlgorithmColumnStep[]): number =>
    columns.reduce((value, column) => value + column.resultDigit * column.placeValue, 0);

function expectPositiveInstructedCalculations(problem: StandardAlgorithmProblem): void {
    for (const column of standardAlgorithmPresentation(problem).columns) {
        const tokens = column.calculation.split(' = ')[0]!.match(/\d+|[+-]/g)!;
        let value = Number(tokens[0]);
        expect(value).toBeGreaterThan(0);
        for (let index = 1; index < tokens.length; index += 2) {
            const operand = Number(tokens[index + 1]);
            expect(operand).toBeGreaterThan(0);
            value = tokens[index] === '+' ? value + operand : value - operand;
            expect(value).toBeGreaterThan(0);
        }
    }
}

function expectExactColumns(problem: StandardAlgorithmProblem): void {
    expect(problem.columns.length).toBeGreaterThanOrEqual(3);
    expect(problem.columns.length).toBeLessThanOrEqual(6);
    expect(problem.columns[0].placeValue).toBe(1);
    expect(problem.columns.at(-1)!.regroupOut).toBe(0);
    expect(reconstructResult(problem.columns)).toBe(problem.result);

    problem.columns.forEach((column, index) => {
        expect(column.topDigit).toBe(Math.floor(problem.topValue / column.placeValue) % 10);
        expect(column.bottomDigit).toBe(Math.floor(problem.bottomValue / column.placeValue) % 10);
        expect(column.regroupIn).toBe(index === 0 ? 0 : problem.columns[index - 1].regroupOut);
        if (problem.operation === 'addition') {
            expect(column.workingValue).toBe(
                column.topDigit + column.bottomDigit + column.regroupIn
            );
            expect(column.resultDigit).toBe(column.workingValue % 10);
            expect(column.regroupOut).toBe(column.workingValue >= 10 ? 1 : 0);
        } else {
            expect(column.workingValue).toBe(
                column.topDigit - column.regroupIn + 10 * column.regroupOut
            );
            expect(column.resultDigit).toBe(column.workingValue - column.bottomDigit);
            expect(column.regroupOut).toBe(
                column.topDigit - column.regroupIn < column.bottomDigit ? 1 : 0
            );
        }
    });
}

describe('StandardAlgorithmAddSubtractGenerator', () => {
    const generator = new StandardAlgorithmAddSubtractGenerator();
    afterEach(() => vi.restoreAllMocks());

    it('keeps every valid old upper corpus and bounds the actual instructed arithmetic, including carried or borrowed 1', () => {
        for (const upper of [1000, 10000, 100000, 1000000]) for (const operation of ['addition', 'subtraction'] as const) {
            const range = createCanonicalNumericRange(upper);
            const fullWidthMinimum = 10 ** (String(upper - 1).length - 1);
            expect(Math.max(100, fullWidthMinimum)).toBe(Math.max(1, fullWidthMinimum));
            for (const seed of [0, 17, 77]) {
                setSeed(seed);
                const data = generator.generate({operation, range})!.data;
                const values = [data.topValue, data.bottomValue, data.result,
                    ...standardAlgorithmPresentation(data).columns.flatMap(column => column.calculation.match(/\d+/g)!.map(Number))];
                expect(Math.min(...values)).toBe(1);
                expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                expectExactColumns(data);
            }
        }
        // The formerly advertised upper120 never had an operand interval.
        expect(Math.max(100, 10 ** (String(119).length - 1))).toBeGreaterThan(Math.floor(119 / 2));
    });

    it.each([
        [1000, 'addition', 0, 146, 645, 791, 3031295956],
        [1000, 'addition', 17, 258, 715, 973, 3663131643],
        [1000, 'addition', 77, 157, 255, 412, 3663131703],
        [1000, 'subtraction', 0, 791, 146, 645, 3031295956],
        [1000, 'subtraction', 17, 973, 258, 715, 3663131643],
        [1000, 'subtraction', 77, 655, 298, 357, 3031296033],
        [1000000, 'addition', 0, 234657, 582537, 817194, 2399460286],
        [1000000, 'addition', 17, 362767, 544485, 907252, 3031295973],
        [1000000, 'addition', 77, 266299, 682988, 949287, 1767624693],
        [1000000, 'subtraction', 0, 817194, 234657, 582537, 2399460286],
        [1000000, 'subtraction', 17, 829783, 264246, 565537, 1767624633],
        [1000000, 'subtraction', 77, 949287, 266299, 682988, 1767624693]
    ] as const)('retains pre-correction mathematical data and continuation for upper%i %s seed%i',
        (upper, operation, seed, top, bottom, result, continuation) => {
            setSeed(seed);
            const data = generator.generate({operation, range: createCanonicalNumericRange(upper)})!.data;
            expect([data.topValue, data.bottomValue, data.result]).toEqual([top, bottom, result]);
            expect(getRandomState()).toBe(continuation);
            expectExactColumns(data);
        });

    it('strictly validates every required configuration field', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({operation: 'addition'} as never)).toThrow();
        expect(() => generator.generate({range: targetRange} as never)).toThrow();
    });

    it.each(['addition', 'subtraction'] as const)(
        'generates exact %s columns with visible regrouping throughout the target range',
        operation => {
            for (let seed = 0; seed < 100; seed++) {
                setSeed(seed);
                const stub = generator.generate({operation, range: targetRange});
                expect(stub).not.toBeNull();
                const problem = stub!.data;

                expect(problem.task).toBe('standard-algorithm');
                expect(problem.operation).toBe(operation);
                expect(problem.topValue).toBeGreaterThanOrEqual(1000);
                expect(problem.bottomValue).toBeGreaterThanOrEqual(1000);
                expect(problem.result).toBeGreaterThanOrEqual(1000);
                expect(problem.topValue).toBeLessThanOrEqual(999999);
                expect(problem.bottomValue).toBeLessThanOrEqual(999999);
                expect(problem.result).toBeLessThanOrEqual(999999);
                expect(problem.columns.some(column => column.regroupOut === 1)).toBe(true);
                expectPositiveInstructedCalculations(problem);

                if (operation === 'addition') {
                    expect(problem.topValue + problem.bottomValue).toBe(problem.result);
                    expect(String(problem.result).length).toBe(String(problem.topValue).length);
                } else {
                    expect(problem.topValue - problem.bottomValue).toBe(problem.result);
                }
                expectExactColumns(problem);
            }
        }
    );

    it.each(['addition', 'subtraction'] as const)(
        'supports a three-column Grade 3 %s problem',
        operation => {
            setSeed(`grade-3-${operation}`);
            const stub = generator.generate({operation, range: createCanonicalNumericRange(1000)});
            expect(stub).not.toBeNull();
            expect(stub!.data.columns).toHaveLength(3);
            expect(stub!.data.topValue).toBeGreaterThanOrEqual(100);
            expect(stub!.data.result).toBeLessThan(1000);
            expectExactColumns(stub!.data);
        }
    );

    it('rejects unreviewed ranges and the impossible former upper120 capability', () => {
        expect(() => generator.generate({operation: 'addition', range: {min: 1000, max: 2000}} as never)).toThrow();
        expect(() => generator.generate({operation: 'subtraction', range: createCanonicalNumericRange(120)})).toThrow();
        expect(() => generator.generate({operation: 'addition', range: createCanonicalNumericRange(1000, 5)})).toThrow('positive lower');
        expect(() => generator.generate({operation: 'addition', range: {...createCanonicalNumericRange(1000), maximumAbove: 0}})).toThrow('witnesses');
    });

    it('accepts a zero result digit when every instructed addition value is positive', () => {
        const draw = vi.spyOn(random, 'random')
            .mockReturnValueOnce(2.5 / 200) // 125 in the unchanged first-operand domain.
            .mockReturnValueOnce(8.5 / 385); // 185 in the unchanged second-operand domain.
        const data = generator.generate({operation: 'addition', range: createCanonicalNumericRange(1000)})!.data;
        expect(data).toMatchObject({topValue: 125, bottomValue: 185, result: 310});
        expect(data.columns[0]).toMatchObject({workingValue: 10, resultDigit: 0, regroupOut: 1});
        expectPositiveInstructedCalculations(data);
        expect(draw).toHaveBeenCalledTimes(2);
    });

    it('rejects the seed-4 zero-depletion borrow and keeps drawing from the same raw domain', () => {
        setSeed(4);
        const seeded = generator.generate({operation: 'subtraction', range: createCanonicalNumericRange(1000)})!;
        expect(seeded.data).not.toMatchObject({topValue: 815, bottomValue: 349, result: 466});
        expectPositiveInstructedCalculations(seeded.data);

        const draw = vi.spyOn(random, 'random')
            .mockReturnValueOnce(184.5 / 200) // 349 + 466 gives the rejected 815 - 349.
            .mockReturnValueOnce(91.5 / 275)
            .mockReturnValueOnce(2.5 / 200) // The next unchanged draws give 361 - 125.
            .mockReturnValueOnce(90.5 / 385);
        const data = generator.generate({operation: 'subtraction', range: createCanonicalNumericRange(1000)})!.data;
        expect(data).toMatchObject({topValue: 361, bottomValue: 125, result: 236});
        expectPositiveInstructedCalculations(data);
        expect(draw).toHaveBeenCalledTimes(4);
    });

    it('returns null after bounded rejection when every draw has a numerical zero operand', () => {
        const draw = vi.spyOn(random, 'random').mockReturnValue(0);
        expect(generator.generate({operation: 'addition', range: createCanonicalNumericRange(1000)})).toBeNull();
        expect(draw).toHaveBeenCalledTimes(200);
    });

    it.each([
        {min: NaN, max: 1000}, {min: 100, max: Infinity},
        {min: 1001, max: 1000}, {min: 100, max: 10000001}
    ])('rejects unsupported magnitude bounds %j', range => {
        expect(() => generator.generate({operation: 'addition', range} as never)).toThrow();
    });

    it('rejects unsupported operation configurations', () => {
        expect(() => generator.generate({
            operation: 'division',
            range: targetRange
        } as never)).toThrow();
    });

    it('is deterministic for a project RNG seed', () => {
        setSeed('standard-algorithm');
        const first = generator.generate({operation: 'addition', range: targetRange});
        setSeed('standard-algorithm');
        const second = generator.generate({operation: 'addition', range: targetRange});
        expect(second).toEqual(first);
    });
});
