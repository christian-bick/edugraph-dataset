import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import type {ArithmeticOperation} from '../../../types/problems.ts';
import {twoStepDomain, twoStepFrame, twoStepQuantities} from './domain.ts';

const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const;
const apply = (a: number, b: number, operation: ArithmeticOperation) => operation === 'addition' ? a + b
    : operation === 'subtraction' ? a - b : operation === 'multiplication' ? a * b : a / b;
const profiles = canonicalRangeProfiles.filter(({range}) => range.max <= 100 && [0, 5, 10, 20].includes(range.min));
const key = (minimum: number, maximum: number) => `${minimum}:${maximum}`;

describe('constructive positive two-step domains', () => {
    it('exactly partitions the independent full positive ≤100 domain and retains every former ≤12 operand triple', () => {
        let retainedOld = 0, retained = 0, cells = 0;
        for (const first of operations) for (const second of operations) {
            const expected = new Map<string, number>();
            let original = 0;
            for (let a = 1; a <= 100; a++) for (let b = 1; b <= 100; b++) {
                const intermediate = apply(a, b, first);
                if (!Number.isInteger(intermediate) || intermediate < 1 || intermediate > 100) continue;
                for (let c = 1; c <= 100; c++) {
                    const answer = apply(intermediate, c, second);
                    if (!Number.isInteger(answer) || answer < 1 || answer > 100) continue;
                    const minimum = Math.min(a, b, c, intermediate, answer);
                    const maximum = Math.max(a, b, c, intermediate, answer);
                    const upper = [5, 10, 20, 100].find(bound => maximum <= bound)!;
                    const lower = [20, 10, 5, 0].find(bound => minimum >= bound)!;
                    const cell = key(lower, upper);
                    expected.set(cell, (expected.get(cell) ?? 0) + 1);
                    if (a <= 12 && b <= 12 && c <= 12) original++;
                }
            }
            let actualOld = 0, previousTotal = 0;
            for (const {range} of profiles) {
                const domain = twoStepDomain([first, second], range);
                expect(domain.count).toBe(expected.get(key(range.min, range.max)) ?? 0);
                if (domain.count) cells++;
                let count = 0, allValid = true;
                for (const row of domain.rows) {
                    let previousThird = 0, rowCount = 0;
                    for (const [low, high] of row.thirds) {
                        allValid &&= low > previousThird && low <= high;
                        previousThird = high;
                        for (let c = low; c <= high; c++) {
                            const values = [row.num1, row.num2, c, row.intermediate, apply(row.intermediate, c, second)];
                            allValid &&= values.every(value => Number.isInteger(value) && value > 0)
                                && hasCanonicalRangeWitness(values, range);
                            if (row.num1 <= 12 && row.num2 <= 12 && c <= 12) actualOld++;
                            rowCount++;
                        }
                    }
                    allValid &&= rowCount === row.count && row.end === count + rowCount;
                    for (const index of [count, row.end - 1]) {
                        const frame = twoStepFrame(domain, [first, second], index);
                        allValid &&= frame.num1 === row.num1 && frame.num2 === row.num2
                            && hasCanonicalRangeWitness(twoStepQuantities(frame), range);
                    }
                    count += rowCount;
                }
                expect(allValid).toBe(true);
                expect(count).toBe(domain.count);
                previousTotal += count;
            }
            expect(actualOld).toBe(original);
            retainedOld += original;
            retained += previousTotal;
        }
        expect(retainedOld).toBeGreaterThan(0);
        expect(retained).toBeGreaterThan(retainedOld);
        expect(cells).toBeGreaterThan(16);
    });

    it('rejects forged range witnesses and impossible indexed draws', () => {
        expect(() => twoStepDomain(['addition', 'addition'], {...createCanonicalNumericRange(100), minimumBelow: 0})).toThrow('witnesses');
        expect(() => twoStepDomain(['addition', 'addition'], createCanonicalNumericRange(1000))).toThrow('reviewed');
        const empty = twoStepDomain(['division', 'division'], createCanonicalNumericRange(10, 5));
        expect(empty.count).toBe(0);
        expect(() => twoStepFrame(empty, ['division', 'division'], 0)).toThrow('index');
        expect(() => twoStepFrame(twoStepDomain(['addition', 'addition'], createCanonicalNumericRange(5)), ['addition', 'addition'], -1)).toThrow('index');
    });
});
