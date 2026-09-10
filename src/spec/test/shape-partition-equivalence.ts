import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeDecomposition,
        Scope.EqualShares,
        Scope.ProofByConstruction,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([[Area.Circle], [Area.Rectangle]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-shape-partition-equivalence', builder)
];
