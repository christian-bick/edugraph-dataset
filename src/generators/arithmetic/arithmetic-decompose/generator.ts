import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ArithmeticDecomposeProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {ArithmeticDecomposeGeneratorConfig, ArithmeticDecomposeGeneratorSchema} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../../lib/errors.ts";
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

export class ArithmeticDecomposeGenerator implements ProblemGenerator<ArithmeticDecomposeProblem, ArithmeticDecomposeGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticDecomposeGeneratorSchema;

    generate(config: ArithmeticDecomposeGeneratorConfig): ProblemStub<ArithmeticDecomposeProblem> {
        validateConfigFields('arithmetic-decompose', config, ['range']);
        const resolvedRange = config.range!;
        if (!resolvedRange || resolvedRange.min !== 0 || ![5, 10].includes(resolvedRange.max)) {
            throw new GeneratorValidationError('arithmetic-decompose', 'Expected canonical upper5 or upper10 with no positive lower.');
        }
        const expected = createCanonicalNumericRange(resolvedRange.max);
        if (resolvedRange.maximumAbove !== expected.maximumAbove || resolvedRange.minimumBelow !== expected.minimumBelow) {
            throw new GeneratorValidationError('arithmetic-decompose', 'Invalid canonical range witnesses.');
        }
        const minVal = Math.max(resolvedRange.maximumAbove + 1, 3);
        const maxVal = resolvedRange.max;
        const targetNumber = Math.floor(random() * (maxVal - minVal + 1)) + minVal;
        
        const pairs: [number, number][] = [];
        for (let i = 1; i <= Math.floor(targetNumber / 2); i++) {
            pairs.push([i, targetNumber - i]);
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
            data: {
                targetNumber,
                pair1,
                pair2
            }
        };
    }
}
