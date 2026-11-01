import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {withLabelChoices} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const rangeChoices = [[Scope.NumbersSmaller10], [Scope.NumbersLarger5, Scope.NumbersSmaller10]] as const;
const selectRange = selectExactLabelSetMap([
    [rangeChoices[0], createCanonicalNumericRange(10)],
    [rangeChoices[1], createCanonicalNumericRange(10, 5)]
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'place-value-make-ten',
    compatibility: [generatorLabelRule('make-ten-zero-lower', [Scope.NumbersWithZero, Scope.NumbersLarger5],
        selected => !selected(Scope.NumbersWithZero) || !selected(Scope.NumbersLarger5))],
    generalLabels: [
        Area.Difference,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.IntegerNumbers
    ]
};


export const PlaceValueMakeTenGeneratorSchema = {
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        selectExactLabelMap([[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]])
    ],
    range: [
        [Scope.NumbersSmaller10, Scope.NumbersLarger5],
        withLabelChoices(selectRange, {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}),
        rangeChoices
    ]
} as const;

export type PlaceValueMakeTenGeneratorConfig = ConfigFromSchema<typeof PlaceValueMakeTenGeneratorSchema>;
