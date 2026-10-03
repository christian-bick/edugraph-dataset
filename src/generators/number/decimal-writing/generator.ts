import {Area} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {
    DecimalWritingGeneratorSchema,
    type DecimalWritingGeneratorConfig
} from './spec.ts';

type FractionalPart = DecimalWritingProblem['fractionalPart'];

const nonzeroDigit = (): number => 1 + Math.floor(random() * 9);
const anyDigit = (): number => Math.floor(random() * 10);

/** Thousandths are frequent so canonical samples exercise the full Grade 5 bound. */
function precision(): FractionalPart['precision'] {
    const draw = random();
    return draw < 0.12 ? 'tenths' : draw < 0.24 ? 'hundredths' : 'thousandths';
}

function fractionalPart(selected: FractionalPart['precision']): FractionalPart {
    if (selected === 'tenths') {
        const tenth = nonzeroDigit();
        return {precision: selected, digits: [tenth, 0, 0], numerator: tenth, denominator: 10};
    }
    if (selected === 'hundredths') {
        const tenth = random() < 0.5 ? 0 : anyDigit();
        const hundredth = nonzeroDigit();
        return {
            precision: selected,
            digits: [tenth, hundredth, 0],
            numerator: 10 * tenth + hundredth,
            denominator: 100
        };
    }

    // Reserve a substantial share of thousandths for internal zero placeholders.
    const pattern = Math.floor(random() * 4);
    const tenth = pattern === 0 || pattern === 2 ? 0 : nonzeroDigit();
    const hundredth = pattern === 0 || pattern === 1 ? 0 : nonzeroDigit();
    const thousandth = nonzeroDigit();
    return {
        precision: selected,
        digits: [tenth, hundredth, thousandth],
        numerator: 100 * tenth + 10 * hundredth + thousandth,
        denominator: 1000
    };
}

const precisionLength = (selected: FractionalPart['precision']): number =>
    selected === 'tenths' ? 1 : selected === 'hundredths' ? 2 : 3;

export class DecimalWritingGenerator implements ProblemGenerator<
    DecimalWritingProblem,
    DecimalWritingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'writing';
    schema = DecimalWritingGeneratorSchema;

    generate(config: DecimalWritingGeneratorConfig): ProblemStub<DecimalWritingProblem> {
        validateConfigFields('decimal-writing', config, ['notationFamily']);
        if (config.notationFamily !== Area.DecimalNotation
            && config.notationFamily !== Area.NumberNameNotation) {
            throw new GeneratorValidationError(
                'decimal-writing',
                'Expected DecimalNotation or NumberNameNotation.'
            );
        }

        const wholePart = Math.floor(random() * 10);
        const fraction = fractionalPart(precision());
        const scale = precisionLength(fraction.precision);
        const valueInThousandths = wholePart * 1000
            + fraction.numerator * 10 ** (3 - scale);
        const canonicalNumeral = `${wholePart}.${fraction.digits.slice(0, scale).join('')}`;
        return {
            data: {
                kind: 'decimal-writing',
                base: 10,
                wholePart,
                valueInThousandths,
                canonicalNumeral,
                fractionalPart: fraction
            }
        };
    }
}
