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

        return {
            data: {
                referenceQuantity,
                scaleFactor,
                comparedQuantity,
                operation
            }
        };
    }
}
