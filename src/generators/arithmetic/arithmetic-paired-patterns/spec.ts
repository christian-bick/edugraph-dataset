import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-paired-patterns',
    generalLabels: [Scope.PairedPatterns]
};

export const ArithmeticPairedPatternsGeneratorSchema = {
    hasCorrespondence: [[Area.PatternCorrespondence], hasLabel(Area.PatternCorrespondence)]
} as const;

export type ArithmeticPairedPatternsGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticPairedPatternsGeneratorSchema
>;
