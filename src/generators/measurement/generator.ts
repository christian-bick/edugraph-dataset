import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { MeasurementStandardProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { resolveRangeFromLabels } from "../../lib/ontology.ts";

export class MeasurementGenerator implements ProblemGenerator<MeasurementStandardProblem> {
    type: AbstractProblem['type'] = 'measurement';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        // Guard
        const mode = constraints.mode || 'standard';
        if (mode !== 'standard' && mode !== 'measure-length') {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const bandLength = constraints.bandLength || resolvedRange.max;
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
