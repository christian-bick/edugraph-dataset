import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';

const fractionArithmeticTaskLabels = [
    Area.IteratedOperation,
    Scope.FractionNumbers,
    Scope.IntegerNumbers,
    Scope.ProperFractions,
    Scope.ImproperFractions,
    Scope.MixedNumbers,
    Scope.UnitFractions,
    Scope.TenthFractions
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

const resolveTask = exactResolver((labels: string[]): FractionArithmeticTaskConfig | null => {
    const taskLabels = fractionArithmeticTaskLabels.filter(label => labels.includes(label));
    const operationLabels = [Area.Addition, Area.Subtraction, Area.Multiplication]
        .filter(label => labels.includes(label));
    if (sameLabels(taskLabels, [Scope.TenthFractions])
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
});
withLabelChoices(resolveTask, {
    kind: 'alternatives',
    alternatives: [
        [Scope.TenthFractions],
        [Scope.FractionNumbers],
        [Scope.ProperFractions],
        [Scope.ImproperFractions, Scope.MixedNumbers],
        [Scope.MixedNumbers],
        [Area.IteratedOperation, Scope.IntegerNumbers, Scope.UnitFractions],
        [Area.IteratedOperation, Scope.IntegerNumbers, Scope.ProperFractions],
        [Area.IteratedOperation, Scope.IntegerNumbers, Scope.ImproperFractions]
    ],
    contextLabels: [Area.Addition, Area.Subtraction, Area.Multiplication]
});

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'fraction-arithmetic',
    compatibility: [generatorLabelRule('fraction-task-operation', [
        Area.Addition, Area.Subtraction, Area.Multiplication, Area.IteratedOperation,
        Scope.IntegerNumbers, Scope.FractionNumbers, Scope.ProperFractions, Scope.ImproperFractions,
        Scope.MixedNumbers, Scope.UnitFractions, Scope.TenthFractions, Scope.CommonDenominator
    ], selected => {
        const addition = selected(Area.Addition);
        const multiplication = selected(Area.Multiplication);
        const iterated = selected(Area.IteratedOperation);
        if (multiplication && !addition) {
            return iterated && selected(Scope.IntegerNumbers) && (
                selected(Scope.UnitFractions) || selected(Scope.ProperFractions) || selected(Scope.ImproperFractions));
        }
        if (!selected(Scope.CommonDenominator) || iterated) return false;
        if (selected(Scope.TenthFractions)) return addition && multiplication;
        if (multiplication) return false;
        if (selected(Scope.ProperFractions) || selected(Scope.ImproperFractions)) return addition;
        return (selected(Scope.FractionNumbers) || selected(Scope.MixedNumbers))
            && (addition || selected(Area.Subtraction));
    })],
    generalLabels: [
        Area.Equation,
        Scope.SingleFrameOfReference
    ]
};

export const FractionArithmeticGeneratorSchema = {
    task: [fractionArithmeticTaskLabels, resolveTask, [[Scope.FractionNumbers]]],
    usesCommonDenominator: [
        [Scope.CommonDenominator],
        hasLabel(Scope.CommonDenominator)
    ],
    operation: [
        [Area.Addition, Area.Subtraction, Area.Multiplication],
        selectExactLabelSetMap([
            [[Area.Addition], 'addition'],
            [[Area.Addition, Area.Multiplication], 'addition'],
            [[Area.Subtraction], 'subtraction'],
            [[Area.Multiplication], 'multiplication']
        ]),
        [
            [Area.Addition],
            [Area.Subtraction],
            [Area.Multiplication]
        ]
    ]
} as const;

export type FractionArithmeticGeneratorConfig = ConfigFromSchema<
    typeof FractionArithmeticGeneratorSchema
>;
