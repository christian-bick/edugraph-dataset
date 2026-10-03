import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {
    DecimalAddSubtractNumber,
    DecimalAddSubtractProblem,
    DecimalAddSubtractUnitCounts
} from '../../../types/problems.ts';
import {
    createDecimalAddSubtractProblem,
    DecimalAdditionSubtractionGenerator
} from './generator.ts';

const generator = new DecimalAdditionSubtractionGenerator();
const valueOf = (counts: DecimalAddSubtractUnitCounts): number =>
    counts.ones * 100 + counts.tenths * 10 + counts.hundredths;
const allNonnegative = (counts: DecimalAddSubtractUnitCounts): boolean =>
    Object.values(counts).every(value => Number.isInteger(value) && value >= 0);

function expectNumber(number: DecimalAddSubtractNumber): void {
    const value = number.valueInHundredths;
    const fraction = String(value % 100).padStart(2, '0').replace(/0+$/, '');
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(999);
    expect(number.alignedDigits).toEqual([
        Math.floor(value / 100), Math.floor(value / 10) % 10, value % 10
    ]);
    expect(number.canonicalNumeral).toBe(fraction === ''
        ? String(Math.floor(value / 100))
        : `${Math.floor(value / 100)}.${fraction}`);
}

function expectExactProblem(problem: DecimalAddSubtractProblem): void {
    expect(problem.kind).toBe('decimal-add-subtract');
    expect(problem.base).toBe(10);
    expect(problem.scale).toBe(100);
    for (const number of [problem.first, problem.second, problem.result]) expectNumber(number);
    const first = problem.first.valueInHundredths;
    const second = problem.second.valueInHundredths;
    const result = problem.operation === 'addition' ? first + second : first - second;
    expect(problem.result.valueInHundredths).toBe(result);
    expect(problem).not.toHaveProperty('prompt');
    expect(problem).not.toHaveProperty('answerProse');

    expect(problem.columns.map(column => column.place))
        .toEqual(['hundredths', 'tenths', 'ones']);
    problem.columns.forEach((column, index) => {
        const digitIndex = 2 - index;
        expect(column.firstDigit).toBe(problem.first.alignedDigits[digitIndex]);
        expect(column.secondDigit).toBe(problem.second.alignedDigits[digitIndex]);
        expect(column.regroupIn).toBe(index === 0 ? 0 : problem.columns[index - 1].regroupOut);
        if (problem.operation === 'addition') {
            expect(column.workingUnits).toBe(
                column.firstDigit + column.secondDigit + column.regroupIn
            );
            expect(column.resultDigit).toBe(column.workingUnits % 10);
            expect(column.regroupOut).toBe(column.workingUnits >= 10 ? 1 : 0);
        } else {
            expect(column.workingUnits).toBe(
                column.firstDigit - column.regroupIn + 10 * column.regroupOut
            );
            expect(column.resultDigit).toBe(column.workingUnits - column.secondDigit);
            expect(column.regroupOut).toBe(
                column.firstDigit - column.regroupIn < column.secondDigit ? 1 : 0
            );
        }
        expect(column.resultDigit).toBe(problem.result.alignedDigits[digitIndex]);
    });
    expect(problem.columns[2].regroupOut).toBe(0);

    const model = problem.model;
    expect(model.initial).toEqual({
        ones: problem.first.alignedDigits[0],
        tenths: problem.first.alignedDigits[1],
        hundredths: problem.first.alignedDigits[2]
    });
    expect(model.final).toEqual({
        ones: problem.result.alignedDigits[0],
        tenths: problem.result.alignedDigits[1],
        hundredths: problem.result.alignedDigits[2]
    });
    expect(valueOf(model.initial)).toBe(first);
    expect(valueOf(model.final)).toBe(result);
    let current = model.initial;
    let joinOrRemoveCount = 0;
    for (const step of model.steps) {
        expect(step.before).toEqual(current);
        expect(allNonnegative(step.before)).toBe(true);
        expect(allNonnegative(step.after)).toBe(true);
        const delta = valueOf(step.after) - valueOf(step.before);
        if (!('lowerPlace' in step)) {
            joinOrRemoveCount++;
            expect(delta).toBe(step.kind === 'join-second' ? second : -second);
        } else {
            expect(delta).toBe(0);
            if (step.lowerPlace === 'hundredths') {
                expect(step.after.ones).toBe(step.before.ones);
                expect(step.after.tenths - step.before.tenths)
                    .toBe(step.kind === 'compose-ten' ? 1 : -1);
                expect(step.after.hundredths - step.before.hundredths)
                    .toBe(step.kind === 'compose-ten' ? -10 : 10);
            } else {
                expect(step.after.hundredths).toBe(step.before.hundredths);
                expect(step.after.ones - step.before.ones)
                    .toBe(step.kind === 'compose-ten' ? 1 : -1);
                expect(step.after.tenths - step.before.tenths)
                    .toBe(step.kind === 'compose-ten' ? -10 : 10);
            }
        }
        current = step.after;
    }
    expect(joinOrRemoveCount).toBe(1);
    expect(current).toEqual(model.final);
    expect(model.steps[problem.operation === 'addition' ? 0 : model.steps.length - 1].kind)
        .toBe(problem.operation === 'addition' ? 'join-second' : 'remove-second');
    expect(model.steps.filter(step => step.kind === 'compose-ten'
        || step.kind === 'decompose-one').length)
        .toBe(problem.columns.filter(column => column.regroupOut === 1).length);
}

