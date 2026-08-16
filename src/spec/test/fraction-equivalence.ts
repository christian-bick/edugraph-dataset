import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.EqualShares,
        Scope.Equal,
        Scope.VisualNumbers,
        Ability.ConceptDerivation
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-fraction-equivalence', builder)
];
