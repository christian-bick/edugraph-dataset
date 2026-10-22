import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {PercentQuantityProblem} from '../../../types/problems.ts';
import {pick, randomInteger, rational} from '../helpers.ts';
import {PercentQuantityRelationsGeneratorSchema, type PercentQuantityRelationsGeneratorConfig} from './spec.ts';

export class PercentQuantityRelationsGenerator implements ProblemGenerator<
    PercentQuantityProblem, PercentQuantityRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PercentQuantityRelationsGeneratorSchema;

    generate(config: PercentQuantityRelationsGeneratorConfig): ProblemStub<PercentQuantityProblem> {
        validateConfigFields('percent-quantity-relations', config, ['range']);
        const range = config.range!;
        if (typeof range !== 'object' || range === null || range.min !== 0
            || ![1000, 10000, Number.MAX_SAFE_INTEGER].includes(range.max)) {
            throw new GeneratorValidationError('percent-quantity-relations',
                'Range must start at zero with bound 1000, 10000, or the unbounded resolver sentinel.');
        }
        const ceiling = range.max === Number.MAX_SAFE_INTEGER ? 999 : range.max - 1;
        const percentProfile = randomInteger(0, 2);
        const percent = percentProfile === 0 ? randomInteger(1, 99)
            : percentProfile === 1 ? 100 : randomInteger(101, 150);
        const scaleFactor = rational(percent, 100);

        // Bound the product numerator as well as the values, keeping both projections readable.
        const maximumNumerator = Math.floor(ceiling / scaleFactor.numerator);
        const whole = rational(randomInteger(1, maximumNumerator), pick([1, 2, 4]));
        const part = rational(whole.numerator * scaleFactor.numerator,
            whole.denominator * scaleFactor.denominator);

        return {data: {
            kind: 'percent-quantity', percent,
            perHundred: {numerator: percent, denominator: 100},
            scaleFactor, whole, part
        }};
    }
}
