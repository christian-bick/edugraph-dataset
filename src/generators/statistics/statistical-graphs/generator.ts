import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {StatisticalCategory, StatisticalGraphProblem} from '../../../types/problems.ts';
import {StatisticalGraphsGeneratorConfig, StatisticalGraphsGeneratorSchema} from './spec.ts';

const labels: StatisticalCategory['label'][] = ['Apples', 'Books', 'Kites'];

function uniqueCounts(): number[] {
    const pool = [2, 3, 4, 5, 6, 7, 8];
    const values: number[] = [];
    while (values.length < labels.length) {
        values.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    }
    return values;
}

export class StatisticalGraphsGenerator implements ProblemGenerator<StatisticalGraphProblem, StatisticalGraphsGeneratorConfig> {
    type: AbstractProblem['type'] = 'statistics';
    schema = StatisticalGraphsGeneratorSchema;

    generate(config: StatisticalGraphsGeneratorConfig): ProblemStub<StatisticalGraphProblem> {
        validateConfigFields('statistical-graphs', config, ['useAddition', 'useSubtraction', 'useTwoOperands']);
        if (config.useAddition && config.useSubtraction) {
            throw new GeneratorValidationError('statistical-graphs', 'A graph question cannot require both addition and subtraction.');
        }
        const hasOperation = config.useAddition || config.useSubtraction;
        if (hasOperation !== config.useTwoOperands) {
            throw new GeneratorValidationError('statistical-graphs', 'Arithmetic graph questions require exactly two operands.');
        }

        const counts = uniqueCounts();
        const categories = labels.map((label, index) => ({label, count: counts[index]}));
        if (!hasOperation) return {data: {categories}};

        let operandIndices: [number, number] = [0, 1];
        if (config.useSubtraction && categories[0].count < categories[1].count) {
            operandIndices = [1, 0];
        }
        const first = categories[operandIndices[0]].count;
        const second = categories[operandIndices[1]].count;
        const operation = config.useAddition ? 'addition' : 'subtraction';

        return {
            data: {
                categories,
                operation,
                operandIndices,
                answer: operation === 'addition' ? first + second : first - second
            }
        };
    }
}
