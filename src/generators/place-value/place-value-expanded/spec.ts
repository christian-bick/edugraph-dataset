import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {expandedRangeBounds, hasExpandedCardinalityDomain} from './domain.ts';
import {expandedCardinalityLabels, expandedRangeChoices, expandedRangeLabels, resolveExpandedCardinality, resolveExpandedRange} from './range-profile.ts';

export const spec: GeneratorSpec<typeof PlaceValueExpandedGeneratorSchema> = {
    generatorId: 'place-value-expanded',
    compatibility: [generatorLabelRule('expanded-form-cardinality-floor',
        [Scope.ThreeOperands, ...expandedRangeLabels], selected => {
            if (!selected(Scope.ThreeOperands)) return true;
            const selectedLower = expandedRangeBounds.find(([, lower]) => lower > 0
                && selected(`http://edugraph.io/edu/NumbersLarger${lower}`))?.[1] ?? 0;
            return expandedRangeBounds.some(([upper, lower]) => lower === selectedLower
                && selected(`http://edugraph.io/edu/NumbersSmaller${upper}`)
                && hasExpandedCardinalityDomain(upper, lower, 3));
        })],
    generalLabels: [
        Area.PlaceValue,
        Area.Sum,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.MultipleDigitLargestOperand
    ]
};

export const PlaceValueExpandedGeneratorSchema = {
    operandCardinality: [expandedCardinalityLabels, resolveExpandedCardinality, expandedCardinalityLabels.map(label => [label])],
    range: [expandedRangeLabels, resolveExpandedRange, expandedRangeChoices]
} as const;

export type PlaceValueExpandedGeneratorConfig = ConfigFromSchema<typeof PlaceValueExpandedGeneratorSchema>;
