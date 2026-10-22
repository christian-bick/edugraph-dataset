import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'ratio-table-comparisons',
    generalLabels: [
        Area.RatioAntecedentInterpretation, Area.RatioConsequentInterpretation,
        Area.RatioEquivalence, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives
    ]
};

export const RatioTableComparisonsGeneratorSchema = {
    relation: [
        [Area.NumericInequality, Area.NumericEquality, Scope.Less, Scope.Equal, Scope.Greater],
        selectExactLabelSetMap([
            [[Area.NumericInequality, Scope.Less], 'less'],
            [[Area.NumericEquality, Scope.Equal], 'equal'],
            [[Area.NumericInequality, Scope.Greater], 'greater']
        ]),
        [
            [Area.NumericInequality, Scope.Less],
            [Area.NumericEquality, Scope.Equal],
            [Area.NumericInequality, Scope.Greater]
        ]
    ]
} as const;

export type RatioTableComparisonsGeneratorConfig = ConfigFromSchema<typeof RatioTableComparisonsGeneratorSchema>;
