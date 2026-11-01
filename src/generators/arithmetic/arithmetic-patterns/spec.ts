import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {hasLabel, selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {patternDomain, patternProperty} from './domain.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

const contextLabels = [Area.Addition, Area.Multiplication, Area.CommutativeLaw, Area.AssociativeLaw,
    Area.DistributiveLaw, Scope.NumbersWithZero, Scope.NumbersWithoutZero];
const operationFromLabels = selectExactLabelMap([[Area.Addition, 'addition'], [Area.Multiplication, 'multiplication']] as const);
const permitsRange = (labels: string[], range: Parameters<typeof patternDomain>[2]): boolean => {
    if (!contextLabels.some(label => labels.includes(label))) return true;
    const operation = operationFromLabels(labels);
    const property = patternProperty(labels.includes(Area.CommutativeLaw), labels.includes(Area.AssociativeLaw),
        labels.includes(Area.DistributiveLaw));
    return operation !== undefined && property !== undefined && patternDomain(operation, property, range).length > 0;
};
const ranges = canonicalRangeProfiles.filter(({range}) => range.max <= 10000 && [0, 5].includes(range.min)
    && (['addition', 'multiplication'] as const).some(operation =>
        ([false, 'commutative', 'associative', 'distributive'] as const).some(property =>
            patternDomain(operation, property, range).length > 0)));
const rangeChoices = ranges.map(({labels}) => labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range && permitsRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: rangeChoices,
    contextLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-patterns',
    compatibility: [generatorLabelRule('pattern-property-law', [
        Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw, Area.Multiplication
    ], selected => Number(selected(Area.CommutativeLaw)) + Number(selected(Area.AssociativeLaw))
        + Number(selected(Area.DistributiveLaw)) <= 1
        && (!selected(Area.DistributiveLaw) || selected(Area.Multiplication))),
        generatorLabelRule('pattern-canonical-band', [...contextLabels, ...rangeLabels], selected => {
            const labels = [...contextLabels, ...rangeLabels].filter(selected);
            const range = resolveCanonicalRangeFromLabels(labels);
            return range !== undefined && permitsRange(labels, range);
        })],
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

const resolveOperation = selectExactLabelMap([
    [Area.Addition, 'addition'],
    [Area.Multiplication, 'multiplication']
] as const);

export const ArithmeticPatternsGeneratorSchema = {
    operation: [[Area.Addition, Area.Multiplication], resolveOperation],
    useCommutativeLaw: [[Area.CommutativeLaw], hasLabel(Area.CommutativeLaw)],
    useAssociativeLaw: [[Area.AssociativeLaw], hasLabel(Area.AssociativeLaw)],
    useDistributiveLaw: [
        [Area.DistributiveLaw, Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        selectExactLabelSetMap([
            [[], false],
            [[Scope.NumbersWithoutZero], false],
            [[Area.DistributiveLaw], true],
            [[Area.DistributiveLaw, Scope.NumbersWithZero], true]
        ] as const),
        [[Area.DistributiveLaw, Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]
    ],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type ArithmeticPatternsGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticPatternsGeneratorSchema
>;
