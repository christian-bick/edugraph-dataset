import {Area} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveNumericalExpressionStructure} from './resolver.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-numerical-expressions',
    generalLabels: [Area.NumericalExpression]
};

export const ArithmeticNumericalExpressionsGeneratorSchema = {
    structure: [
        [Area.GroupedExpression, Area.OrderOfOperations],
        resolveNumericalExpressionStructure,
        [[], [Area.GroupedExpression, Area.OrderOfOperations]]
    ]
} as const;

export type ArithmeticNumericalExpressionsGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticNumericalExpressionsGeneratorSchema
>;
