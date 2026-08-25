import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import {Area, Ability} from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Area.MeasuringLength],
        [Area.MeasuringWeight]
    ]);

export const spec: CompetencyTarget[] = toTargets('test-measurement-attribute', builder);
