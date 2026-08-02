import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Measurement,
        Area.ObjectSorting,
        Scope.LengthMeasurement,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.Least], [Scope.Most]]);

export const spec: CompetencyTarget[] = toTargets('test-measurement-order', builder);
