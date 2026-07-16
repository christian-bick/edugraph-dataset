import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {OrderingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {resolveRangeFromLabels} from "../../lib/ontology.ts";

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export class OrderingGenerator implements ProblemGenerator<OrderingProblem> {
    type: AbstractProblem['type'] = 'ordering';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;
        const resolvedRange = resolveRangeFromLabels(labels || []);
        
        const numberSet = new Set<number>();
        const maxAttempts = 100;
        let attempts = 0;
        
        while (numberSet.size < 5 && attempts < maxAttempts) {
            const num = Math.floor(random() * (resolvedRange.max - resolvedRange.min + 1)) + resolvedRange.min;
            numberSet.add(num);
            attempts++;
        }

        const selectedNumbers = shuffleArray(Array.from(numberSet)).slice(0, 5);
        const problemKey = selectedNumbers.join('-');

        return {
            id: problemKey,
            data: {
                numbers: selectedNumbers
            }
        };
    }
}
