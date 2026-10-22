import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const structures = [[[], 'single-power'], [[Area.OrderOfOperations], 'mixed-precedence']] as const;
const exponents = [[[], 'allow-zero'], [[Scope.PositiveExponent], 'positive']] as const;

export const spec: GeneratorSpec = {
    generatorId: 'numerical-power-expressions',
    generalLabels: [Area.ArithmeticExpression, Area.Exponentiation, Scope.IntegerExponent]
};

export const NumericalPowerExpressionsGeneratorSchema = {
    structure: [[Area.OrderOfOperations], selectExactLabelSetMap(structures), structures.map(([labels]) => labels)],
    exponents: [[Scope.PositiveExponent], selectExactLabelSetMap(exponents), exponents.map(([labels]) => labels)]
} as const;

export type NumericalPowerExpressionsGeneratorConfig = ConfigFromSchema<typeof NumericalPowerExpressionsGeneratorSchema>;
