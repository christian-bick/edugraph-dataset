import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.EqualShares,
        Scope.Equal,
        Scope.VisualNumbers,
        Ability.ConceptDerivation
    ]);

const wholeNumberBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.ImproperFractions,
        Scope.IntegerNumbers,
        Scope.Equal,
        Ability.Formalization
    ])
    .applyLabelVariants([[Scope.ArabicNumerals], [Scope.Numberline]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-fraction-equivalence', builder),
    ...toTargets('test-whole-number-fraction', wholeNumberBuilder)
];
