import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const partitionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeDecomposition,
        Scope.EqualShares,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([[Area.Circle], [Area.Rectangle]]);

const vocabularyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionInterpretation,
        Scope.EqualShares,
        Scope.UnitFractions,
        Ability.ActiveVocabulary
    ])
    .applyLabelVariants([[Area.Circle], [Area.Rectangle]]);

const compositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionInterpretation,
        Scope.EqualShares,
        Scope.UnitFractions,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([[Area.Circle], [Area.Rectangle]]);

const comparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionCommonNumeratorComparison,
        Scope.EqualShares,
        Scope.UnitFractions,
        Scope.Less,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([[Area.Circle], [Area.Rectangle]]);

const partitionAndLabelBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ProportionSense,
        Scope.EqualShares,
        Scope.UnitFractions,
        Ability.VisualArticulation,
        Ability.Formalization
    ])
    .applyLabelVariants([[Area.Circle], [Area.Rectangle]]);

const interpretFractionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionNotation,
        Area.ProportionSense,
        Scope.EqualShares,
        Ability.Interpretation
    ])
    .applyLabelVariants([[Scope.UnitFractions], [Scope.NonUnitFractions]])
    .applyLabelVariants([[Area.Circle], [Area.Rectangle]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-shape-partition', partitionBuilder),
    ...toTargets('test-shape-share-vocabulary', vocabularyBuilder),
    ...toTargets('test-shape-share-composition', compositionBuilder),
    ...toTargets('test-shape-share-comparison', comparisonBuilder),
    ...toTargets('test-shape-partition-and-label-unit-fraction', partitionAndLabelBuilder),
    ...toTargets('test-shape-interpret-fraction', interpretFractionBuilder)
];
