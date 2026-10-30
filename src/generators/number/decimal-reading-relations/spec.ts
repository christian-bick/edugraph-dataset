import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-reading-relations',
    generalLabels: [Area.DecimalNotation, Scope.ThousandthDecimals, Scope.Base10, Scope.NumbersWithoutNegatives]
};

export const DecimalReadingRelationsGeneratorSchema = {
    zeroProfile: [[Scope.NumbersWithZero, Scope.NumbersWithoutZero], selectExactLabelMap([
        [Scope.NumbersWithZero, 'with-zero'], [Scope.NumbersWithoutZero, 'without-zero']
    ] as const)]
} as const;
export type DecimalReadingRelationsGeneratorConfig = ConfigFromSchema<typeof DecimalReadingRelationsGeneratorSchema>;
