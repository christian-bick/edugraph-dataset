import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec<typeof IntegerRoundingGeneratorSchema> = {
    generatorId: 'integer-rounding',
    // SPEC-12: positive endpoints require both the existing high-range branch and
    // one of these magnitudes. Neither field alone is a truthful zero-absence
    // capability; keep their choices and fallback sampling unchanged.
    inferredLabels: [{
        produces: [Scope.NumbersWithoutZero],
        infer: ({range, roundingMagnitude}) => range && range.max > 1000
            && (roundingMagnitude === Scope.StepsOf10 || roundingMagnitude === Scope.StepsOf100
                || roundingMagnitude === Scope.StepsOf1000)
            ? [Scope.NumbersWithoutZero]
            : []
    }],
    generalLabels: [
        Area.IntegerRounding,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const IntegerRoundingGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ],
    roundingMagnitude: [
        Scope.StepsOf10,
        Scope.StepsOf100,
        Scope.StepsOf1000,
        Scope.StepsOf10000,
        Scope.StepsOf100000
    ]
} as const;

export type IntegerRoundingGeneratorConfig = ConfigFromSchema<
    typeof IntegerRoundingGeneratorSchema
>;
