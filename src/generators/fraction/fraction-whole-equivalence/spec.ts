import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
export const spec: GeneratorSpec = {generatorId: 'fraction-whole-equivalence', generalLabels: [Area.FractionEquivalence, Scope.Equal, Scope.ImproperFractions, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives]};
export const FractionWholeEquivalenceGeneratorSchema = {
    range: [[Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100], selectExactLabelMap([
        [Scope.NumbersSmaller5, createCanonicalNumericRange(5)], [Scope.NumbersSmaller10, createCanonicalNumericRange(10)],
        [Scope.NumbersSmaller20, createCanonicalNumericRange(20)], [Scope.NumbersSmaller100, createCanonicalNumericRange(100)]
    ] as const)]
} as const;
export type FractionWholeEquivalenceGeneratorConfig = ConfigFromSchema<typeof FractionWholeEquivalenceGeneratorSchema>;
