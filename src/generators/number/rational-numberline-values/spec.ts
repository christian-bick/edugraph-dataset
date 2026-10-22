import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const numberKinds = [
    [[Area.NumerationWithIntegers, Scope.IntegerNumbers], 'integer'],
    [[Area.NumerationWithFractions, Scope.FractionNumbers], 'fraction'],
    [[Area.NumerationWithDecimals, Scope.DecimalNumbers], 'decimal']
] as const;

export const spec: GeneratorSpec = {generatorId: 'rational-numberline-values', generalLabels: []};

export const RationalNumberlineValuesGeneratorSchema = {
    numberKind: [[Area.NumerationWithIntegers, Scope.IntegerNumbers, Area.NumerationWithFractions, Scope.FractionNumbers,
        Area.NumerationWithDecimals, Scope.DecimalNumbers], selectExactLabelSetMap(numberKinds), numberKinds.map(([labels]) => labels)],
    signDomain: [[Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives], selectExactLabelMap([
        [Scope.NumbersWithoutNegatives, 'nonnegative'], [Scope.NumbersWithNegatives, 'signed']
    ] as const)]
} as const;

export type RationalNumberlineValuesGeneratorConfig = ConfigFromSchema<typeof RationalNumberlineValuesGeneratorSchema>;
