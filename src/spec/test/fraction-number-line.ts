import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithFractions,
        Area.FractionNotation,
        Scope.Numberline,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([[Scope.UnitFractions], [Scope.ImproperFractions]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-fraction-number-line', builder)
];
