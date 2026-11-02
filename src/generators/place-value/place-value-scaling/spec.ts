import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const zeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero];
const lowerLabel = Scope.NumbersLarger5;
const resolveZero = withLabelChoices(exactResolver((labels: string[]) => {
    const present = labels.includes(Scope.NumbersWithZero), absent = labels.includes(Scope.NumbersWithoutZero);
    return present === absent || present && labels.includes(lowerLabel) ? undefined : present;
}), {kind: 'alternatives', alternatives: zeroLabels.map(label => [label]), contextLabels: [lowerLabel], resolvedContext: true});
const resolveMinimum = withLabelChoices(selectExactLabelSetMap([
    [[], 1], [[lowerLabel], 5]
] as const), {kind: 'alternatives', alternatives: [[], [lowerLabel]], contextLabels: zeroLabels,
    resolvedContext: true, defaults: [{whenAll: [Scope.NumbersWithZero], labels: []}]});

export const spec: GeneratorSpec = {
    generatorId: 'place-value-scaling',
    compatibility: [generatorLabelRule('scaling-coefficient-lower', [...zeroLabels, lowerLabel], selected =>
        !selected(lowerLabel) || selected(Scope.NumbersWithoutZero))],
    generalLabels: [
        Area.PlaceValue,
        Area.ProportionalScaling,
        Area.Multiplication,
        Area.Division,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller1000000
    ]
};

export const PlaceValueScalingGeneratorSchema = {
    hasZeroCoefficient: [
        zeroLabels,
        resolveZero,
        zeroLabels.map(label => [label])
    ],
    coefficientMinimum: [[lowerLabel], resolveMinimum, [[], [lowerLabel]]]
} as const;

export type PlaceValueScalingGeneratorConfig = ConfigFromSchema<
    typeof PlaceValueScalingGeneratorSchema
>;
