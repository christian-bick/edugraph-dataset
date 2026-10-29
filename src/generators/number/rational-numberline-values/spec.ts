import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const numberKinds = [
    [[Area.NumerationWithIntegers, Scope.IntegerNumbers], 'integer'],
    // Every fraction axis explicitly displays its step 1/d, d in {2,3,4,6,8}.
    // Other ticks may be improper too; evidenced descriptors can coexist (ONT-E5).
    [[Area.NumerationWithFractions, Scope.FractionNumbers, Scope.ProperFractions], 'fraction'],
    [[Area.NumerationWithDecimals, Scope.DecimalNumbers], 'decimal']
] as const;

export const spec: GeneratorSpec = {generatorId: 'rational-numberline-values', generalLabels: [Scope.NumbersWithZero]};

export const RationalNumberlineValuesGeneratorSchema = {
    numberKind: [[Area.NumerationWithIntegers, Scope.IntegerNumbers, Area.NumerationWithFractions, Scope.FractionNumbers,
        Area.NumerationWithDecimals, Scope.DecimalNumbers, Scope.ProperFractions], selectExactLabelSetMap(numberKinds), numberKinds.map(([labels]) => labels)],
    signDomain: [[Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives], selectExactLabelMap([
        [Scope.NumbersWithoutNegatives, 'nonnegative'], [Scope.NumbersWithNegatives, 'signed']
    ] as const)]
} as const;

export type RationalNumberlineValuesGeneratorConfig = ConfigFromSchema<typeof RationalNumberlineValuesGeneratorSchema>;
