import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const liquidBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Estimation,
    Area.MeasuringVolumes,
    Scope.LiquidVolumes,
    Scope.LiterScale,
    Ability.ProcedureExecution
]);

const massBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.Estimation, Area.MeasuringWeight, Ability.ProcedureExecution])
    .applyLabelVariants([[Scope.GramScale], [Scope.KilogramScale]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-estimate-liquid-volume', liquidBuilder),
    ...toTargets('test-estimate-mass', massBuilder)
];
