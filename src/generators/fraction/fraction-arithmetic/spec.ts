import {Ability, Area, Scope} from 'edugraph-ts';
import {hasLabel, selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';

const fractionArithmeticTaskLabels = [
    Area.IteratedOperation,
    Ability.Interpretation,
    Ability.ProcedureUnderstanding,
    Ability.Formalization,
    Ability.ProcedureExecution,
    Scope.FractionNumbers,
    Scope.IntegerNumbers,
    Scope.ProperFractions,
    Scope.ImproperFractions,
    Scope.MixedNumbers,
    Scope.UnitFractions
] as const;

export type FractionArithmeticTaskConfig =
    | 'interpret-operation'
    | 'fraction-operation'
    | 'decompose-proper'
    | 'decompose-mixed'
    | 'mixed-operation'
    | 'unit-fraction-multiple'
    | 'whole-number-fraction-product-proper'
    | 'whole-number-fraction-product-improper'
    | 'fraction-multiplication-problem-proper'
    | 'fraction-multiplication-problem-improper';

const sameLabels = (actual: readonly string[], expected: readonly string[]): boolean =>
    actual.length === expected.length && expected.every(label => actual.includes(label));

const resolveTask: ResolverFn<FractionArithmeticTaskConfig | undefined> = labels => {
    const taskLabels = fractionArithmeticTaskLabels.filter(label => labels.includes(label));
    if (sameLabels(taskLabels, [Ability.Interpretation, Scope.FractionNumbers])) {
        return 'interpret-operation';
    }
    if (sameLabels(taskLabels, [Ability.ProcedureExecution, Scope.FractionNumbers])) {
        return 'fraction-operation';
    }
    if (sameLabels(taskLabels, [
        Ability.ProcedureUnderstanding,
        Ability.Formalization,
        Scope.ProperFractions
    ])) {
        return 'decompose-proper';
    }
    if (sameLabels(taskLabels, [
        Ability.ProcedureUnderstanding,
        Ability.Formalization,
        Scope.ImproperFractions,
        Scope.MixedNumbers
    ])) {
        return 'decompose-mixed';
    }
    if (sameLabels(taskLabels, [Ability.ProcedureExecution, Scope.MixedNumbers])) {
        return 'mixed-operation';
    }
    if (sameLabels(taskLabels, [
        Area.IteratedOperation,
        Ability.Interpretation,
        Scope.IntegerNumbers,
        Scope.UnitFractions
    ])) {
        return 'unit-fraction-multiple';
    }
    if (sameLabels(taskLabels, [
        Area.IteratedOperation,
        Ability.ProcedureUnderstanding,
        Scope.IntegerNumbers,
        Scope.ProperFractions
    ])) {
        return 'whole-number-fraction-product-proper';
    }
    if (sameLabels(taskLabels, [
        Area.IteratedOperation,
        Ability.ProcedureUnderstanding,
        Scope.IntegerNumbers,
        Scope.ImproperFractions
    ])) {
        return 'whole-number-fraction-product-improper';
    }
    if (sameLabels(taskLabels, [
        Area.IteratedOperation,
        Ability.ProcedureExecution,
        Scope.IntegerNumbers,
        Scope.ProperFractions
    ])) {
        return 'fraction-multiplication-problem-proper';
    }
    if (sameLabels(taskLabels, [
        Area.IteratedOperation,
        Ability.ProcedureExecution,
        Scope.IntegerNumbers,
        Scope.ImproperFractions
    ])) {
        return 'fraction-multiplication-problem-improper';
    }
    return undefined;
};

export const spec: GeneratorSpec = {
    generatorId: 'fraction-arithmetic',
    generalLabels: [
        Area.FractionArithmetic,
        Area.FractionNotation,
        Area.Equation,
        Scope.SingleFrameOfReference
    ]
};

export const FractionArithmeticGeneratorSchema = {
    task: [fractionArithmeticTaskLabels, resolveTask],
    usesCommonDenominator: [
        [Scope.CommonDenominator],
        hasLabel(Scope.CommonDenominator)
    ],
    operation: [
        [Area.Addition, Area.Subtraction, Area.Multiplication],
        selectCanonicalLabel([
            [[Area.Addition], 'addition'],
            [[Area.Subtraction], 'subtraction'],
            [[Area.Multiplication], 'multiplication']
        ])
    ]
} as const;

export type FractionArithmeticGeneratorConfig = ConfigFromSchema<
    typeof FractionArithmeticGeneratorSchema
>;