describe('createDecimalAddSubtractProblem', () => {
    it('carries through hundredths and tenths in 1.68 + 2.47 = 4.15', () => {
        const problem = createDecimalAddSubtractProblem('addition', 168, 247)!;
        expectExactProblem(problem);
        expect(problem.columns).toEqual([
            {place: 'hundredths', firstDigit: 8, secondDigit: 7,
                regroupIn: 0, regroupOut: 1, workingUnits: 15, resultDigit: 5},
            {place: 'tenths', firstDigit: 6, secondDigit: 4,
                regroupIn: 1, regroupOut: 1, workingUnits: 11, resultDigit: 1},
            {place: 'ones', firstDigit: 1, secondDigit: 2,
                regroupIn: 1, regroupOut: 0, workingUnits: 4, resultDigit: 4}
        ]);
        expect(problem.model).toEqual({
            initial: {ones: 1, tenths: 6, hundredths: 8},
            steps: [
                {kind: 'join-second', before: {ones: 1, tenths: 6, hundredths: 8},
                    after: {ones: 3, tenths: 10, hundredths: 15}},
                {kind: 'compose-ten', lowerPlace: 'hundredths',
                    before: {ones: 3, tenths: 10, hundredths: 15},
                    after: {ones: 3, tenths: 11, hundredths: 5}},
                {kind: 'compose-ten', lowerPlace: 'tenths',
                    before: {ones: 3, tenths: 11, hundredths: 5},
                    after: {ones: 4, tenths: 1, hundredths: 5}}
            ],
            final: {ones: 4, tenths: 1, hundredths: 5}
        });
        expect(createDecimalAddSubtractProblem('addition', 76, 58)?.result.canonicalNumeral)
            .toBe('1.34');
    });

    it('borrows across a zero tenth in 1.02 - 0.38 = 0.64', () => {
        const problem = createDecimalAddSubtractProblem('subtraction', 102, 38)!;
        expectExactProblem(problem);
        expect(problem.columns).toEqual([
            {place: 'hundredths', firstDigit: 2, secondDigit: 8,
                regroupIn: 0, regroupOut: 1, workingUnits: 12, resultDigit: 4},
            {place: 'tenths', firstDigit: 0, secondDigit: 3,
                regroupIn: 1, regroupOut: 1, workingUnits: 9, resultDigit: 6},
            {place: 'ones', firstDigit: 1, secondDigit: 0,
                regroupIn: 1, regroupOut: 0, workingUnits: 0, resultDigit: 0}
        ]);
        expect(problem.model).toEqual({
            initial: {ones: 1, tenths: 0, hundredths: 2},
            steps: [
                {kind: 'decompose-one', lowerPlace: 'tenths',
                    before: {ones: 1, tenths: 0, hundredths: 2},
                    after: {ones: 0, tenths: 10, hundredths: 2}},
                {kind: 'decompose-one', lowerPlace: 'hundredths',
                    before: {ones: 0, tenths: 10, hundredths: 2},
                    after: {ones: 0, tenths: 9, hundredths: 12}},
                {kind: 'remove-second', before: {ones: 0, tenths: 9, hundredths: 12},
                    after: {ones: 0, tenths: 6, hundredths: 4}}
            ],
            final: {ones: 0, tenths: 6, hundredths: 4}
        });
    });

    it('handles zero placeholders, a 1.00 cascade, and no-regroup boundaries', () => {
        const cascade = createDecimalAddSubtractProblem('subtraction', 100, 37)!;
        expectExactProblem(cascade);
        expect(cascade.first.canonicalNumeral).toBe('1');
        expect(cascade.result.canonicalNumeral).toBe('0.63');
        expect(cascade.model.steps.map(step => step.kind))
            .toEqual(['decompose-one', 'decompose-one', 'remove-second']);

        const placeholder = createDecimalAddSubtractProblem('subtraction', 120, 7)!;
        expectExactProblem(placeholder);
        expect(placeholder.first.alignedDigits).toEqual([1, 2, 0]);
        expect(placeholder.second.alignedDigits).toEqual([0, 0, 7]);
        expect(placeholder.result.canonicalNumeral).toBe('1.13');

        const noCarry = createDecimalAddSubtractProblem('addition', 12, 23)!;
        const noBorrow = createDecimalAddSubtractProblem('subtraction', 59, 24)!;
        expectExactProblem(noCarry);
        expectExactProblem(noBorrow);
        expect(noCarry.model.steps.map(step => step.kind)).toEqual(['join-second']);
        expect(noBorrow.model.steps.map(step => step.kind)).toEqual(['remove-second']);
    });

    it('rejects invalid hundredths values, negative differences, and overflow', () => {
        expect(createDecimalAddSubtractProblem('addition', -1, 3)).toBeNull();
        expect(createDecimalAddSubtractProblem('addition', 1.5, 3)).toBeNull();
        expect(createDecimalAddSubtractProblem('addition', 1000, 3)).toBeNull();
        expect(createDecimalAddSubtractProblem('addition', 999, 1)).toBeNull();
        expect(createDecimalAddSubtractProblem('subtraction', 3, 4)).toBeNull();
        expect(createDecimalAddSubtractProblem('division' as never, 3, 4)).toBeNull();
    });
});

