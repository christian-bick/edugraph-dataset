import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {ArithmeticDecomposeProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {resolveRangeFromLabels} from "../../lib/ontology.ts";

export class ArithmeticDecomposeGenerator implements ProblemGenerator<ArithmeticDecomposeProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;


        const resolvedRange = resolveRangeFromLabels(labels || []);
        const targetNumber = Math.floor(random() * (resolvedRange.max - 3 + 1)) + 3; // 3 to resolved max (usually 10)
        
        const pairs: [number, number][] = [];
        for (let i = 1; i <= Math.floor(targetNumber / 2); i++) {
            pairs.push([i, targetNumber - i]);
        }

        if (pairs.length < 1) {
            return null;
        }

        let pair1: [number, number] = [0, 0];
        let pair2: [number, number] = [0, 0];

        if (pairs.length >= 2) {
            const idx1 = Math.floor(random() * pairs.length);
            let idx2 = Math.floor(random() * pairs.length);
            while (idx1 === idx2) {
                idx2 = Math.floor(random() * pairs.length);
            }
            pair1 = pairs[idx1];
            pair2 = pairs[idx2];
            if (random() > 0.5) pair1 = [pair1[1], pair1[0]];
            if (random() > 0.5) pair2 = [pair2[1], pair2[0]];
        } else {
            pair1 = pairs[0];
            pair2 = [pairs[0][1], pairs[0][0]];
        }

        return {
            id: `decompose-${targetNumber}-${pair1[0]}-${pair2[0]}`,
            data: {
                targetNumber,
                pair1,
                pair2
            }
        };
    }
}
