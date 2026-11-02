import {Area} from 'edugraph-ts';
import type {ArithmeticOperation} from '../../../types/problems.ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {buildRounding} from '../word-problem-evidence.ts';
import type {TwoStepOperationLabels} from '../helpers.ts';
import {canonicalProposalInterval, roundingCores, roundingDomain, roundingOperationProfiles,
    roundingRangeProfiles, selectRoundingCore, type RoundingCore} from './domain.ts';
import {ArithmeticWordProblemsRoundingGenerator} from './generator.ts';
import {roundingProposalInterval} from './proposal-domain.ts';

afterEach(() => vi.restoreAllMocks());
const values = (r: RoundingCore) => [r.a, r.b, r.c, r.intermediate, r.answer, r.roundedAnswer];

describe('rounding-story finite cores and monotone proposal intervals', () => {
    it('retains all old primitive outcomes at every valid source floor, including all1984 special floor20 corners', () => {
        let all = 0, extra = 0, errors = 0;
        const countAtFloor = [0, 0, 0, 0];
        for (const profile of roundingOperationProfiles) {
            const rows = roundingCores(profile.operations), lookup = new Map(rows.map(row => [`${row.a}:${row.b}:${row.c}`, row]));
            expect(lookup.size).toBe(rows.length);
            all += rows.length;
            extra += rows.filter(r => r.sourceMinimum === 20).length;
            // Independent primitive oracle for all four formerly declared nonempty floors.
            for (const [floorIndex, floor] of [1, 5, 10, 20].entries()) {
                const first = Math.max(2, floor), divisionLast = Math.max(first, 12), factorLast = Math.max(first, 10);
                const check = (a: number, b: number, c: number, intermediate: number, answer: number) => {
                    if (![a, b, c, intermediate, answer].every(n => Number.isInteger(n) && n >= floor && n <= 999999) || answer < Math.max(5, floor)) return;
                    const evidence = buildRounding({num1: a, num2: b, num3: c, intermediate, answer}, profile.operations);
                    const old = roundingProposalInterval({...evidence, numberDomain: {min: floor, max: 1000000}});
                    if (!old) return;
                    const row = lookup.get(`${a}:${b}:${c}`);
                    if (!row || row.intermediate !== intermediate || row.answer !== answer
                        || row.roundingPlace !== evidence.roundingPlace || row.roundedAnswer !== evidence.roundedAnswer
                        || row.proposalLower > old.lower || old.upper > 1000000) errors++;
                    countAtFloor[floorIndex]!++;
                };
                const sequence = profile.operations.join('-');
                if (sequence === 'division-division') {
                    for (let a = first; a <= 50; a++) for (let b = first; b <= divisionLast; b++) for (let c = first; c <= divisionLast; c++) check(a * b * c, b, c, a * c, a);
                } else if (sequence === 'division-addition') {
                    for (let a = first; a <= 50; a++) for (let b = first; b <= divisionLast; b++) for (let c = first; c <= 50; c++) check(a * b, b, c, a, a + c);
                } else if (sequence === 'division-subtraction') {
                    for (let a = first; a <= 50; a++) for (let b = first; b <= divisionLast; b++) for (let c = first; c <= 50; c++) check((a + c) * b, b, c, a + c, a);
                } else if (sequence === 'multiplication-division') {
                    for (let a = first; a <= 50; a++) for (let b = first; b <= factorLast; b++) for (let c = first; c <= factorLast; c++) check(a, b * c, c, a * b * c, a * b);
                } else if (sequence === 'subtraction-subtraction') {
                    for (let a = first; a <= 50; a++) for (let b = first; b <= 50; b++) for (let c = first; c <= 50; c++) check(a + b + c, b, c, a + c, a);
                } else {
                    const operation = (a: number, b: number, op: string) => op === 'addition' ? a + b : op === 'subtraction' ? a - b : a * b;
                    for (let a = first; a <= 50; a++) for (let b = first; b <= 50; b++) for (let c = first; c <= 50; c++) {
                        const intermediate = operation(a, b, profile.operations[0]);
                        check(a, b, c, intermediate, operation(intermediate, c, profile.operations[1]));
                    }
                }
            }
        }
        expect(errors).toBe(0);
        expect(all).toBe(735348);
        expect(extra).toBe(1984);
        expect(countAtFloor[0]).toBe(733364);
        expect(countAtFloor.every(n => n > 0)).toBe(true);
    });

    it.each(roundingOperationProfiles)('partitions every full proposal interval exactly for $operations, with valid monotone endpoints and original conditional CDF weights', profile => {
        let errors = 0;
        const cores = roundingCores(profile.operations), covered = new Float64Array(cores.length);
        for (const {range} of roundingRangeProfiles) {
            const domain = roundingDomain(profile.operations, range);
            let before = 0;
            for (let i = 0; i < cores.length; i++) {
                const row = cores[i]!, interval = canonicalProposalInterval(row, range);
                let count = 0;
                if (interval) {
                    count = interval.upper - interval.lower + 1 - Number(row.answer >= interval.lower && row.answer <= interval.upper);
                    covered[i]! += count;
                    const first = interval.lower === row.answer ? interval.lower + 1 : interval.lower;
                    const last = interval.upper === row.answer ? interval.upper - 1 : interval.upper;
                    for (const P of [first, last]) {
                        const Q = Math.round(P / row.roundingPlace) * row.roundingPlace;
                        if (row.minimum <= 0 || P <= 0 || Q <= 0 || P < row.proposalLower || P > 1000000 || P === row.answer
                            || !hasCanonicalRangeWitness([...values(row), P, Q], range)) errors++;
                    }
                }
                const increment = domain.cumulative[i]! - before;
                if (Math.abs(increment - count / row.proposalCount) > 3e-11) errors++;
                before = domain.cumulative[i]!;
            }
        }
        for (let i = 0; i < cores.length; i++) if (covered[i] !== cores[i]!.proposalCount) errors++;
        expect(errors).toBe(0);
    });

    it('retains the original native floor20 constructors without introducing intermediate small-factor pools', () => {
        const draw = vi.spyOn(rng, 'random');
        let native = 0;
        for (const profile of roundingOperationProfiles) for (const row of roundingCores(profile.operations).filter(r => r.sourceMinimum === 20)) {
            const primitives = profile.operations[0] === 'division' ? [profile.operations[1] === 'addition' ? row.intermediate : row.answer, row.c, row.b]
                : [row.a, row.b / row.c, row.c];
            // Division-addition draws intermediate, divisor, third; other division
            // branches draw answer, third, divisor. Multiplication/division uses a,f,c.
            if (profile.operations[0] === 'division' && profile.operations[1] === 'addition') [primitives[1], primitives[2]] = [primitives[2]!, primitives[1]!];
            let index = 0;
            draw.mockReset().mockImplementation(() => {
                const value = primitives[index++]!;
                const last = profile.operations[0] === 'division' && (profile.operations[1] === 'division' ? index > 1
                    : profile.operations[1] === 'addition' ? index === 2 : index === 3)
                    || profile.operations[0] === 'multiplication' && index > 1 ? 20 : 50;
                return (value - 20 + 0.5) / (last - 20 + 1);
            });
            expect(generateOriginalGrade4Values(profile.operations, 20, 999999, 20)).toEqual({num1: row.a, num2: row.b, num3: row.c, intermediate: row.intermediate, answer: row.answer});
            expect(draw).toHaveBeenCalledTimes(3);
            native++;
        }
        expect(native).toBe(1984);
    });

    it('constructs every feasible configuration at true zero/max Mulberry32 boundaries without rejecting or making false zero claims', () => {
        const draw = vi.spyOn(rng, 'random'), generator = new ArithmeticWordProblemsRoundingGenerator();
        let profiles = 0;
        for (const profile of roundingOperationProfiles) for (const {range} of roundingRangeProfiles) {
            if (!roundingDomain(profile.operations, range).weight) continue;
            profiles++;
            const operations = [profile.operations[0], profile.operations[1]].map(op => ({addition: Area.Addition, subtraction: Area.Subtraction, multiplication: Area.Multiplication, division: Area.Division})[op]) as unknown as TwoStepOperationLabels;
            for (const value of [0, (2 ** 32 - 1) / 2 ** 32]) {
                draw.mockReset().mockReturnValue(value);
                const data = generator.generate({operations, range})!.data;
                expect(hasCanonicalRangeWitness([...data.operands, data.intermediate, data.answer, data.roundedAnswer,
                    data.proposal.proposedAnswer, data.proposal.roundedProposedAnswer], range)).toBe(true);
                expect(data.operands.every(n => n > 0) && data.intermediate > 0 && data.answer > 0
                    && data.roundedAnswer > 0 && data.proposal.proposedAnswer > 0 && data.proposal.roundedProposedAnswer > 0).toBe(true);
                expect(draw).toHaveBeenCalledTimes(2);
            }
        }
        expect(profiles).toBe(232);
    });

    it('keeps the numerical-zero rounding boundary outside the positive story corpus', () => {
        const row = roundingCores(['addition', 'addition']).find(r => r.a === 2 && r.b === 2 && r.c === 2)!;
        const range = roundingRangeProfiles.find(p => p.range.max === 10 && p.range.min === 0)!.range;
        expect(canonicalProposalInterval(row, range)).toEqual({lower: 5, upper: 10});
        for (let P = 1; P <= 4; P++) expect(Math.round(P / 10) * 10).toBe(0);
        expect(row.proposalLower).toBe(5);
        expect(() => selectRoundingCore(roundingDomain(['division', 'division'], range), 0)).toThrow();
    });
});

