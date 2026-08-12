import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';
const builder = new DatasetPermutationBuilder()
    .addLabels([Area.Estimation, Scope.LengthMeasurement, Ability.ProcedureExecution])
    .applyLabelVariants([[Scope.CentimeterScale], [Scope.MeterScale]]);
export const spec: CompetencyTarget[] = toTargets('test-length-estimation', builder);
