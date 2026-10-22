import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'rational-opposite-relations',
    generalLabels: [Area.SignNotation, Scope.RationalNumbers, Scope.NumbersWithZero, Scope.NumbersWithNegatives]
};

export const RationalOppositeRelationsGeneratorSchema = {
    relation: [[Area.RulesOfSigns, Area.ZeroConcept], selectExactLabelSetMap([
        [[], 'nonzero-opposition'],
        [[Area.RulesOfSigns], 'iterated-negation'],
        [[Area.ZeroConcept], 'zero-fixed-point']
    ] as const)],
    range: [[Scope.NumbersSmaller5, Scope.NumbersSmaller10], resolveRangeFromLabels]
} as const;

export type RationalOppositeRelationsGeneratorConfig = ConfigFromSchema<typeof RationalOppositeRelationsGeneratorSchema>;
