import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {canonicalFourRangeChoices, canonicalFourRangeLabels, canonicalFourRangeProfiles, resolveCanonicalFourRange} from './canonical-range.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-ops-four',
    compatibility: [generatorLabelRule('canonical-four-addend-domain', canonicalFourRangeLabels, selected => {
        const labels = canonicalFourRangeLabels.filter(selected);
        return canonicalFourRangeProfiles.some(candidate => candidate.labels.length === labels.length
            && candidate.labels.every(selected));
    })],
    generalLabels: [
        Area.Addition,
        Scope.FourOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.TwoDigitSmallestOperand,
        Scope.TwoDigitLargestOperand
    ]
};

export const ArithmeticOpsFourGeneratorSchema = {
    range: [
        canonicalFourRangeLabels,
        resolveCanonicalFourRange,
        canonicalFourRangeChoices
    ]
} as const;

export type ArithmeticOpsFourGeneratorConfig = ConfigFromSchema<typeof ArithmeticOpsFourGeneratorSchema>;
