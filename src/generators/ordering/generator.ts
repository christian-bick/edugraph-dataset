import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope, Ability } from "edugraph-ts";

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export class OrderingGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'ordering';
    compatibleRenderers = ['numbers-order'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        const includesZero = constraints.includesZero !== undefined 
            ? (constraints.includesZero === 'true' || constraints.includesZero === true)
            : labels.includes(Scope.NumbersWithZero);
        
        const numberSet = includesZero
            ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
            : [1, 2, 3, 4, 5, 6, 7, 8, 9];

        const shuffled = shuffleArray(numberSet);
        const selectedNumbers = shuffled.slice(0, 5);
        const problemKey = selectedNumbers.join('-');

        return {
            id: problemKey,
            data: {
                numbers: selectedNumbers
            }
        };
    }
}
