import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, withLabelChoices} from '../../../types/schema.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

const lowerLabels = [Scope.NumbersLarger5, Scope.NumbersLarger10];
const rangeChoices = [[], [Scope.NumbersLarger5], [Scope.NumbersLarger10]] as const;
const resolveRange = withLabelChoices(selectExactLabelSetMap([
    [rangeChoices[0], createCanonicalNumericRange(1000000)],
    [rangeChoices[1], createCanonicalNumericRange(1000000, 5)],
    [rangeChoices[2], createCanonicalNumericRange(1000000, 10)]
] as const), {kind: 'alternatives', alternatives: rangeChoices});

export const spec: GeneratorSpec = {
    generatorId: 'place-value-scaling',
    generalLabels: [
        Area.PlaceValue,
        Area.ProportionalScaling,
        Area.Multiplication,
        Area.Division,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller1000000
    ]
};

export const PlaceValueScalingGeneratorSchema = {
    range: [lowerLabels, resolveRange, rangeChoices]
} as const;

export type PlaceValueScalingGeneratorConfig = ConfigFromSchema<
    typeof PlaceValueScalingGeneratorSchema
>;