describe('DecimalAdditionSubtractionGenerator', () => {
    it('validates the exact operation configuration', () => {
        expect(() => generator.generate({} as never)).toThrow('operation');
        expect(() => generator.generate({operation: 'multiplication'} as never))
            .toThrow('Addition or Subtraction');
        expect(() => generator.generate({operation: 'addition', extra: true} as never))
            .toThrow('unexpected field');
    });

    it.each(['addition', 'subtraction'] as const)(
        'samples bounded %s with exchange and placeholder diversity', operation => {
            const patterns = new Set<string>();
            let placeholders = 0;
            let zeroCascade = 0;
            for (let seed = 0; seed < 400; seed++) {
                setSeed(`decimal-add-subtract-${operation}-${seed}`);
                const problem = generator.generate({operation})?.data;
                expect(problem).toBeDefined();
                expectExactProblem(problem!);
                expect(problem!.operation).toBe(operation);
                const first = problem!.first.valueInHundredths;
                const second = problem!.second.valueInHundredths;
                expect(first).toBeGreaterThan(0);
                expect(second).toBeGreaterThan(0);
                expect(first).toBeLessThanOrEqual(249);
                expect(second).toBeLessThanOrEqual(249);
                expect(problem!.result.valueInHundredths).toBeGreaterThan(0);
                expect(problem!.result.valueInHundredths).toBeLessThanOrEqual(498);
                expect(first % 10 !== 0 || second % 10 !== 0).toBe(true);
                const pattern = problem!.columns.slice(0, 2)
                    .map(column => column.regroupOut).join('');
                expect(pattern).not.toBe('00');
                patterns.add(pattern);
                if ((first % 10 === 0) !== (second % 10 === 0)) placeholders++;
                if (operation === 'subtraction'
                    && problem!.first.alignedDigits[1] === 0 && pattern === '11') {
                    zeroCascade++;
                }
            }
            expect(patterns).toEqual(new Set(['10', '01', '11']));
            expect(placeholders).toBeGreaterThan(0);
            if (operation === 'subtraction') expect(zeroCascade).toBeGreaterThan(0);
        }
    );

    it('replays the same instance from the same seed', () => {
        setSeed('decimal-add-subtract-replay');
        const first = generator.generate({operation: 'subtraction'});
        setSeed('decimal-add-subtract-replay');
        expect(generator.generate({operation: 'subtraction'})).toEqual(first);
    });
});
