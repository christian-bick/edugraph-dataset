import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {selectExactMatch} from '../../lib/resolvers.ts';
import {resolveWritingZero, writingZeroContext, writingProfileCount} from './zero-profile.ts';
import {generatorLabelRule} from '../compatibility-rules.ts';

export const spec: GeneratorSpec<typeof WritingGeneratorSchema> = {
    generatorId: 'writing',
    compatibility: [generatorLabelRule('writing-zero-evidence', [
        ...writingZeroContext, Scope.NumbersWithZero, Scope.NumbersWithoutZero
    ], selected => {
        const zero = selected(Scope.NumbersWithZero);
        const absence = selected(Scope.NumbersWithoutZero);
        if (zero && absence || absence && selected(Scope.Numberline)) return false;
        const range = resolveRangeFromLabels(writingZeroContext.filter(label => selected(label)));
        return range.max > 1000 && range.max <= 1_000_000
            ? (zero || absence) && writingProfileCount(range.min, range.max, zero) > 0
            : !zero || range.min <= 0 && range.max >= 0;
    })],
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
        resolveWritingZero,
        [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type WritingGeneratorConfig = ConfigFromSchema<typeof WritingGeneratorSchema>;
