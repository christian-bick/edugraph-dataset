import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {PlaceValueMakeTenProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";

export class PlaceValueMakeTenGenerator implements ProblemGenerator<PlaceValueMakeTenProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        const target = 10;
        const givenNumber = Math.floor(random() * (target - 1)) + 1; // 1 to 9
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
