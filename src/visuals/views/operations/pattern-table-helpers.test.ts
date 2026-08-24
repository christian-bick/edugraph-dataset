import {describe, expect, it} from 'vitest';
import {ArithmeticPatternsGenerator} from '../../../generators/arithmetic/arithmetic-patterns/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {
    ArithmeticOperationTablePatternProblem,
    ArithmeticRecurrencePatternProblem
} from '../../../types/problems.ts';
import {
    featureEvidence,
    featureExplanation,
    featureOptions,
    featureStatement,
    getPatternTaskIdentity,
    isValidOperationTable,
    isValidRecurrence,
    lawPresentation,
    operationTableRule,
    recurrenceOperation,
    recurrenceRule,
    recurrenceStart,
    selectMissingTermIndex,
    selectTableFocusOperand
} from './pattern-table-helpers.ts';

const generator = new ArithmeticPatternsGenerator();

function recurrence(
    operation: 'addition' | 'multiplication',
    law?: 'commutative' | 'associative' | 'distributive'
): ArithmeticRecurrencePatternProblem {
    setSeed(17);
    return generator.generate({
        model: 'recurrence',
        operation,
        useCommutativeLaw: law === 'commutative',
        useAssociativeLaw: law === 'associative',
        useDistributiveLaw: law === 'distributive'
    })!.data as ArithmeticRecurrencePatternProblem;
}

describe('getPatternTaskIdentity', () => {
    it('names classification tasks as classification while keeping generation distinct', () => {
        expect(getPatternTaskIdentity(undefined)).toEqual({
            eyebrow: 'Classify the table pattern',
            instruction: 'Choose the pattern-rule category that classifies the highlighted row.'
        });
        expect(getPatternTaskIdentity('identify-feature')).toEqual({
            eyebrow: 'Classify the number pattern',
            instruction: 'Choose the pattern-feature category supported by the generated terms.'
        });
        expect(getPatternTaskIdentity('generate').eyebrow).toBe('Number pattern');
    });
});

