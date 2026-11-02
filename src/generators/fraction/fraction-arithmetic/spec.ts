import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {GeneratorCompatibilityRule} from '../../../types/compatibility.ts';
import {fractionArithmeticUpperBounds} from './numeric-domain.ts';

const fractionArithmeticTaskLabels = [
    Area.IteratedOperation,
    Scope.FractionNumbers,
    Scope.IntegerNumbers,
    Scope.ProperFractions,
    Scope.ImproperFractions,
    Scope.MixedNumbers,
    Scope.UnitFractions,
    Scope.TenthFractions,
    Scope.UnlikeDenominators,
    Area.FractionEquivalence
] as const;

export type FractionArithmeticTaskConfig =
    | 'fraction-operation'
    | 'tenths-hundredths-addition'
    | 'decompose-proper'
    | 'decompose-mixed'
    | 'mixed-operation'
    | 'unlike-fraction-operation'
    | 'unlike-fraction-operation-proper'
    | 'unlike-fraction-operation-improper'
    | 'unlike-fraction-operation-proper-equivalence'
    | 'unlike-fraction-operation-improper-equivalence'
    | 'unlike-mixed-operation'
    | 'unlike-mixed-operation-equivalence'
    | 'unit-fraction-multiple'
    | 'whole-number-fraction-product-proper'
    | 'whole-number-fraction-product-improper';

const sameLabels = (actual: readonly string[], expected: readonly string[]): boolean =>
    actual.length === expected.length && expected.every(label => actual.includes(label));

