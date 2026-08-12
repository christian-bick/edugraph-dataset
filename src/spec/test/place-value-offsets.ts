import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.Base10,
        Scope.NumbersLarger100,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([[Area.Increment], [Area.Decrement]])
    .applyLabelVariants([[Scope.StepsOf10], [Scope.StepsOf100]]);

export const spec: CompetencyTarget[] = toTargets('test-place-value-offsets', builder);
