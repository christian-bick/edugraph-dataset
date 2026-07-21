import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {MeasurementStandardProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {MeasurementGeneratorConfig, MeasurementGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../lib/errors.ts";

export class MeasurementGenerator implements ProblemGenerator<MeasurementStandardProblem, MeasurementGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementGeneratorSchema;

    generate(config: MeasurementGeneratorConfig): ProblemStub | null {
        validateConfigFields('measurement', config, ['range']);
        const resolvedRange = config.range!;

        const bandLength = resolvedRange.max;
        const minProblemLength = bandLength * 0.1;
        const useDecimals = config.useDecimals;

        let problemLength: number;
        if (useDecimals) {
            problemLength = parseFloat((random() * (bandLength - minProblemLength) + minProblemLength).toFixed(1));
        } else {
            const min = Math.max(1, Math.ceil(minProblemLength));
            const max = bandLength;
            problemLength = Math.floor(random() * (max - min + 1)) + min;
        }
        
        const problemKey = `${bandLength}_${problemLength}`;
        
        return {
            id: problemKey.replace('.', '-'),
            data: {
                bandLength: bandLength,
                problemLength: problemLength,
                useDecimals: useDecimals
            }
        };
    }
}
