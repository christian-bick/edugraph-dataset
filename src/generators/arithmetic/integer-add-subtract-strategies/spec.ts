import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {flexibleStrategyRows} from './domain.ts';

const strategyProfiles = [
    [[Area.AdditionMakeTen, Scope.SingleDigitSmallestOperand], 'addition-make-ten'],
    [[Area.AdditionNearDoubles, Scope.SingleDigitSmallestOperand], 'addition-near-doubles'],
    [[Area.AdditionNearDoubles, Scope.MultipleDigitSmallestOperand], 'addition-near-doubles'],
    [[Area.AdditionCompensation, Scope.SingleDigitLargestOperand], 'addition-compensation-single'],
    [[Area.AdditionCompensation, Scope.MultipleDigitLargestOperand], 'addition-compensation-multiple'],
    [[Area.SubtractionCompensation, Scope.SingleDigitLargestOperand], 'subtraction-compensation-single'],
    [[Area.SubtractionCompensation, Scope.MultipleDigitLargestOperand], 'subtraction-compensation-multiple'],
    [[Area.SubtractionMakeTen, Scope.TwoDigitLargestOperand], 'subtraction-make-ten'],
    [[Area.SubtractionThinkAddition, Scope.MultipleDigitLargestOperand], 'subtraction-think-addition']
] as const;
const strategyLabels = [...new Set(strategyProfiles.flatMap(([labels]) => labels))];
const baseResolveStrategy = selectExactLabelSetMap(strategyProfiles);
const rangeProfiles = canonicalRangeProfiles.filter(({range}) => range.max <= 1000 && [0, 5].includes(range.min)
    && range.min < range.max && strategyProfiles.some(([, strategy]) => flexibleStrategyRows(strategy, range).length > 0));
const rangeChoices = rangeProfiles.map(({labels}) => labels);
const rangeLabels = [...new Set(rangeChoices.flat())];

const permitsRange = (labels: string[], range: Parameters<typeof flexibleStrategyRows>[1]): boolean => {
    if (!strategyLabels.some(label => labels.includes(label))) return true;
    const strategy = baseResolveStrategy(labels);
    if (!strategy) return false;
    if (strategy === 'addition-near-doubles') {
        const single = labels.includes(Scope.SingleDigitSmallestOperand);
        const multiple = labels.includes(Scope.MultipleDigitSmallestOperand);
        if (single === multiple || single !== (range.max <= 20)) return false;
    }
    return flexibleStrategyRows(strategy, range).length > 0;
};
const resolveStrategy = withLabelChoices(exactResolver((labels: string[]) => {
    const strategy = baseResolveStrategy(labels);
    const range = resolveCanonicalRangeFromLabels(labels);
    return strategy && (!range || permitsRange(labels, range)) ? strategy : undefined;
}), {...baseResolveStrategy.labelChoices!, contextLabels: rangeLabels, resolvedContext: true});
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range && permitsRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability',
    contextLabels: strategyLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'integer-add-subtract-strategies',
    generalLabels: [Scope.TwoOperands, Scope.IntegerNumbers, Scope.Base10,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero],
    compatibility: [generatorLabelRule('flexible-strategy-canonical-band', [...strategyLabels, ...rangeLabels], selected => {
        const labels = [...strategyLabels, ...rangeLabels].filter(selected);
        const range = resolveCanonicalRangeFromLabels(labels);
        return range !== undefined && permitsRange(labels, range);
    })]
};

export const IntegerAddSubtractStrategiesGeneratorSchema = {
    strategy: [strategyLabels, resolveStrategy, strategyProfiles.map(([labels]) => labels)],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type IntegerAddSubtractStrategiesGeneratorConfig = ConfigFromSchema<typeof IntegerAddSubtractStrategiesGeneratorSchema>;
