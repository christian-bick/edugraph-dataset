import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'unit-rate-relations',
    generalLabels: [
        Area.RatioAntecedentInterpretation, Area.RatioConsequentInterpretation,
        Area.RatioEquivalence, Area.Division, Area.ProportionalScaling,
        Scope.RationalNumbers, Scope.NumbersWithoutNegatives
    ]
};

export const UnitRateRelationsGeneratorSchema = {
    range: [[Scope.NumbersSmaller20, Scope.NumbersSmaller100], resolveRangeFromLabels]
} as const;

export type UnitRateRelationsGeneratorConfig = ConfigFromSchema<typeof UnitRateRelationsGeneratorSchema>;
