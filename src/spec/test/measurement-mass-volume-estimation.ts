import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder().addLabels([
    Area.Estimation,
    Scope.VolumeMeasurement,
    Scope.LiquidVolumes,
    Scope.LiterScale,
    Ability.ProcedureExecution
]);

export const spec: CompetencyTarget[] = toTargets('test-estimate-liquid-volume', builder);
