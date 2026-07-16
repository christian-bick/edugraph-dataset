import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { MeasurementCompareProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class MeasurementCompareGenerator implements ProblemGenerator<MeasurementCompareProblem> {
    type: AbstractProblem['type'] = 'measurement';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        const mode = constraints.mode || 'direct-compare';
        if (mode !== 'direct-compare' && mode !== 'compare-attributes') {
            return null;
        }

        const attribute = constraints.attribute || 'length'; // length, weight
        const relation = constraints.relation || (attribute === 'length' ? (random() > 0.5 ? 'longer' : 'shorter') : (random() > 0.5 ? 'heavier' : 'lighter'));
        const answer = random() > 0.5 ? 'A' : 'B';

        let val1 = 0;
        let val2 = 0;

        if (relation === 'longer' || relation === 'heavier') {
            if (answer === 'A') {
                val1 = 8;
                val2 = 4;
            } else {
                val1 = 4;
                val2 = 8;
            }
        } else {
            // shorter or lighter
            if (answer === 'A') {
                val1 = 4;
                val2 = 8;
            } else {
                val1 = 8;
                val2 = 4;
            }
        }

        return {
            id: `direct-compare-${attribute}-${relation}-${answer}`,
            data: {
                mode: 'direct-compare',
                attribute,
                relation,
                val1,
                val2,
                answer
            }
        };
    }
}
