import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.AdditionCountingOn],
        [Area.SubtractionCountingBack],
        [Area.AdditionMakeTen],
        [Area.AdditionNearDoubles],
        [Area.AdditionCompensation],
        [Area.SubtractionCompensation],
        [Area.SubtractionThinkAddition]
    ]);

const grade1Builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ])
    .applyLabelVariants([
        [Area.AdditionCountingOn],
        [Area.SubtractionCountingBack],
        [Area.AdditionNearDoubles]
    ]);

const grade1ThroughTenBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.AdditionMakeTen],
        [Area.SubtractionMakeTen],
        [Area.SubtractionThinkAddition]
    ]);

const countingRelationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([
        [Area.AdditionCountingOn],
        [Area.SubtractionCountingBack]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-integer-add-subtract-strategies', builder),
    ...toTargets('test-grade1-counting-and-near-doubles', grade1Builder),
    ...toTargets('test-grade1-through-ten-strategies', grade1ThroughTenBuilder),
    ...toTargets('test-grade1-counting-operation-relationship', countingRelationBuilder)
];
