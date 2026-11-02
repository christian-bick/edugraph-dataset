import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {CANONICAL_RANGE_THRESHOLDS, createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import type {ArithmeticOperation} from '../../../types/problems.ts';
import {letterEquationDomain, letterEquationFormulas, letterEquationFrame, letterEquationQuantities} from './domain.ts';

const profiles = canonicalRangeProfiles.filter(({range}) => [0, 5, 10, 20].includes(range.min));
const apply = (a: number, b: number, operation: ArithmeticOperation): number => operation === 'addition' ? a + b
    : operation === 'subtraction' ? a - b : operation === 'multiplication' ? a * b : a / b;
const key = (min: number, max: number) => `${min}:${max}`;

describe('letter-equation scalar interval mathematics', () => {
    it('proves all affine row endpoints, count/index boundaries and both required calculations', () => {
        let nativeCells = 0, nativeFrames = 0, allMatchingCells = 0;
        for (const [formulaIndex, formula] of letterEquationFormulas.entries()) for (const {range} of profiles) {
            const domain = letterEquationDomain(formula.operations, range);
            if (formulaIndex < 10 && domain.count) {
                allMatchingCells++;
                const nativeRows = domain.rows.filter(row => row.second <= formula.secondLimit && row.third <= formula.thirdLimit);
                if (nativeRows.length) nativeCells++;
                nativeFrames += nativeRows.reduce((sum, row) => sum + row.last - row.first + 1, 0);
            }
            let count = 0;
            for (const row of domain.rows) {
                const start = row.end - (row.last - row.first + 1);
                for (const index of [start, Math.floor((start + row.end - 1) / 2), row.end - 1]) {
                    const frame = letterEquationFrame(domain, formula.operations, index);
                    const values = letterEquationQuantities(frame);
                    if (values.some(value => !Number.isInteger(value) || value <= 0 || value > 999999)
                        || !hasCanonicalRangeWitness(values, range)
                        || frame.intermediate !== apply(frame.operands[0], frame.operands[1], frame.operations[0])
                        || frame.answer !== apply(frame.intermediate, frame.operands[2], frame.operations[1])) {
                        throw new Error(`Bad scalar row: ${JSON.stringify({formula: formula.operations, range, row, frame})}`);
                    }
                }
                if (start !== count) throw new Error('Overlapping or missing scalar-index interval');
                count = row.end;
            }
            expect(count).toBe(domain.count);
        }
        expect(nativeCells).toBe(224);
        expect(nativeFrames).toBe(7772047013);
        expect(allMatchingCells).toBe(238);
    });

    it('retains every old native primitive frame and all six further direct operation sequences', () => {
        let nativeRetained = 0, directRetained = 0;
        for (const [formulaIndex, formula] of letterEquationFormulas.entries()) {
            const lookup = new Map(profiles.map(({range}) => [key(range.min, range.max), {
                domain: letterEquationDomain(formula.operations, range),
                rows: new Map(letterEquationDomain(formula.operations, range).rows.map(row => [`${row.second}:${row.third}`, row]))
            }]));
            const sequence = formula.operations.join('-');
            for (let b = 2; b <= formula.secondLimit; b++) for (let c = 2; c <= formula.thirdLimit; c++) for (let a = 2; a <= 50; a++) {
                let values: number[], scalar = a;
                // Independent reconstruction of the old constructor branches and primitive pools.
                if (sequence === 'subtraction-subtraction') values = [a + b + c, c, b, a + b, a];
                else if (sequence === 'division-division') values = [a * b * c, c, b, a * b, a];
                else if (sequence === 'division-addition') values = [a * b, b, c, a, a + c];
                else if (sequence === 'division-subtraction') values = [c * (a + b), c, b, a + b, a];
                else if (sequence === 'multiplication-division') values = [a, b * c, c, a * b * c, a * b];
                else {
                    const intermediate = apply(a, b, formula.operations[0]);
                    values = [a, b, c, intermediate, apply(intermediate, c, formula.operations[1])];
                    if (sequence === 'addition-division' || sequence === 'subtraction-division') scalar = values[4]!;
                    if (sequence === 'division-multiplication') scalar = intermediate;
                }
                if (values.some(value => !Number.isInteger(value) || value < 1 || value > 999999)) continue;
                const minimum = Math.min(...values), maximum = Math.max(...values);
                const upper = CANONICAL_RANGE_THRESHOLDS.find(bound => maximum <= bound)!;
                const lower = [20, 10, 5, 0].find(bound => minimum >= bound)!;
                const admitted = lookup.get(key(lower, upper))!, row = admitted.rows.get(`${b}:${c}`);
                if (!row || scalar < row.first || scalar > row.last) throw new Error('Old primitive frame lost');
                const index = row.end - (row.last - row.first + 1) + scalar - row.first;
                const actual = letterEquationQuantities(letterEquationFrame(admitted.domain, formula.operations, index));
                if (values.some((value, index) => value !== actual[index])) throw new Error('Old frame changed its mathematical values');
                if (formulaIndex < 10) nativeRetained++; else directRetained++;
            }
        }
        expect(nativeRetained).toBe(748013);
        expect(directRetained).toBeGreaterThan(100000);
    }, 60000);

    it('retains all 1,984 additional L20 primitive frames from the former max(minimum,limit) draws', () => {
        let retained = 0;
        for (const formula of letterEquationFormulas) for (const [second, third] of formula.higherFloorPairs ?? []) {
            for (let a = 20; a <= 50; a++) {
                const sequence = formula.operations.join('-');
                const values = sequence === 'division-division' ? [a * second * third, third, second, a * second, a]
                    : sequence === 'division-addition' ? [a * second, second, third, a, a + third]
                        : sequence === 'division-subtraction' ? [third * (a + second), third, second, a + second, a]
                            : [a, second * third, third, a * second * third, a * second];
                const upper = CANONICAL_RANGE_THRESHOLDS.find(bound => Math.max(...values) <= bound)!;
                const domain = letterEquationDomain(formula.operations, createCanonicalNumericRange(upper, 20));
                const row = domain.rows.find(row => row.second === second && row.third === third)!;
                const index = row.end - (row.last - row.first + 1) + a - row.first;
                expect(letterEquationQuantities(letterEquationFrame(domain, formula.operations, index))).toEqual(values);
                retained++;
            }
        }
        expect(retained).toBe(1984);
    });

    it('retains the native ceiling and every reviewed operation upper slice, without forced balancing', () => {
        for (const formula of letterEquationFormulas.slice(0, 10)) {
            expect(letterEquationDomain(formula.operations, createCanonicalNumericRange(1000000)).count).toBeGreaterThan(0);
        }
        expect(letterEquationDomain(['addition', 'addition'], createCanonicalNumericRange(5)).count).toBe(0);
        expect(letterEquationDomain(['addition', 'subtraction'], createCanonicalNumericRange(5)).count).toBeGreaterThan(0);
        const domain = letterEquationDomain(['addition', 'addition'], createCanonicalNumericRange(1000));
        for (const index of [-1, domain.count, 0.5]) expect(() => letterEquationFrame(domain, ['addition', 'addition'], index)).toThrow();
        expect(() => letterEquationDomain(['addition', 'addition'], {...createCanonicalNumericRange(1000), maximumAbove: -1})).toThrow();
        expect(() => letterEquationDomain(['addition', 'addition'], createCanonicalNumericRange(1000, 100))).toThrow();
        expect(() => letterEquationDomain(['unsupported', 'addition'] as never, createCanonicalNumericRange(1000))).toThrow();
    });
});