const resolveTask = exactResolver((labels: string[]): FractionArithmeticTaskConfig | null => {
    const selectedTaskLabels = fractionArithmeticTaskLabels.filter(label => labels.includes(label));
    const unlikeFraction = selectedTaskLabels.includes(Scope.FractionNumbers)
        && selectedTaskLabels.includes(Scope.UnlikeDenominators);
    const taskLabels = selectedTaskLabels.filter(label => !(
        label === Scope.ProperFractions && (selectedTaskLabels.includes(Scope.FractionNumbers)
            || selectedTaskLabels.includes(Scope.TenthFractions)
            || selectedTaskLabels.includes(Scope.MixedNumbers) && !selectedTaskLabels.includes(Scope.ImproperFractions))
        || label === Scope.ImproperFractions && unlikeFraction));
    const operationLabels = [Area.Addition, Area.Subtraction, Area.Multiplication]
        .filter(label => labels.includes(label));
    if (sameLabels(taskLabels, [Scope.TenthFractions])
        && (operationLabels.length === 0 || sameLabels(operationLabels, [Area.Addition, Area.Multiplication]))) {
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
    if (sameLabels(taskLabels, [Scope.FractionNumbers, Scope.UnlikeDenominators])
        || sameLabels(taskLabels, [
            Scope.FractionNumbers, Scope.UnlikeDenominators, Area.FractionEquivalence
        ])) {
        if (selectedTaskLabels.includes(Scope.ProperFractions)) return selectedTaskLabels.includes(Area.FractionEquivalence)
            ? 'unlike-fraction-operation-proper-equivalence' : 'unlike-fraction-operation-proper';
        if (selectedTaskLabels.includes(Scope.ImproperFractions)) return selectedTaskLabels.includes(Area.FractionEquivalence)
            ? 'unlike-fraction-operation-improper-equivalence' : 'unlike-fraction-operation-improper';
        return null;
    }
    if (sameLabels(taskLabels, [Scope.MixedNumbers, Scope.UnlikeDenominators])
        || sameLabels(taskLabels, [
            Scope.MixedNumbers, Scope.UnlikeDenominators, Area.FractionEquivalence
        ])) {
        return selectedTaskLabels.includes(Area.FractionEquivalence)
            ? 'unlike-mixed-operation-equivalence' : 'unlike-mixed-operation';
    }
    return taskLabels.length === 0 ? 'fraction-operation' : null;
});

// ONT-E1/E5: these are evidenced presence classes, not absence claims about other
// involved fractions. Mixed-number inputs visibly contain proper fractional parts.
const canonicalTaskBundles = [
    [Scope.TenthFractions, Scope.ProperFractions],
    [Scope.FractionNumbers, Scope.ProperFractions],
    [Scope.ProperFractions],
    [Scope.ImproperFractions, Scope.MixedNumbers],
    [Scope.MixedNumbers, Scope.ProperFractions],
    [Area.IteratedOperation, Scope.IntegerNumbers, Scope.UnitFractions],
    [Area.IteratedOperation, Scope.IntegerNumbers, Scope.ProperFractions],
    [Area.IteratedOperation, Scope.IntegerNumbers, Scope.ImproperFractions],
    [Scope.FractionNumbers, Scope.UnlikeDenominators, Scope.ProperFractions],
    [Scope.FractionNumbers, Scope.UnlikeDenominators, Scope.ImproperFractions],
    [Scope.FractionNumbers, Scope.UnlikeDenominators, Area.FractionEquivalence, Scope.ProperFractions],
    [Scope.FractionNumbers, Scope.UnlikeDenominators, Area.FractionEquivalence, Scope.ImproperFractions],
    [Scope.MixedNumbers, Scope.UnlikeDenominators, Scope.ProperFractions],
    [Scope.MixedNumbers, Scope.UnlikeDenominators, Area.FractionEquivalence, Scope.ProperFractions]
] as const;
withLabelChoices(resolveTask, {
    kind: 'alternatives',
    alternatives: [
        [Scope.TenthFractions],
        [Scope.FractionNumbers],
        [Scope.MixedNumbers],
        [Scope.MixedNumbers, Scope.UnlikeDenominators],
        [Scope.MixedNumbers, Scope.UnlikeDenominators, Area.FractionEquivalence],
        ...canonicalTaskBundles
    ],
    defaults: [{whenNone: fractionArithmeticTaskLabels, labels: [Scope.FractionNumbers, Scope.ProperFractions]}],
    equivalenceGroups: [
        [[Scope.TenthFractions], [Scope.TenthFractions, Scope.ProperFractions]],
        [[Scope.FractionNumbers], [Scope.FractionNumbers, Scope.ProperFractions]],
        [[Scope.MixedNumbers], [Scope.MixedNumbers, Scope.ProperFractions]],
        [[Scope.MixedNumbers, Scope.UnlikeDenominators], [Scope.MixedNumbers, Scope.UnlikeDenominators, Scope.ProperFractions]],
        [[Scope.MixedNumbers, Scope.UnlikeDenominators, Area.FractionEquivalence],
            [Scope.MixedNumbers, Scope.UnlikeDenominators, Area.FractionEquivalence, Scope.ProperFractions]]
    ],
    contextLabels: [Area.Addition, Area.Subtraction, Area.Multiplication]
});

const rangeMappings = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20],
    [Scope.NumbersSmaller100, 100]] as const;
const rangeLabels = rangeMappings.map(([label]) => label);
const selectRange = selectExactLabelMap(rangeMappings.map(([label, upper]) => [label, createCanonicalNumericRange(upper)] as const));
const rangeContext = [...fractionArithmeticTaskLabels, Area.Addition, Area.Subtraction, Area.Multiplication];
// Retain the original unconstrained value for legacy direct calls; matched
// selections require one of the reviewed canonical capabilities below.
export const originalFractionArithmeticRange: CanonicalNumericRange = {
    min: 0, max: Number.MAX_SAFE_INTEGER, maximumAbove: -1, minimumBelow: 5
};
const rangeChoices = [[], ...rangeLabels.map(label => [label])];
const resolveArithmeticRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    if (!rangeContext.some(label => labels.includes(label))) return range ?? originalFractionArithmeticRange;
    const task = resolveTask(labels);
    if (!task) return undefined;
    const operation = labels.includes(Area.Subtraction) ? 'subtraction' : 'addition';
    return range && fractionArithmeticUpperBounds(task, operation).includes(range.max) ? range : undefined;
}), {kind: 'alternatives', alternatives: rangeChoices, contextLabels: rangeContext, resolvedContext: true});

