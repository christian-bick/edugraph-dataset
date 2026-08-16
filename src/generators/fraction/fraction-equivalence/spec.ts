import {Ability, Area, Scope} from 'edugraph-ts';
import {matchAllExactLabels} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'fraction-equivalence',
    generalLabels: [
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.EqualShares,
        Scope.Equal
    ]
};

export const FractionEquivalenceGeneratorSchema = {
    taskAbilities: [
        [
            Ability.ConceptDerivation,
            Ability.Formalization,
            Ability.ProcedureUnderstanding
        ],
        matchAllExactLabels
    ]
} as const;

export type FractionEquivalenceGeneratorConfig = ConfigFromSchema<
    typeof FractionEquivalenceGeneratorSchema
>;
