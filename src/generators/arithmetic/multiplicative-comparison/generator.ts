import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
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

        if (!['multiplication', 'division-single', 'division-two'].includes(config.operation!)) {
            throw new GeneratorValidationError('multiplicative-comparison', 'Unsupported operation profile.');
        }
        const operation = config.operation === 'multiplication' ? 'multiplication' : 'division';
        // In either division projection the compared quantity is the dividend and largest operand.
        // Partition that quantity without selecting which of the two factors the view hides.
        const referenceBounds = (scale: number) => ({
            minimum: config.operation === 'division-two' ? Math.max(2, Math.ceil(10 / scale)) : 2,
            maximum: Math.min(12, Math.floor(
                (config.operation === 'division-single' ? 9 : MAX_COMPARED_QUANTITY) / scale))
        });
        const scales = Array.from({length: 8}, (_, index) => index + 2).filter(scale => {
            const bounds = referenceBounds(scale);
            return bounds.minimum <= bounds.maximum;
        });
        // Retain the old uniform-scale/uniform-reference law conditional on the width.
        const weights = scales.map(scale => {
            const bounds = referenceBounds(scale);
            const originalCount = Math.min(12, Math.floor(MAX_COMPARED_QUANTITY / scale)) - 1;
            return (bounds.maximum - bounds.minimum + 1) / originalCount;
        });
        let position = random() * weights.reduce((sum, weight) => sum + weight, 0);
        const scaleFactor = scales.find((_, index) => {
            if (position < weights[index]!) return true;
            position -= weights[index]!;
            return false;
        }) ?? scales.at(-1)!;
        const bounds = referenceBounds(scaleFactor);
        const referenceQuantity = randomInteger(bounds.minimum, bounds.maximum);
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
