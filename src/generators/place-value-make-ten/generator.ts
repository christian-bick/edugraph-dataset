import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { PlaceValueMakeTenProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class PlaceValueMakeTenGenerator implements ProblemGenerator<PlaceValueMakeTenProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'make-ten') {
            return null;
        }

        const target = constraints.targetSum || 10;
        const givenNumber = constraints.givenNumber || Math.floor(random() * (target - 1)) + 1; // 1 to target-1
        const missingNumber = target - givenNumber;

        return {
            id: `make-ten-${givenNumber}`,
            data: {
                givenNumber,
                missingNumber,
                target: 10
            }
        };
    }
}
