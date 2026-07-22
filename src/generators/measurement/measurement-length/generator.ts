import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {MeasurementStandardProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {MeasurementLengthGeneratorConfig, MeasurementLengthGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class MeasurementLengthGenerator implements ProblemGenerator<MeasurementStandardProblem, MeasurementLengthGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementLengthGeneratorSchema;

    generate(config: MeasurementLengthGeneratorConfig): ProblemStub | null {
        validateConfigFields('measurement-length', config, ['range']);
        const resolvedRange = config.range!;

        const maxRange = Math.min(100, resolvedRange.max);
        const minProblemLength = Math.max(1, maxRange * 0.1);
        const useDecimals = config.useDecimals;

        let problemLength: number;
        if (useDecimals) {
            problemLength = parseFloat((random() * (maxRange - minProblemLength) + minProblemLength).toFixed(1));
        } else {
            const min = Math.max(1, Math.ceil(minProblemLength));
            const max = maxRange;
            problemLength = Math.floor(random() * (max - min + 1)) + min;
        }

        // Dynamically pick a clean ruler band length that fits problemLength
        let bandLength: number;
        if (problemLength <= 10) bandLength = 10;
        else if (problemLength <= 20) bandLength = 20;
        else if (problemLength <= 50) bandLength = 50;
        else bandLength = 100;
        
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
