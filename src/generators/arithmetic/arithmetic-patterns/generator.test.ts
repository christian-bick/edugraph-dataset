import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticRecurrencePatternProblem} from '../../../types/problems.ts';
import {ArithmeticPatternsGenerator} from './generator.ts';

describe('ArithmeticPatternsGenerator', () => {
    const generator = new ArithmeticPatternsGenerator();
    const config = (
        operation: 'addition' | 'multiplication',
        model: 'operation-table' | 'recurrence' = 'recurrence'
    ) => ({
        model,
        operation,
        useCommutativeLaw: false,
        useAssociativeLaw: false,
        useDistributiveLaw: false
    });

    it('strictly validates configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it('generates only the canonical operation-table model for rule recognition', () => {
        for (const operation of ['addition', 'multiplication'] as const) {
            setSeed(3);
            const first = generator.generate(config(operation, 'operation-table'))!.data;
            setSeed(81);
            const second = generator.generate(config(operation, 'operation-table'))!.data;

            expect(first).toEqual(second);
            expect(first.kind).toBe('operation-table');
            if (first.kind !== 'operation-table') throw new Error('Expected an operation table.');
            expect(first.operands).toEqual([0, 1, 2, 3, 4, 5, 6]);
            expect(first.values).toHaveLength(first.operands.length);
            first.values.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
                expect(value).toBe(operation === 'addition'
                    ? first.operands[rowIndex]! + first.operands[columnIndex]!
                    : first.operands[rowIndex]! * first.operands[columnIndex]!);
            }));
            expect(first).not.toHaveProperty('focusRow');
            expect(first).not.toHaveProperty('sequence');
            expect(first).not.toHaveProperty('highlightedCells');
            expect(first).not.toHaveProperty('terms');
        }
    });

    it('generates only a typed recurrence and its mathematical feature evidence', () => {
        for (const operation of ['addition', 'multiplication'] as const) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const data = generator.generate(config(operation))!.data;
                expect(data.kind).toBe('recurrence');
                if (data.kind !== 'recurrence') throw new Error('Expected a recurrence.');

                expect(data.terms.length).toBeGreaterThanOrEqual(5);
                expect(data.lawWitness).toBeUndefined();
                expect(data.emergentFeature.kind).toBe(operation === 'addition'
                    ? 'alternating-parity'
                    : 'even-after-start');
                expect(data).not.toHaveProperty('operation');
                expect(data).not.toHaveProperty('table');
                expect(data).not.toHaveProperty('ruleText');
                expect(data).not.toHaveProperty('inferredFeature');
                expect(data).not.toHaveProperty('featureEvidence');
                expect(data).not.toHaveProperty('explanation');
                expect(data).not.toHaveProperty('task');
                expect(data).not.toHaveProperty('missingTermIndex');

                const recurrence = data.recurrence;
                expect(recurrence.kind).not.toBe('position-multiple');
                if (recurrence.kind === 'position-multiple') throw new Error('Unexpected positional recurrence.');
                expect(data.terms[0]).toBe(recurrence.start);
                data.terms.slice(1).forEach((term, index) => {
                    expect(term).toBe(recurrence.kind === 'add-constant'
                        ? data.terms[index]! + recurrence.operand
                        : data.terms[index]! * recurrence.operand);
                });
            }
        }
    });

    it.each([
        ['addition', 'commutative'],
        ['addition', 'associative'],
        ['multiplication', 'commutative'],
        ['multiplication', 'associative'],
        ['multiplication', 'distributive']
    ] as const)('preserves a structured %s %s witness', (operation, propertyLaw) => {
        setSeed(27);
        const data = generator.generate({
            ...config(operation),
            useCommutativeLaw: propertyLaw === 'commutative',
            useAssociativeLaw: propertyLaw === 'associative',
            useDistributiveLaw: propertyLaw === 'distributive'
        })!.data as ArithmeticRecurrencePatternProblem;

        expect(data.kind).toBe('recurrence');
        expect(data.lawWitness?.law).toBe(propertyLaw);
        expect(data.lawWitness?.result).toBeTypeOf('number');
        expect(data).not.toHaveProperty('propertyLaw');
        expect(data).not.toHaveProperty('leftExpression');
        expect(data).not.toHaveProperty('rightExpression');
        expect(data).not.toHaveProperty('propertyResult');
        expect(data).not.toHaveProperty('highlightedCells');

        const witness = data.lawWitness!;
        if (witness.law === 'commutative') {
            const [left, right] = witness.operands;
            expect(witness.result).toBe(operation === 'addition' ? left + right : left * right);
        } else if (witness.law === 'associative') {
            const [first, second, third] = witness.operands;
            expect(witness.result).toBe(operation === 'addition'
                ? first + second + third
                : first * second * third);
        } else {
            expect(witness.result).toBe(
                witness.multiplier * (witness.addends[0] + witness.addends[1])
            );
        }
    });

    it('rejects unsupported and contradictory mathematical configurations', () => {
        expect(generator.generate({...config('addition'), operation: 'unsupported'} as never)).toBeNull();
        expect(generator.generate({...config('addition'), model: 'unsupported'} as never)).toBeNull();
        expect(generator.generate({
            ...config('multiplication'),
            useCommutativeLaw: true,
            useAssociativeLaw: true
        })).toBeNull();
        expect(generator.generate({
            ...config('addition'),
            useDistributiveLaw: true
        })).toBeNull();
        expect(generator.generate({
            ...config('addition', 'operation-table'),
            useCommutativeLaw: true
        })).toBeNull();
    });
});
