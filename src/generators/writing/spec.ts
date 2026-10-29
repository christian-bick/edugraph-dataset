import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {hasLabel, selectExactMatch} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec<typeof WritingGeneratorSchema> = {
    generatorId: 'writing',
    // SPEC-12: zero absence depends on both the zero selector and legacy range.
    // Range-only bundles overclaim explicit zero; a blanket false-selector default
    // also overclaims the number-line origin and the larger place-value strip.
    // The number-line consumer requires max <= 100, so it cannot enter this guard.
    inferredLabels: [{
        produces: [Scope.NumbersWithoutZero],
        infer: ({requireZero, range}) => !requireZero && range && range.max > 100 && range.max <= 1000
            ? [Scope.NumbersWithoutZero]
            : []
    }],
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
    ]
};


export const WritingGeneratorSchema = {
    notationFamily: [
        [Area.DigitNotation, Area.NumerationWithIntegers, Area.NumberNameNotation],
        selectExactMatch
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type WritingGeneratorConfig = ConfigFromSchema<typeof WritingGeneratorSchema>;
