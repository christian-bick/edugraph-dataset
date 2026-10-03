import {Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'coordinate-pattern-pairs',
    generalLabels: [
        Scope.PairedPatterns,
        Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives
    ]
};

export const CoordinatePatternPairsGeneratorSchema = {} as const;

export type CoordinatePatternPairsGeneratorConfig = ConfigFromSchema<
    typeof CoordinatePatternPairsGeneratorSchema
>;
