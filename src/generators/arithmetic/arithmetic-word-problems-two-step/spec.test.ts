import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticWordProblemsTwoStepGenerator} from './generator.ts';
import {spec} from './spec.ts';

const operationCases = [
    {labels: [Area.Addition], operations: ['addition', 'addition']},
    {labels: [Area.Subtraction], operations: ['subtraction', 'subtraction']},
    {labels: [Area.Multiplication], operations: ['multiplication', 'multiplication']},
    {labels: [Area.Division], operations: ['division', 'division']},
    {labels: [Area.Addition, Area.Subtraction], operations: ['addition', 'subtraction']},
    {labels: [Area.Addition, Area.Multiplication], operations: ['multiplication', 'addition']},
    {labels: [Area.Addition, Area.Division], operations: ['division', 'addition']},
    {labels: [Area.Subtraction, Area.Multiplication], operations: ['multiplication', 'subtraction']},
    {labels: [Area.Subtraction, Area.Division], operations: ['division', 'subtraction']},
    {labels: [Area.Multiplication, Area.Division], operations: ['multiplication', 'division']}
] as const;

describe('ArithmeticWordProblemsTwoStepGenerator spec integration', () => {
    const generator = new ArithmeticWordProblemsTwoStepGenerator();

    it('declares invariant multi-step and sign constraints', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Scope.MultiStep,
            Scope.MultiLevelComposition,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]));
    });

    it('preserves the legacy task while resolving all reviewed operation groups', () => {
        for (const entry of operationCases) {
            const stub = generateWithLabels(generator, [
                ...entry.labels,
                Scope.NumbersSmaller100,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersWithoutZero
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.kind).toBe('two-step');
            if (stub!.data.kind !== 'two-step') throw new Error('Expected legacy payload.');
            expect(stub!.data.operations).toEqual(entry.operations);
            expect(stub!.tags).toEqual(expect.arrayContaining([...entry.labels]));
        }
    });

    it('resolves the interpreted-remainder labels into their dedicated task', () => {
        const stub = generateWithLabels(generator, [
            Area.Division,
            Area.ImperfectDivisibility,
            Area.Modulo,
            Scope.MultiStep,
            Ability.ResultInterpretation
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.kind).toBe('interpreted-remainder');
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Area.Division,
            Area.ImperfectDivisibility,
            Area.Modulo
        ]));
    });

    it('resolves equation-labelled targets across all ten operation groups', () => {
        for (const entry of operationCases) {
            const stub = generateWithLabels(generator, [
                ...entry.labels,
                Area.Equation,
                Scope.NumbersSmaller1000000,
                Ability.Formalization
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.kind).toBe('letter-equation');
            if (stub!.data.kind !== 'letter-equation') throw new Error('Expected equation payload.');
            expect(stub!.data.operations).toEqual(entry.operations);
            expect(stub!.tags).toEqual(expect.arrayContaining([...entry.labels, Area.Equation]));
        }
    });

    it('resolves estimation and integer rounding into reasonableness checks', () => {
        for (const operation of [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division]) {
            const stub = generateWithLabels(generator, [
                operation,
                Area.Estimation,
                Area.IntegerRounding,
                Scope.NumbersSmaller1000000,
                Ability.ResultInterpretation,
                Ability.ProcedureUnderstanding
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.kind).toBe('reasonableness');
            expect(stub!.tags).toEqual(expect.arrayContaining([
                operation,
                Area.Estimation,
                Area.IntegerRounding
            ]));
        }
    });
});
