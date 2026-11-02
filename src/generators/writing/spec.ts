import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {writingZeroContext} from './zero-profile.ts';
import {nameRangeForLabels, resolveNameAwareWritingZero, resolveWritingRange, writingRangeFallbacks,
    writingNotationLabels, resolveWritingNotation, writingRangeLabels} from './range-profile.ts';
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
        if (zero) return range.min <= 0 && range.max >= 0;
        return range.max > 1000 && range.max <= 1_000_000
            ? absence && Math.floor(range.max) >= Math.max(1, Math.ceil(range.min))
            : true;
    }), {
        id: 'writing-range-adoption',
        dependencies: [{scope: 'generator', label: Area.NumberNameNotation},
            ...[Scope.NumbersWithZero, Scope.NumbersWithoutZero].map(label => ({scope: 'generator' as const, label})),
            ...writingRangeLabels.flatMap(label => [{scope: 'target' as const, label}, {scope: 'generator' as const, label}])],
        predicate: labels => {
            if (!labels.exact('generator', Area.NumberNameNotation))
                return writingRangeLabels.every(label => labels.exact('target', label) === labels.exact('generator', label));
            const range = nameRangeForLabels(writingRangeLabels.filter(label => labels.exact('generator', label)));
            return !!range && !labels.exact('generator', Scope.NumbersLargerZero)
                && (labels.exact('generator', Scope.NumbersWithZero) ? range.max === 5
                : labels.exact('generator', Scope.NumbersWithoutZero));
        }
    }],
    // SPEC-12: zero absence depends on both the zero selector and legacy range.
    // Range-only bundles overclaim explicit zero; a blanket false-selector default
    // also overclaims the number-line origin. Larger bounded requests already
    // resolve matching-capable zero choices rather than needing this annotation.
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
        writingNotationLabels, resolveWritingNotation, writingNotationLabels.map(label => [label])
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        resolveNameAwareWritingZero,
        [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]
    ],
    range: [
        writingRangeLabels,
        resolveWritingRange,
        writingRangeFallbacks
    ]
} as const;

export type WritingGeneratorConfig = ConfigFromSchema<typeof WritingGeneratorSchema>;
