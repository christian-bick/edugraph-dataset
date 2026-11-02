import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {classificationRangeSchema} from '../canonical-classification-schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-classify-count',
    generalLabels: [
        Area.NumerationWithIntegers,
        Area.ObjectSorting,
        Scope.IntegerNumbers,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
    ]
};


export const CountingClassifyCountGeneratorSchema = {
    range: classificationRangeSchema
} as const;

export type CountingClassifyCountGeneratorConfig = ConfigFromSchema<typeof CountingClassifyCountGeneratorSchema>;
