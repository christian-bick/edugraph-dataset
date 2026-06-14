import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope, Ability } from "edugraph-ts";

export class MeasurementGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'measurement';
    compatibleRenderers = ['measure-length'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;
        const bandLength = constraints.bandLength || 20;
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
