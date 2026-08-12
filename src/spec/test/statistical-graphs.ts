import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const pictureGraphBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.PictureGraph,
        Scope.StepsOf1,
        Ability.VisualArticulation
    ]);

const barGraphBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.StepsOf1,
        Ability.VisualArticulation
    ]);

const barGraphProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.StepsOf1,
        Scope.TwoOperands,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-picture-graph', pictureGraphBuilder),
    ...toTargets('test-bar-graph', barGraphBuilder),
    ...toTargets('test-bar-graph-problems', barGraphProblemsBuilder)
];