import {generatorLabelRule} from '../../compatibility-rules.ts';

// Preserve the old exact task routing when new canonical bundles expose more-specific
// magnitude labels. A broad FractionNumbers request must not switch to mixed inputs.
const originalFractionForm: GeneratorCompatibilityRule = {
    id: 'fraction-arithmetic-original-number-form',
    dependencies: [{scope: 'target', label: Scope.FractionNumbers},
        {scope: 'target', label: Scope.MixedNumbers}, {scope: 'generator', label: Scope.MixedNumbers}],
    predicate: labels => !(labels.exact('target', Scope.FractionNumbers)
        && !labels.exact('target', Scope.MixedNumbers) && labels.exact('generator', Scope.MixedNumbers))
};

export const spec: GeneratorSpec = {
    generatorId: 'fraction-arithmetic',
    compatibility: [originalFractionForm, generatorLabelRule('fraction-task-operation', [
        Area.Addition, Area.Subtraction, Area.Multiplication, Area.IteratedOperation,
        Scope.IntegerNumbers, Scope.FractionNumbers, Scope.ProperFractions, Scope.ImproperFractions,
        Scope.MixedNumbers, Scope.UnitFractions, Scope.TenthFractions, Scope.CommonDenominator,
        Scope.UnlikeDenominators, Area.FractionEquivalence
    ], selected => {
        const addition = selected(Area.Addition);
        const multiplication = selected(Area.Multiplication);
        const iterated = selected(Area.IteratedOperation);
        if (selected(Scope.UnlikeDenominators)) {
            return !selected(Scope.CommonDenominator) && !iterated && !multiplication
                && (selected(Scope.FractionNumbers) !== selected(Scope.MixedNumbers))
                && (addition || selected(Area.Subtraction));
        }
        if (selected(Area.FractionEquivalence)) return false;
        if (multiplication && !addition) {
            return iterated && selected(Scope.IntegerNumbers) && (
                selected(Scope.UnitFractions) || selected(Scope.ProperFractions) || selected(Scope.ImproperFractions));
        }
        if (!selected(Scope.CommonDenominator) || iterated) return false;
        if (selected(Scope.TenthFractions)) return addition && multiplication;
        if (multiplication) return false;
        if (selected(Scope.ImproperFractions) && selected(Scope.MixedNumbers)) return addition;
        if ((selected(Scope.ProperFractions) || selected(Scope.ImproperFractions))
            && !selected(Scope.FractionNumbers) && !selected(Scope.MixedNumbers)) return addition;
        return (selected(Scope.FractionNumbers) || selected(Scope.MixedNumbers))
            && (addition || selected(Area.Subtraction));
    }), generatorLabelRule('fraction-task-range', [...rangeContext, ...rangeLabels], selected => {
        const task = resolveTask(rangeContext.filter(selected));
        const upper = rangeMappings.find(([label]) => selected(label))?.[1];
        const operation = selected(Area.Subtraction) ? 'subtraction' : 'addition';
        return !!task && upper !== undefined && fractionArithmeticUpperBounds(task, operation).includes(upper);
    })],
    generalLabels: [
        Area.Equation,
        Scope.SingleFrameOfReference,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const FractionArithmeticGeneratorSchema = {
    task: [fractionArithmeticTaskLabels, resolveTask, canonicalTaskBundles],
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
    ],
    range: [rangeLabels, resolveArithmeticRange, rangeChoices]
} as const;

export type FractionArithmeticGeneratorConfig = ConfigFromSchema<
    typeof FractionArithmeticGeneratorSchema
>;
