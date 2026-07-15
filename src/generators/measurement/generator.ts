import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { MeasurementStandardProblem, MeasurementAttributeProblem, MeasurementCompareProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class MeasurementGenerator implements ProblemGenerator<MeasurementStandardProblem | MeasurementAttributeProblem | MeasurementCompareProblem> {
    type: AbstractProblem['type'] = 'measurement';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;
        let mode = constraints.mode || 'standard';
        if (mode === 'measure-attributes') {
            mode = 'attribute-type';
        }
        if (mode === 'compare-attributes') {
            mode = 'direct-compare';
        }

        if (mode === 'attribute-type') {
            const attribute = constraints.attribute || (random() > 0.5 ? 'length' : 'weight'); // length, height, weight
            return {
                id: `attribute-type-${attribute}`,
                data: {
                    mode,
                    attribute
                }
            };
        }

        if (mode === 'direct-compare') {
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
                    mode,
                    attribute,
                    relation,
                    val1,
                    val2,
                    answer
                }
            };
        }

        // Standard measure-length (legacy)
        const bandLength = constraints.bandLength || 20;
        const minProblemLength = bandLength * 0.1;
        const problemLength = parseFloat((random() * (bandLength - minProblemLength) + minProblemLength).toFixed(1));
        
        const problemKey = `${bandLength}_${problemLength}`;
        
        return {
            id: problemKey.replace('.', '-'),
            data: {
                mode: 'standard',
                bandLength: bandLength,
                problemLength: problemLength
            }
        };
    }
}
