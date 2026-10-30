import {Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {decimalNotationLabels, decimalZeroLabels, resolveDecimalNotation, resolveDecimalZeroProfile} from './zero-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-writing',
    compatibility: [generatorLabelRule('decimal-name-zero-profile', [...decimalNotationLabels, ...decimalZeroLabels], selected => {
        const withZero = selected(Scope.NumbersWithZero), withoutZero = selected(Scope.NumbersWithoutZero);
        return withZero !== withoutZero;
    })],
    generalLabels: [
        Scope.ThousandthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const DecimalWritingGeneratorSchema = {
    notationFamily: [decimalNotationLabels, resolveDecimalNotation, decimalNotationLabels.map(label => [label])],
    zeroProfile: [decimalZeroLabels, resolveDecimalZeroProfile, decimalZeroLabels.map(label => [label])]
} as const;

export type DecimalWritingGeneratorConfig = ConfigFromSchema<
    typeof DecimalWritingGeneratorSchema
>;
