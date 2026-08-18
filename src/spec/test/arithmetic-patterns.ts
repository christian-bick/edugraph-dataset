import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const generate = new DatasetPermutationBuilder()
    .addLabels([
        Area.PatternGeneration,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Multiplication]]);

const identify = new DatasetPermutationBuilder()
    .addLabels([
        Area.EmergentFeatureRecognition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.ProcedureExecution,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([[Area.Addition], [Area.Multiplication]]);

const explain = new DatasetPermutationBuilder()
    .addLabels([
        Area.PatternGeneration,
        Area.EmergentFeatureRecognition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ])
    .applyLabelVariants([
        [Area.Addition, Area.CommutativeLaw],
        [Area.Addition, Area.AssociativeLaw],
        [Area.Multiplication, Area.CommutativeLaw],
        [Area.Multiplication, Area.AssociativeLaw],
        [Area.Multiplication, Area.DistributiveLaw]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-arithmetic-pattern-generate', generate),
    ...toTargets('test-arithmetic-pattern-identify', identify),
    ...toTargets('test-arithmetic-pattern-explain', explain)
];
