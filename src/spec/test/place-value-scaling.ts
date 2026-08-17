import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder().addLabels([
    Area.PlaceValue,
    Area.ProportionalScaling,
    Area.Multiplication,
    Area.Division,
    Scope.Base10,
    Scope.NumbersSmaller1000000,
    Ability.ConceptDerivation
]);

export const spec: CompetencyTarget[] = toTargets('test-place-value-scaling', builder);
