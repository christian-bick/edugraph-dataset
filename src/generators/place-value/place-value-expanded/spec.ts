import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {expandedCardinalityLabels, expandedRangeChoices, expandedRangeLabels, resolveExpandedCardinality, resolveExpandedRange} from './range-profile.ts';

export const spec: GeneratorSpec<typeof PlaceValueExpandedGeneratorSchema> = {
    generatorId: 'place-value-expanded',
    compatibility: [generatorLabelRule('expanded-form-cardinality-floor',
        [Scope.ThreeOperands, Scope.NumbersLarger10, Scope.NumbersLarger20], selected =>
            !selected(Scope.ThreeOperands) || !selected(Scope.NumbersLarger10) && !selected(Scope.NumbersLarger20))],
    generalLabels: [
        Area.PlaceValue,
        Area.Sum,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.MultipleDigitLargestOperand
    ],
    // SPEC-12: preserve the existing configuration-only zero annotation API.
    // Canonical profiles retain its range-branch and term-count meanings;
    // these supplementary claims remain excluded from matching.
    // Legacy terms are all positive; the larger branch exposes every coefficient,
    // with at least four places but only two or three nonzero terms.
    inferredLabels: [{
        produces: [Scope.NumbersWithoutZero, Scope.NumbersWithZero],
        infer: ({range, operandCardinality}) => {
            if (!range) return [];
            if (range.max <= 1000) return [Scope.NumbersWithoutZero];
            return range.max > 1000
                && (operandCardinality === Scope.TwoOperands || operandCardinality === Scope.ThreeOperands)
                ? [Scope.NumbersWithZero]
                : [];
        }
    }]
};

export const PlaceValueExpandedGeneratorSchema = {
    operandCardinality: [expandedCardinalityLabels, resolveExpandedCardinality, expandedCardinalityLabels.map(label => [label])],
    range: [expandedRangeLabels, resolveExpandedRange, expandedRangeChoices]
} as const;

export type PlaceValueExpandedGeneratorConfig = ConfigFromSchema<typeof PlaceValueExpandedGeneratorSchema>;
