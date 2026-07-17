import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {MeasurementStandardProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {MeasurementGeneratorConfig, MeasurementGeneratorSchema} from "./spec.ts";

export class MeasurementGenerator implements ProblemGenerator<MeasurementStandardProblem, MeasurementGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementGeneratorSchema;

    generate(config: MeasurementGeneratorConfig): ProblemStub | null {
        const resolvedRange = config.range;

        if (!resolvedRange) return null;

        const bandLength = resolvedRange.max;
        const minProblemLength = bandLength * 0.1;
        const problemLength = parseFloat((random() * (bandLength - minProblemLength) + minProblemLength).toFixed(1));
        
        const problemKey = `${bandLength}_${problemLength}`;
        
        return {
            id: problemKey.replace('.', '-'),
            data: {
                bandLength: bandLength,
                problemLength: problemLength
            }
        };
    }
}
