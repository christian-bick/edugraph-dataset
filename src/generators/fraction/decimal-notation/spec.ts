import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-notation',
    generalLabels: [
        Area.DecimalNotation,
        Scope.DecimalNumbers
    ]
};

export const DecimalNotationGeneratorSchema = {} as const;

export type DecimalNotationGeneratorConfig = ConfigFromSchema<
    typeof DecimalNotationGeneratorSchema
>;
