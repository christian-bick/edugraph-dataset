import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';

const fractionArithmeticTaskLabels = [
    Area.IteratedOperation,
    Scope.FractionNumbers,
    Scope.IntegerNumbers,
    Scope.ProperFractions,
    Scope.ImproperFractions,
    Scope.MixedNumbers,
    Scope.UnitFractions
] as const;

export type FractionArithmeticTaskConfig =
    | 'fraction-operation'
    | 'tenths-hundredths-addition'
    | 'decompose-proper'
    | 'decompose-mixed'
    | 'mixed-operation'
    | 'unit-fraction-multiple'
    | 'whole-number-fraction-product-proper'
    | 'whole-number-fraction-product-improper';

const sameLabels = (actual: readonly string[], expected: readonly string[]): boolean =>
    actual.length === expected.length && expected.every(label => actual.includes(label));

const resolveTask: ResolverFn<FractionArithmeticTaskConfig | null> = labels => {
    const taskLabels = fractionArithmeticTaskLabels.filter(label => labels.includes(label));
    const operationLabels = [Area.Addition, Area.Subtraction, Area.Multiplication]
        .filter(label => labels.includes(label));
    if (taskLabels.length === 0
        && sameLabels(operationLabels, [Area.Addition, Area.Multiplication])) {
        return 'tenths-hundredths-addition';
    }
    if (sameLabels(taskLabels, [Scope.FractionNumbers])) {
        return 'fraction-operation';
    }
    if (sameLabels(taskLabels, [Scope.ProperFractions])) {
        return 'decompose-proper';
    }
    if (sameLabels(taskLabels, [
        Scope.ImproperFractions,
        Scope.MixedNumbers
    ])) {
        return 'decompose-mixed';
    }
    if (sameLabels(taskLabels, [Scope.MixedNumbers])) {
        return 'mixed-operation';
    }
    if (sameLabels(taskLabels, [
        Area.IteratedOperation,
        Scope.IntegerNumbers,
        Scope.UnitFractions
    ])) {
        return 'unit-fraction-multiple';
    }
    if (sameLabels(taskLabels, [
        Area.IteratedOperation,
        Scope.IntegerNumbers,
        Scope.ProperFractions
    ])) {
        return 'whole-number-fraction-product-proper';
    }
    if (sameLabels(taskLabels, [
        Area.IteratedOperation,
        Scope.IntegerNumbers,
        Scope.ImproperFractions
    ])) {
        return 'whole-number-fraction-product-improper';
    }
    return null;
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
