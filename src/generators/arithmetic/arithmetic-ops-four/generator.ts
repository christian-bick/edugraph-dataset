import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticFourProblem} from '../../../types/problems.ts';
import {ArithmeticOpsFourGeneratorConfig, ArithmeticOpsFourGeneratorSchema} from './spec.ts';

const randomInteger = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

export class ArithmeticOpsFourGenerator implements ProblemGenerator<ArithmeticFourProblem, ArithmeticOpsFourGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticOpsFourGeneratorSchema;

    generate(config: ArithmeticOpsFourGeneratorConfig): ProblemStub<ArithmeticFourProblem> | null {
        validateConfigFields('arithmetic-ops-four', config, ['range']);
        const range = config.range!;
        const minimum = Math.max(10, Math.ceil(range.min));
        const maximum = Math.min(99, Math.floor(range.max));
        if (minimum * 4 > maximum) return null;

        const operands: number[] = [];
        let remaining = maximum;
        for (let index = 0; index < 4; index++) {
            const remainingOperands = 3 - index;
            const value = randomInteger(minimum, remaining - remainingOperands * minimum);
            operands.push(value);
            remaining -= value;
        }

        const [num1, num2, num3, num4] = operands as [number, number, number, number];
        return {
            tags: [Area.Addition],
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
