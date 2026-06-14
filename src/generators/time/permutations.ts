import { MLDatasetPipelineConfig, GeneratorInput } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations(): GeneratorInput[] {
    return new PermutationBuilder()
        .applyVariants('interval', [3600, 1800, 900, 60, 1])
        .build().map(p => {
            const params = p.params;
            const interval = params.interval || 3600;
            let intervalScope;
            if (interval < 60) {
                intervalScope = Scope.SecondIntervals
            } else if (interval < 3600) {
                intervalScope = Scope.MinuteIntervals
            } else {
                intervalScope = Scope.HourIntervals
            }
            return {
                labels: [
                    Area.MeasuringTime,
                    Scope.AnalogClock, intervalScope,
                    Ability.ProcedureApplication, Ability.ProcedureExecution
                ],
                constraints: params
            };
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
