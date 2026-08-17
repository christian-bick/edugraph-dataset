import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MultiplicativeComparisonProblem} from '../../../types/problems.ts';
import {
    MultiplicativeComparisonGeneratorConfig,
    MultiplicativeComparisonGeneratorSchema
} from './spec.ts';

const MAX_COMPARED_QUANTITY = 100;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

export class MultiplicativeComparisonGenerator implements ProblemGenerator<
    MultiplicativeComparisonProblem,
    MultiplicativeComparisonGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = MultiplicativeComparisonGeneratorSchema;

    generate(
        config: MultiplicativeComparisonGeneratorConfig
    ): ProblemStub<MultiplicativeComparisonProblem> {
        validateConfigFields('multiplicative-comparison', config, ['operation']);

        const operation = config.operation!;
        const scaleFactor = randomInteger(2, 9);
        const largestReference = Math.min(12, Math.floor(MAX_COMPARED_QUANTITY / scaleFactor));
        const referenceQuantity = randomInteger(2, largestReference);
        const comparedQuantity = referenceQuantity * scaleFactor;
        const unknownRole = operation === 'multiplication'
            ? 'compared'
            : random() < 0.5
                ? 'reference'
                : 'scale-factor';

        const referenceEntity = 'Maya';
        const comparedEntity = 'Leo';
        const comparisonStatement = `${comparedEntity} has ${scaleFactor} times as many stickers as ${referenceEntity}.`;

        if (unknownRole === 'compared') {
            return {
                data: {
                    referenceQuantity,
                    scaleFactor,
                    comparedQuantity,
                    operation,
                    unknownRole,
                    answer: comparedQuantity,
                    referenceEntity,
                    comparedEntity,
                    story: `${referenceEntity} has ${referenceQuantity} stickers. ${comparisonStatement}`,
                    question: `How many stickers does ${comparedEntity} have?`,
                    givenEquation: `${referenceQuantity} × ${scaleFactor} = ?`,
                    solutionEquation: `${referenceQuantity} × ${scaleFactor} = ${comparedQuantity}`,
                    comparisonStatement
                }
            };
        }

        if (unknownRole === 'reference') {
            return {
                data: {
                    referenceQuantity,
                    scaleFactor,
                    comparedQuantity,
                    operation,
                    unknownRole,
                    answer: referenceQuantity,
                    referenceEntity,
                    comparedEntity,
                    story: `${comparedEntity} has ${comparedQuantity} stickers. ${comparisonStatement}`,
                    question: `How many stickers does ${referenceEntity} have?`,
                    givenEquation: `${comparedQuantity} ÷ ${scaleFactor} = ?`,
                    solutionEquation: `${comparedQuantity} ÷ ${scaleFactor} = ${referenceQuantity}`,
                    comparisonStatement
                }
            };
        }

        return {
            data: {
                referenceQuantity,
                scaleFactor,
                comparedQuantity,
                operation,
                unknownRole,
                answer: scaleFactor,
                referenceEntity,
                comparedEntity,
                story: `${referenceEntity} has ${referenceQuantity} stickers. ${comparedEntity} has ${comparedQuantity} stickers.`,
                question: `How many times as many stickers does ${comparedEntity} have as ${referenceEntity}?`,
                givenEquation: `${comparedQuantity} ÷ ${referenceQuantity} = ?`,
                solutionEquation: `${comparedQuantity} ÷ ${referenceQuantity} = ${scaleFactor}`,
                comparisonStatement
            }
        };
    }
}
