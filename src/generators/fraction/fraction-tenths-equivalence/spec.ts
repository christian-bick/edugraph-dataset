import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
export const spec: GeneratorSpec = {generatorId: 'fraction-tenths-equivalence', generalLabels: [Area.FractionEquivalence, Area.Multiplication, Scope.Equal, Scope.EqualShares, Scope.TenthFractions]};
export const FractionTenthsEquivalenceGeneratorSchema = {} as const;
export type FractionTenthsEquivalenceGeneratorConfig = ConfigFromSchema<typeof FractionTenthsEquivalenceGeneratorSchema>;
