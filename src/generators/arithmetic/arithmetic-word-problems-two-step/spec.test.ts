import {ArithmeticWordProblemsInterpretedRemainderGenerator} from '../arithmetic-word-problems-interpreted-remainder/generator.ts';
import {spec as remainderGeneratorSpec} from '../arithmetic-word-problems-interpreted-remainder/spec.ts';
import {ArithmeticWordProblemsRoundingGenerator} from '../arithmetic-word-problems-rounding/generator.ts';
import {spec as roundingGeneratorSpec} from '../arithmetic-word-problems-rounding/spec.ts';
import {ArithmeticWordProblemsLetterEquationGenerator} from '../arithmetic-word-problems-letter-equation/generator.ts';
import {spec as equationGeneratorSpec} from '../arithmetic-word-problems-letter-equation/spec.ts';
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
    const equationGenerator = new ArithmeticWordProblemsLetterEquationGenerator();
    const roundingGenerator = new ArithmeticWordProblemsRoundingGenerator();
    const remainderGenerator = new ArithmeticWordProblemsInterpretedRemainderGenerator();
    const generator = new ArithmeticWordProblemsTwoStepGenerator();

    it('declares invariant multi-step and sign constraints', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Scope.MultiStep,
            Scope.MultiLevelComposition,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]));
        expect(JSON.stringify(spec)).not.toContain('Ability.');
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
            expect(stub!.labels).toEqual(expect.arrayContaining([...entry.labels]));
        }
    });

    it('resolves the interpreted-remainder labels into their dedicated task', () => {
        const stub = generateWithLabels(remainderGenerator, [
            Area.Division,
            Area.ImperfectDivisibility,
            Area.Modulo,
            Scope.MultiStep,
            Ability.ResultInterpretation
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.kind).toBe('interpreted-remainder');
        expect([...remainderGeneratorSpec.generalLabels, ...stub!.labels]).toEqual(expect.arrayContaining([
            Area.Division,
            Area.ImperfectDivisibility,
            Area.Modulo
        ]));
        expect([...remainderGeneratorSpec.generalLabels, ...stub!.labels]).not.toContain(Ability.ResultInterpretation);
    });

    it('resolves equation-labelled targets across all ten operation groups', () => {
        for (const entry of operationCases) {
            const stub = generateWithLabels(equationGenerator, [
                ...entry.labels,
                Area.Equation,
                Scope.NumbersSmaller1000000,
                Ability.Formalization
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.kind).toBe('letter-equation');
            if (stub!.data.kind !== 'letter-equation') throw new Error('Expected equation payload.');
            expect(stub!.data.operations).toEqual(entry.operations);
            expect([...equationGeneratorSpec.generalLabels, ...stub!.labels]).toEqual(expect.arrayContaining([...entry.labels, Area.Equation]));
            expect([...equationGeneratorSpec.generalLabels, ...stub!.labels]).not.toContain(Ability.Formalization);
        }
    });

    it('resolves integer rounding into canonical rounding relations', () => {
        for (const operation of [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division]) {
            const stub = generateWithLabels(roundingGenerator, [
                operation,
                Area.IntegerRounding,
                Scope.NumbersSmaller1000000,
                Ability.PlausibilityEvaluation,
                Ability.ProcedureUnderstanding
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.kind).toBe('rounding');
            expect([...roundingGeneratorSpec.generalLabels, ...stub!.labels]).toEqual(expect.arrayContaining([
                operation,
                Area.IntegerRounding
            ]));
            expect([...roundingGeneratorSpec.generalLabels, ...stub!.labels]).not.toContain(Ability.PlausibilityEvaluation);
            expect([...roundingGeneratorSpec.generalLabels, ...stub!.labels]).not.toContain(Ability.ProcedureUnderstanding);
        }
    });
});
