import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {DecimalNotationProblem, DecimalNotationValue} from '../../../types/problems.ts';
import {
    DecimalNotationGeneratorConfig,
    DecimalNotationGeneratorSchema
} from './spec.ts';

const HUNDREDTH_NUMERATORS = Array.from({length: 99}, (_, index) => index + 1)
    .filter(numerator => numerator % 10 !== 0);

const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]!;

const makeValue = (): DecimalNotationValue => {
    const denominator = random() < 0.5 ? 10 as const : 100 as const;
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
        validateConfigFields('decimal-notation', config, []);
        if (Object.keys(config).length !== 0) {
            throw new GeneratorValidationError(
                'decimal-notation',
                'This generator does not accept configuration fields.'
            );
        }

        return {
            data: {
                task: 'decimal-notation',
                sharedWhole: 1,
                relation: 'equal',
                value: makeValue()
            }
        };
    }
}