describe('canonical pattern projections', () => {
    it('derives and validates operation-table presentation without a focused-row payload field', () => {
        for (const operation of ['addition', 'multiplication'] as const) {
            const table: ArithmeticOperationTablePatternProblem = {
                kind: 'operation-table',
                operation,
                operands: [0, 1, 2, 3, 4, 5, 6],
                values: Array.from({length: 7}, (_, row) => Array.from(
                    {length: 7},
                    (_, column) => operation === 'addition' ? row + column : row * column
                ))
            };
            expect(isValidOperationTable(table)).toBe(true);
            expect(operationTableRule(table, 3)).toBe(
                operation === 'addition' ? 'Increase by 1' : 'Increase by 3'
            );
            expect(isValidOperationTable({
                ...table,
                values: table.values.map((row, index) => index === 2 ? [99, ...row.slice(1)] : row)
            })).toBe(false);
        }
    });

    it('derives rule, feature, evidence, and explanation prose from typed recurrences', () => {
        const addition = recurrence('addition');
        expect(recurrenceOperation(addition)).toBe('addition');
        expect(recurrenceStart(addition)).toBe(addition.terms[0]);
        expect(recurrenceRule(addition)).toContain('Add');
        expect(featureStatement(addition)).toContain('alternate');
        expect(featureEvidence(addition)).toContain(' is ');
        expect(featureExplanation(addition)).toContain('changes odd to even');
        expect(featureOptions(addition)).toContain('Every term is even.');

        const multiplication = recurrence('multiplication');
        expect(recurrenceOperation(multiplication)).toBe('multiplication');
        expect(recurrenceRule(multiplication)).toContain('Multiply by');
        expect(featureStatement(multiplication)).toContain('every term is even');
        expect(featureExplanation(multiplication)).toContain('produces an even number');
        expect(featureOptions(multiplication)).toContain('Every term is odd.');
    });

    it.each([
        ['addition', 'commutative'],
        ['addition', 'associative'],
        ['multiplication', 'commutative'],
        ['multiplication', 'associative'],
        ['multiplication', 'distributive']
    ] as const)('projects a complete %s %s law witness', (operation, law) => {
        const data = recurrence(operation, law);
        const presentation = lawPresentation(data)!;
        expect(presentation.name.toLowerCase()).toContain(law);
        expect(presentation.leftExpression).toBeTruthy();
        expect(presentation.rightExpression).toBeTruthy();
        expect(presentation.result).toBe(data.lawWitness!.result);
        expect(featureExplanation(data).toLowerCase()).toContain(law);
        expect(isValidRecurrence(data)).toBe(true);
    });

    it('rejects inconsistent recurrence, feature, and law evidence', () => {
        const addition = recurrence('addition');
        expect(isValidRecurrence({...addition, terms: [1, 4, 8, 10, 13]})).toBe(false);
        expect(isValidRecurrence({
            ...addition,
            emergentFeature: {kind: 'even-after-start'}
        })).toBe(false);
        expect(isValidRecurrence({
            ...addition,
            emergentFeature: {kind: 'unknown'}
        } as unknown as ArithmeticRecurrencePatternProblem)).toBe(false);
        expect(isValidRecurrence({
            ...addition,
            lawWitness: null
        } as unknown as ArithmeticRecurrencePatternProblem)).toBe(false);

        const commutative = recurrence('multiplication', 'commutative');
        expect(isValidRecurrence({
            ...commutative,
            lawWitness: {...commutative.lawWitness!, result: -1}
        } as ArithmeticRecurrencePatternProblem)).toBe(false);
        const malformedWitnesses = [
            {law: 'unknown'},
            {law: 'commutative', result: commutative.lawWitness!.result}
        ];
        for (const lawWitness of malformedWitnesses) {
            const malformed = {
                ...commutative,
                lawWitness
            } as unknown as ArithmeticRecurrencePatternProblem;
            expect(() => isValidRecurrence(malformed)).not.toThrow();
            expect(isValidRecurrence(malformed)).toBe(false);
        }

        const commutativeWitness = commutative.lawWitness!;
        if (commutativeWitness.law !== 'commutative') throw new Error('Expected commutative witness.');
        expect(isValidRecurrence({
            ...commutative,
            lawWitness: {
                ...commutativeWitness,
                operands: [commutativeWitness.operands[1], commutativeWitness.operands[0]]
            }
        })).toBe(false);

        const associative = recurrence('addition', 'associative');
        const associativeWitness = associative.lawWitness!;
        if (associativeWitness.law !== 'associative') throw new Error('Expected associative witness.');
        expect(isValidRecurrence({
            ...associative,
            lawWitness: {
                ...associativeWitness,
                operands: [
                    associativeWitness.operands[0],
                    associativeWitness.operands[1] - 1,
                    associativeWitness.operands[2] + 1
                ]
            }
        })).toBe(false);

        const distributive = recurrence('multiplication', 'distributive');
        const distributiveWitness = distributive.lawWitness!;
        if (distributiveWitness.law !== 'distributive') throw new Error('Expected distributive witness.');
        expect(isValidRecurrence({
            ...distributive,
            lawWitness: {
                ...distributiveWitness,
                addends: [distributiveWitness.addends[0] - 1, 2]
            }
        })).toBe(false);
    });

    it('resolves a safe fingerprint-visible missing-term index from seeded view entropy', () => {
        const indices = new Set<number>();
        const focusOperands = new Set<number>();
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            indices.add(selectMissingTermIndex());
            setSeed(seed);
            focusOperands.add(selectTableFocusOperand());
        }
        expect([...indices].sort()).toEqual([2, 3, 4]);
        expect([...focusOperands].sort()).toEqual([2, 3, 4, 5]);
    });

    it('rejects malformed operation-table dimensions', () => {
        const malformed: ArithmeticOperationTablePatternProblem = {
            kind: 'operation-table',
            operation: 'addition',
            operands: [0, 1, 2, 3],
            values: [[0], [1], [2], [3]]
        };
        expect(isValidOperationTable(malformed)).toBe(false);
    });
});
