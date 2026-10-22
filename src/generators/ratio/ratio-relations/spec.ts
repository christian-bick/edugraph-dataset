import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'ratio-relations',
    generalLabels: [Area.RatioAntecedentInterpretation, Area.RatioConsequentInterpretation]
};

export const RatioRelationsGeneratorSchema = {
    range: [[Scope.NumbersSmaller20, Scope.NumbersSmaller100], resolveRangeFromLabels]
} as const;

export type RatioRelationsGeneratorConfig = ConfigFromSchema<typeof RatioRelationsGeneratorSchema>;
