import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec<typeof PlaceValueExpandedGeneratorSchema> = {
    generatorId: 'place-value-expanded',
    generalLabels: [
        Area.PlaceValue,
        Area.Sum,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.MultipleDigitLargestOperand
    ],
    // SPEC-12: zero participation follows the existing range branch and term count.
    // A global/cardinality-only declaration would overclaim; branch aliases would
    // change legacy fallback sampling. Keep the existing mathematical schema intact.
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
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ],
    operandCardinality: [
        [Scope.TwoOperands, Scope.ThreeOperands],
        selectExactMatch
    ]
} as const;

export type PlaceValueExpandedGeneratorConfig = ConfigFromSchema<typeof PlaceValueExpandedGeneratorSchema>;
