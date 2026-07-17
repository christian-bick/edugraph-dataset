import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {PlaceValueMakeTenProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {PlaceValueMakeTenGeneratorConfig, PlaceValueMakeTenGeneratorSchema} from "./spec.ts";

export class PlaceValueMakeTenGenerator implements ProblemGenerator<PlaceValueMakeTenProblem, PlaceValueMakeTenGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueMakeTenGeneratorSchema;

    generate(config: PlaceValueMakeTenGeneratorConfig): ProblemStub | null {

        const includeZero = config.includeZero;

        const target = 10;
        let givenNumber: number;
        if (includeZero) {
            givenNumber = Math.floor(random() * (target + 1)); // 0 to 10
        } else {
            givenNumber = Math.floor(random() * (target - 1)) + 1; // 1 to 9
        }
        
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
