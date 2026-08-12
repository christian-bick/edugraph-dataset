import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const select = new DatasetPermutationBuilder()
    .addLabels([Area.MeasuringObjects, Scope.LengthMeasurement, Ability.ConceptClassification])
    .applyLabelVariants([[Scope.PhysicalRuler], [Scope.Tapemeter]]);

const use = new DatasetPermutationBuilder()
    .addLabels([Area.MeasuringObjects, Scope.LengthMeasurement, Scope.IntegerNumbers, Ability.ProcedureExecution])
    .applyLabelVariants([[Scope.PhysicalRuler], [Scope.Tapemeter]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-select-length-tool', select),
    ...toTargets('test-use-length-tool', use)
];
