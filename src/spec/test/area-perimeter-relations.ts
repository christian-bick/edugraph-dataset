import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const samePerimeterBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PerimeterCalculation,
    Area.AreaCalculation,
    Area.Rectangle,
    Scope.Equal,
    Ability.ConceptDerivation
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-same-perimeter-different-area', samePerimeterBuilder)
];
