import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'rational-opposite-relations',
    generalLabels: [Area.SignNotation, Scope.RationalNumbers, Scope.NumbersWithZero, Scope.NumbersWithNegatives]
};

export const RationalOppositeRelationsGeneratorSchema = {
    relation: [[Area.RulesOfSigns, Area.Zero], selectExactLabelSetMap([
        [[], 'nonzero-opposition'],
        [[Area.RulesOfSigns], 'iterated-negation'],
        [[Area.Zero], 'zero-fixed-point']
    ] as const)],
    range: [[Scope.NumbersSmaller5, Scope.NumbersSmaller10], selectExactLabelMap([
        [Scope.NumbersSmaller5, createCanonicalNumericRange(5)], [Scope.NumbersSmaller10, createCanonicalNumericRange(10)]
    ] as const)]
} as const;

export type RationalOppositeRelationsGeneratorConfig = ConfigFromSchema<typeof RationalOppositeRelationsGeneratorSchema>;
