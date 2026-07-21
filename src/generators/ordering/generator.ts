import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {OrderingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {OrderingGeneratorConfig, OrderingGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../lib/errors.ts";

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export class OrderingGenerator implements ProblemGenerator<OrderingProblem, OrderingGeneratorConfig> {
    type: AbstractProblem['type'] = 'ordering';
    schema = OrderingGeneratorSchema;

    generate(config: OrderingGeneratorConfig): ProblemStub | null {
        validateConfigFields('ordering', config, ['range']);
        const resolvedRange = config.range!;
        const allowNegatives = config.allowNegatives;
        const includeZero = config.includeZero;
        
        const generateFromRange = (forceZero = false) => {
            if (forceZero) return 0;
            let n = Math.floor(random() * (resolvedRange.max - resolvedRange.min + 1)) + resolvedRange.min;
            if (allowNegatives && random() > 0.5) n = -n;
            if (!includeZero && n === 0) {
                return (allowNegatives && random() > 0.5) ? -1 : 1;
            }
            return n;
        };

        const numberSet = new Set<number>();
        if (includeZero) {
            numberSet.add(0);
        }
        const maxAttempts = 100;
        let attempts = 0;
        
        while (numberSet.size < 5 && attempts < maxAttempts) {
            const num = generateFromRange();
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
