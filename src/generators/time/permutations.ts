import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations() {
    return new DatasetPermutationBuilder()
        .addLabels([
            Area.MeasuringTime,
            Scope.AnalogClock,
            Ability.ProcedureApplication,
            Ability.ProcedureExecution
        ])
        .applyConstraintVariants('interval', [3600, 1800, 900, 60, 1])
        .build()
        .map(p => {
            const interval = p.constraints.interval;
            if (interval < 60) {
                p.labels.push(Scope.SecondIntervals);
            } else if (interval < 3600) {
                p.labels.push(Scope.MinuteIntervals);
            } else {
                p.labels.push(Scope.HourIntervals);
            }
            return p;
        });
}

export const config: MLDatasetPipelineConfig = {
    generatorName: 'time',
    generationConfig: {
        permutations: buildPermutations(),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'time-analog', visualParams: { reverse: false }, instancesPerProblem: 1 },
        { rendererId: 'time-analog', visualParams: { reverse: true }, instancesPerProblem: 1 }
    ]
};
