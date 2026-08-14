import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const interpretationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.EqualShares,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Scope.PhysicalNumbers,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Area.Multiplication, Area.GroupRecognition],
        [Area.PartitiveDivision],
        [Area.QuotativeDivision]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-equal-groups-collection', interpretationBuilder)
];