// Original pre-canonical constructor retained solely as an independent native control.
type OriginalValues = {num1: number; num2: number; num3: number; intermediate: number; answer: number};
const applyOperation = (left: number, right: number, operation: ArithmeticOperation): number => {
    if (operation === 'addition') return left + right;
    if (operation === 'subtraction') return left - right;
    if (operation === 'multiplication') return left * right;
    return left / right;
};

const randomInteger = (minimum: number, maximum: number): number | null => minimum > maximum ? null
    : minimum + Math.floor(rng.random() * (maximum - minimum + 1));
const valuesInRange = (values: OriginalValues, minimum: number, maximum: number): boolean =>
    Object.values(values).every(value =>
        Number.isInteger(value) && value >= minimum && value <= maximum
    );

function generateOriginalGrade4Values(
    operations: readonly [ArithmeticOperation, ArithmeticOperation],
    minimum: number,
    maximum: number,
    minimumAnswer = minimum
): OriginalValues | null {
    const operandMinimum = Math.max(2, minimum);
    const operandLimit = Math.min(maximum, 50);
    if (operandMinimum > operandLimit) return null;

    const draw = (limit = operandLimit): number | null => randomInteger(
        operandMinimum,
        Math.max(operandMinimum, limit)
    );
    const sequence = operations.join('-');

    for (let attempt = 0; attempt < 1_000; attempt++) {
        let values: OriginalValues | null = null;

        if (sequence === 'subtraction-subtraction') {
            const answer = draw();
            const num3 = draw();
            const num2 = draw();
            if (answer === null || num3 === null || num2 === null) return null;
            const intermediate = answer + num3;
            values = {num1: intermediate + num2, num2, num3, intermediate, answer};
        } else if (sequence === 'division-division') {
            const answer = draw();
            const num3 = draw(12);
            const num2 = draw(12);
            if (answer === null || num3 === null || num2 === null) return null;
            const intermediate = answer * num3;
            values = {num1: intermediate * num2, num2, num3, intermediate, answer};
        } else if (sequence === 'division-addition') {
            const intermediate = draw();
            const num2 = draw(12);
            const num3 = draw();
            if (intermediate === null || num2 === null || num3 === null) return null;
            values = {
                num1: intermediate * num2,
                num2,
                num3,
                intermediate,
                answer: intermediate + num3
            };
        } else if (sequence === 'division-subtraction') {
            const answer = draw();
            const num3 = draw();
            const num2 = draw(12);
            if (answer === null || num3 === null || num2 === null) return null;
            const intermediate = answer + num3;
            values = {
                num1: intermediate * num2,
                num2,
                num3,
                intermediate,
                answer
            };
        } else if (sequence === 'multiplication-division') {
            const num1 = draw();
            const factor = draw(10);
            const num3 = draw(10);
            if (num1 === null || factor === null || num3 === null) return null;
            const num2 = factor * num3;
            const intermediate = num1 * num2;
            values = {num1, num2, num3, intermediate, answer: num1 * factor};
        } else {
            const multiplicationLimit = sequence === 'multiplication-multiplication'
                ? Math.min(operandLimit, Math.max(operandMinimum, Math.floor(Math.cbrt(maximum))))
                : operandLimit;
            const num1 = draw(multiplicationLimit);
            const num2 = draw(multiplicationLimit);
            const num3 = draw(multiplicationLimit);
            if (num1 === null || num2 === null || num3 === null) return null;
            const intermediate = applyOperation(num1, num2, operations[0]);
            const answer = applyOperation(intermediate, num3, operations[1]);
            values = {num1, num2, num3, intermediate, answer};
        }

        if (valuesInRange(values, minimum, maximum) && values.answer >= minimumAnswer) return values;
    }

    return null;
}
