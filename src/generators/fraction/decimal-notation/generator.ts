import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {DecimalNotationProblem, DecimalNotationValue} from '../../../types/problems.ts';
import {
    DecimalNotationGeneratorConfig,
    DecimalNotationGeneratorSchema
} from './spec.ts';

const HUNDREDTH_NUMERATORS = Array.from({length: 99}, (_, index) => index + 1)
    .filter(numerator => numerator % 10 !== 0);

const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]!;

const makeValue = (denominator: 10 | 100): DecimalNotationValue => {
    // Retain the original denominator draw so conditional profiles preserve RNG continuation.
    random();
    const numerator = denominator === 10
        ? Math.floor(random() * 9) + 1
        : pick(HUNDREDTH_NUMERATORS);

    return {
        numerator,
        denominator,
        wholeDigit: 0,
        tenthsDigit: denominator === 10 ? numerator : Math.floor(numerator / 10),
        hundredthsDigit: denominator === 10 ? null : numerator % 10,
        hundredthsNumerator: denominator === 10 ? numerator * 10 : numerator
    };
};

export class DecimalNotationGenerator implements ProblemGenerator<
    DecimalNotationProblem,
    DecimalNotationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = DecimalNotationGeneratorSchema;

    generate(config: DecimalNotationGeneratorConfig): ProblemStub<DecimalNotationProblem> {
        validateConfigFields('decimal-notation', config, ['range']);
        if (Object.keys(config).some(key => key !== 'range')) {
            throw new GeneratorValidationError(
                'decimal-notation',
                'The configuration contains an unexpected field.'
            );
        }
        const range = config.range!;
        const expected = [10, 100].includes(range.max) ? createCanonicalNumericRange(range.max) : null;
        if (!expected || Object.keys(range).length !== 4
            || Object.entries(expected).some(([key, value]) => range[key as keyof typeof range] !== value)) {
            throw new GeneratorValidationError('decimal-notation', 'Expected a canonical tenths or hundredths range.');
        }

        return {
            data: {
                task: 'decimal-notation',
                sharedWhole: 1,
                relation: 'equal',
                value: makeValue(range.max as 10 | 100)
            }
        };
    }
}
