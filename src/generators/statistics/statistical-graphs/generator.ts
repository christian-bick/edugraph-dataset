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

function shuffledObservations(categories: readonly StatisticalCategory[]): StatisticalCategory['label'][] {
    const source = categories.flatMap(category =>
        Array.from({length: category.count}, () => category.label)
    );
    const observations = [...source];
    for (let index = observations.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [observations[index], observations[swapIndex]] = [observations[swapIndex], observations[index]];
    }
    if (observations.length > 1 && observations.every((label, index) => label === source[index])) {
        [observations[0], observations[observations.length - 1]] = [
            observations[observations.length - 1], observations[0]
        ];
    }
    return observations;
}

export class StatisticalGraphsGenerator implements ProblemGenerator<StatisticalGraphProblem, StatisticalGraphsGeneratorConfig> {
    type: AbstractProblem['type'] = 'statistics';
    schema = StatisticalGraphsGeneratorSchema;

    generate(config: StatisticalGraphsGeneratorConfig): ProblemStub<StatisticalGraphProblem> {
        validateConfigFields('statistical-graphs', config, [
            'scale',
            'useAddition',
            'useSubtraction',
            'useObjectSorting',
            'useConceptClassification',
            'interpretCategory',
            'requireThreeOperands',
            'isSingleStep',
            'isMultiStep'
        ]);
        if (config.useAddition && config.useSubtraction) {
            throw new GeneratorValidationError('statistical-graphs', 'A graph question cannot require both addition and subtraction.');
        }
        if (config.useObjectSorting !== config.useConceptClassification) {
            throw new GeneratorValidationError(
                'statistical-graphs',
                'Organizing data requires both object sorting and concept classification.'
            );
        }
        const organizeData = config.useObjectSorting && config.useConceptClassification;
        const selectedGrade1Tasks = Number(organizeData)
            + Number(config.interpretCategory)
            + Number(config.requireThreeOperands);
        if (selectedGrade1Tasks > 1) {
            throw new GeneratorValidationError(
                'statistical-graphs',
                'Only one categorical-data task can be selected.'
            );
        }

        const hasOperation = config.useAddition || config.useSubtraction;
        const stepComplexities = Number(config.isSingleStep) + Number(config.isMultiStep);
        const findTotal = config.requireThreeOperands;
        if (!findTotal && hasOperation !== (stepComplexities === 1)) {
            throw new GeneratorValidationError('statistical-graphs', 'Arithmetic graph questions require exactly one step complexity.');
        }
        if (config.isMultiStep && !config.useSubtraction) {
            throw new GeneratorValidationError('statistical-graphs', 'Multi-step graph questions require subtraction.');
        }
        if ((organizeData || config.interpretCategory) && (hasOperation || stepComplexities > 0)) {
            throw new GeneratorValidationError(
                'statistical-graphs',
                'Organize and read-category tasks cannot include arithmetic configuration.'
            );
        }
        if (findTotal && (!config.useAddition || config.useSubtraction || stepComplexities > 0)) {
            throw new GeneratorValidationError(
                'statistical-graphs',
                'Finding the total requires three-category addition without legacy step flags.'
            );
        }
        if (selectedGrade1Tasks > 0 && config.scale !== Scope.StepsOf1) {
            throw new GeneratorValidationError(
                'statistical-graphs',
                'Grade 1 categorical-data tasks require a scale of one.'
            );
        }

        const scale = scaleValues[config.scale!];
        const counts = (config.isMultiStep ? connectedSubtractionCounts() : uniqueCounts())
            .map(count => count * scale);
        const categories = labels.map((label, index) => ({label, count: counts[index]})) as [
            StatisticalCategory,
            StatisticalCategory,
            StatisticalCategory
        ];
        if (organizeData) {
            return {
                data: {
                    task: 'organize',
                    graphState: 'to-construct',
                    categories,
                    scale,
                    rawObservations: shuffledObservations(categories),
                    prompt: 'Sort the observations into the three categories, then complete the graph.'
                }
            };
        }
        if (config.interpretCategory) {
            const selectedCategoryIndex = Math.floor(random() * categories.length) as 0 | 1 | 2;
            const selectedCategory = categories[selectedCategoryIndex];
            return {
                data: {
                    task: 'read-category-count',
                    graphState: 'complete',
                    categories,
                    scale,
                    selectedCategoryIndex,
                    selectedCategory: selectedCategory.label,
                    answer: selectedCategory.count,
                    prompt: `How many ${selectedCategory.label.toLowerCase()} are shown?`
                }
            };
        }
        if (findTotal) {
            return {
                data: {
                    task: 'find-total',
                    graphState: 'complete',
                    categories,
                    scale,
                    operation: 'addition',
                    operandIndices: [0, 1, 2],
                    answer: categories.reduce((total, category) => total + category.count, 0),
                    prompt: 'How many items are shown across all three categories?'
                }
            };
        }
        if (!hasOperation) {
            return {data: {task: 'construct', graphState: 'to-construct', categories, scale}};
        }

        if (config.isMultiStep) {
            const firstIndex = counts.indexOf(Math.max(...counts));
            const [secondIndex, thirdIndex] = [0, 1, 2].filter(index => index !== firstIndex);
            const intermediate = counts[firstIndex] - counts[secondIndex];
            return {
                data: {
                    task: 'multi-step-arithmetic',
                    graphState: 'complete',
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
                task: 'single-step-arithmetic',
                graphState: 'complete',
                categories,
                scale,
                operation,
                operandIndices,
                answer: operation === 'addition' ? first + second : first - second
            }
        };
    }
}
