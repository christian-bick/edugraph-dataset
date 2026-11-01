import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {countingStrategyPairs, sampleCountingStrategy} from './canonical-counting-strategy.ts';

describe('canonical counting-strategy support', () => {
    it.each([[5, 9], [10, 15], [20, 30]])('covers every positive pair once at upper%s', (upper, count) => {
        const range = createCanonicalNumericRange(upper);
        const expected: number[][] = [];
        for (let base = 1; base <= 20; base++) for (let stepCount = 1; stepCount <= 3; stepCount++) {
            if (base + stepCount <= upper && base + stepCount > range.maximumAbove) expected.push([base, stepCount]);
        }
        const pairs = countingStrategyPairs(range);
        expect(pairs).toHaveLength(count);
        expect(new Set(pairs.map(pair => pair.join(',')))).toEqual(new Set(expected.map(pair => pair.join(','))));
        for (const operation of ['addition', 'subtraction'] as const) {
            const seen = new Set<string>();
            for (let index = 0; index < pairs.length; index++) {
                const draw = vi.fn(() => (index + 0.5) / pairs.length);
                const data = operation === 'addition' ? sampleCountingStrategy(range, operation, draw)
                    : sampleCountingStrategy(range, operation, draw);
                const quantities = [data.leftOperand, data.rightOperand, data.answer,
                    ...data.steps.flatMap(step => step.kind === 'operation'
                        ? [step.leftOperand, step.rightOperand, step.result] : [step.whole, ...step.parts])];
                expect(hasCanonicalRangeWitness(quantities, range)).toBe(true);
                expect(quantities).toContain(1);
                expect(draw).toHaveBeenCalledTimes(1);
                expect(data.steps).toHaveLength(data.rightOperand);
                seen.add(`${operation === 'addition' ? data.leftOperand : data.answer},${data.rightOperand}`);
            }
            expect(seen).toEqual(new Set(expected.map(pair => pair.join(','))));
        }
    });

    it.each([
        undefined, null, {min: 0, max: 20}, createCanonicalNumericRange(100), createCanonicalNumericRange(10, 5),
        {...createCanonicalNumericRange(20), max: NaN}, {...createCanonicalNumericRange(20), min: -1},
        {...createCanonicalNumericRange(20), maximumAbove: 5}, {...createCanonicalNumericRange(20), minimumBelow: 10}
    ])('rejects malformed or unsupported range %j before a draw', range => {
        const draw = vi.fn(() => 0.5);
        expect(() => sampleCountingStrategy(range as never, 'addition', draw)).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
