import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Estimation,
        Area.IntegerRounding,
        Scope.NumbersSmaller1000,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction],
        [Area.Multiplication],
        [Area.Division]
    ]);

export const spec: CompetencyTarget[] = toTargets('test-arithmetic-estimation', builder);
