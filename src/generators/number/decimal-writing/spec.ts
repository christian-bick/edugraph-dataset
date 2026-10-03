import {Area, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-writing',
    generalLabels: [
        Scope.ThousandthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const DecimalWritingGeneratorSchema = {
    notationFamily: [[Area.DecimalNotation, Area.NumberNameNotation], selectExactMatch]
} as const;

export type DecimalWritingGeneratorConfig = ConfigFromSchema<
    typeof DecimalWritingGeneratorSchema
>;
