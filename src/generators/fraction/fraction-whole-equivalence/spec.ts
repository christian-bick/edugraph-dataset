import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
export const spec: GeneratorSpec = {generatorId: 'fraction-whole-equivalence', generalLabels: [Area.FractionEquivalence, Scope.Equal, Scope.ImproperFractions, Scope.IntegerNumbers]};
export const FractionWholeEquivalenceGeneratorSchema = {} as const;
export type FractionWholeEquivalenceGeneratorConfig = ConfigFromSchema<typeof FractionWholeEquivalenceGeneratorSchema>;
