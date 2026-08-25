import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Ability.VisualReception
    ])
    .applyLabelVariants([
        [Area.MeasuringLength],
        [Area.MeasuringWeight]
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Less]
    ]);

export const spec: CompetencyTarget[] = toTargets('test-measurement-compare', builder);
