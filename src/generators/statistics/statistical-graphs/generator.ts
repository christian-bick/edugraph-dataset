import {Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {StatisticalCategory, StatisticalGraphProblem} from '../../../types/problems.ts';
import {StatisticalGraphsGeneratorConfig, StatisticalGraphsGeneratorSchema} from './spec.ts';

const labels: StatisticalCategory['label'][] = ['Apples', 'Books', 'Kites'];
const scaleValues = {
    [Scope.StepsOf1]: 1,
    [Scope.StepsOf2]: 2,
    [Scope.StepsOf5]: 5,
    [Scope.StepsOf10]: 10
} as const;

function uniqueCounts(): number[] {
    const pool = [2, 3, 4, 5, 6, 7, 8];
    const values: number[] = [];
    while (values.length < labels.length) {
        values.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    }
    return values;
}

function connectedSubtractionCounts(): number[] {
    const triples = [
        [8, 3, 2],
        [8, 4, 2],
        [8, 5, 2],
        [7, 3, 2],
        [7, 4, 2]
    ];
    const values = [...triples[Math.floor(random() * triples.length)]];
    for (let index = values.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }
    return values;
}

export class StatisticalGraphsGenerator implements ProblemGenerator<StatisticalGraphProblem, StatisticalGraphsGeneratorConfig> {
    type: AbstractProblem['type'] = 'statistics';
    schema = StatisticalGraphsGeneratorSchema;

    generate(config: StatisticalGraphsGeneratorConfig): ProblemStub<StatisticalGraphProblem> {
        validateConfigFields('statistical-graphs', config, [
            'scale', 'useAddition', 'useSubtraction', 'useTwoOperands', 'useThreeOperands'
        ]);
        if (config.useAddition && config.useSubtraction) {
            throw new GeneratorValidationError('statistical-graphs', 'A graph question cannot require both addition and subtraction.');
        }
        const hasOperation = config.useAddition || config.useSubtraction;
        const operandCardinalities = Number(config.useTwoOperands) + Number(config.useThreeOperands);
        if (hasOperation !== (operandCardinalities === 1)) {
            throw new GeneratorValidationError('statistical-graphs', 'Arithmetic graph questions require exactly one operand cardinality.');
        }
        if (config.useThreeOperands && !config.useSubtraction) {
            throw new GeneratorValidationError('statistical-graphs', 'Three-operand graph questions require subtraction.');
        }

        const scale = scaleValues[config.scale!];
        const counts = (config.useThreeOperands ? connectedSubtractionCounts() : uniqueCounts())
            .map(count => count * scale);
        const categories = labels.map((label, index) => ({label, count: counts[index]}));
        if (!hasOperation) return {data: {categories, scale}};

        if (config.useThreeOperands) {
            const firstIndex = counts.indexOf(Math.max(...counts));
            const [secondIndex, thirdIndex] = [0, 1, 2].filter(index => index !== firstIndex);
            const intermediate = counts[firstIndex] - counts[secondIndex];
            return {
                data: {
                    categories,
                    scale,
                    operation: 'subtraction',
                    operandIndices: [firstIndex, secondIndex, thirdIndex],
                    intermediate,
                    answer: intermediate - counts[thirdIndex]
                }
            };
        }

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
                scale,
                operation,
                operandIndices,
                answer: operation === 'addition' ? first + second : first - second
            }
        };
    }
}
