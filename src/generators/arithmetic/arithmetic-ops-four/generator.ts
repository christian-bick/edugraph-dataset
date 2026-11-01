import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticFourProblem} from '../../../types/problems.ts';
import {ArithmeticOpsFourGeneratorConfig, ArithmeticOpsFourGeneratorSchema} from './spec.ts';
import {sampleCanonicalSum} from '../canonical-sum-sampling.ts';

export class ArithmeticOpsFourGenerator implements ProblemGenerator<ArithmeticFourProblem, ArithmeticOpsFourGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticOpsFourGeneratorSchema;

    generate(config: ArithmeticOpsFourGeneratorConfig): ProblemStub<ArithmeticFourProblem> | null {
        validateConfigFields('arithmetic-ops-four', config, ['range']);
        const operands = sampleCanonicalSum({count: 4, range: config.range!,
            minimumOperand: 10, maximumOperand: 99, step: 1});
        if (!operands) return null;

        const [num1, num2, num3, num4] = operands as [number, number, number, number];
        return {
            data: {
                num1,
                num2,
                num3,
                num4,
                answer: num1 + num2 + num3 + num4,
                operation: 'addition'
            }
        };
    }
}
