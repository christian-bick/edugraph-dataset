import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const pictureGraphBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.PictureGraph,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([[Scope.StepsOf1], [Scope.StepsOf2], [Scope.StepsOf5], [Scope.StepsOf10]]);

const barGraphBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([[Scope.StepsOf1], [Scope.StepsOf2], [Scope.StepsOf5], [Scope.StepsOf10]]);

const barGraphProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.StepsOf1,
        Scope.SingleStep,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

const scaledBarComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Subtraction,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.SingleStep,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.StepsOf2], [Scope.StepsOf5], [Scope.StepsOf10]]);

const twoStepScaledBarComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Subtraction,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.MultiStep,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.StepsOf2], [Scope.StepsOf5], [Scope.StepsOf10]]);

const grade1OrganizeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.ObjectSorting,
        Scope.IntegerNumbers,
        Scope.StepsOf1,
        Ability.ConceptClassification,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([[Scope.PictureGraph], [Scope.BarGraph]]);

const grade1ReadCategoryBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.StepsOf1,
        Ability.Interpretation
    ])
    .applyLabelVariants([[Scope.PictureGraph], [Scope.BarGraph]]);

const grade1FindTotalBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Addition,
        Scope.IntegerNumbers,
        Scope.ThreeOperands,
        Scope.StepsOf1,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.PictureGraph], [Scope.BarGraph]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-picture-graph', pictureGraphBuilder),
    ...toTargets('test-bar-graph', barGraphBuilder),
    ...toTargets('test-bar-graph-problems', barGraphProblemsBuilder),
    ...toTargets('test-scaled-bar-comparisons', scaledBarComparisonBuilder),
    ...toTargets('test-two-step-scaled-bar-comparisons', twoStepScaledBarComparisonBuilder),
    ...toTargets('test-grade1-organize-categorical-data', grade1OrganizeBuilder),
    ...toTargets('test-grade1-read-category-count', grade1ReadCategoryBuilder),
    ...toTargets('test-grade1-find-categorical-total', grade1FindTotalBuilder)
];
