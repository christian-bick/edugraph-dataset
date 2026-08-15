import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([Scope.SingleStep, Ability.TextualReception])
    .applyLabelVariants([
        [Scope.WeightMeasurement, Scope.GramScale],
        [Scope.WeightMeasurement, Scope.KilogramScale],
        [Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale]
    ])
    .applyLabelVariants([
        [Area.Addition, Scope.NumbersSmaller1000],
        [Area.Subtraction, Scope.NumbersSmaller1000],
        [Area.Multiplication, Scope.NumbersSmaller100],
        [Area.Division, Scope.NumbersSmaller100]
    ]);

export const spec: CompetencyTarget[] = toTargets('test-measurement-word-problem', builder);
