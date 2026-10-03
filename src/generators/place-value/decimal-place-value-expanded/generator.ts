import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalExpandedPlace, DecimalPlaceValueExpandedProblem} from '../../../types/problems.ts';
import {
    DecimalPlaceValueExpandedGeneratorSchema,
    type DecimalPlaceValueExpandedGeneratorConfig
} from './spec.ts';

type FractionalDigits = DecimalPlaceValueExpandedProblem['fractionalDigits'];
type Precision = DecimalPlaceValueExpandedProblem['fractionalPrecision'];
type PlaceDefinition = Readonly<Pick<
    DecimalExpandedPlace,
    'name' | 'exponent' | 'unitNumerator' | 'unitDenominator'
>>;

const PLACES: readonly [
    PlaceDefinition, PlaceDefinition, PlaceDefinition,
    PlaceDefinition, PlaceDefinition, PlaceDefinition
] = [
    {name: 'hundreds', exponent: 2, unitNumerator: 100, unitDenominator: 1},
    {name: 'tens', exponent: 1, unitNumerator: 10, unitDenominator: 1},
    {name: 'ones', exponent: 0, unitNumerator: 1, unitDenominator: 1},
    {name: 'tenths', exponent: -1, unitNumerator: 1, unitDenominator: 10},
    {name: 'hundredths', exponent: -2, unitNumerator: 1, unitDenominator: 100},
    {name: 'thousandths', exponent: -3, unitNumerator: 1, unitDenominator: 1000}
];

const nonzeroDigit = (): number => 1 + Math.floor(random() * 9);
const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const wholeDigits = (wholePart: number): readonly [number, number, number] => [
    Math.floor(wholePart / 100),
    Math.floor(wholePart / 10) % 10,
    wholePart % 10
];

/** Exact decomposition; zero places remain in `places` and leave `sumTerms`. */
export function createExpandedDecimal(
    wholePart: number,
    fractionalDigits: FractionalDigits,
    fractionalPrecision: Precision
): DecimalPlaceValueExpandedProblem | null {
    if (
        !Number.isInteger(wholePart) || wholePart < 0 || wholePart > 999 ||
        ![1, 2, 3].includes(fractionalPrecision) ||
        fractionalDigits.length !== 3 ||
        fractionalDigits.some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9) ||
        fractionalDigits[fractionalPrecision - 1] === 0 ||
        fractionalDigits.slice(fractionalPrecision).some(digit => digit !== 0)
    ) return null;

    const digits = [...wholeDigits(wholePart), ...fractionalDigits];
    const places: DecimalExpandedPlace[] = PLACES.map((place, index) => {
        const digit = digits[index]!;
        return {
            ...place,
            digit,
            contributionInThousandths: digit * place.unitNumerator * 1000 / place.unitDenominator
        };
    });
    const sumTerms = places.filter(place => place.digit !== 0);
    if (sumTerms.length < 2 || !sumTerms.some(place => place.exponent < 0)) return null;

    return {
        kind: 'decimal-place-value-expanded',
        base: 10,
        wholePart,
        fractionalDigits,
        fractionalPrecision,
        valueInThousandths: places.reduce((sum, place) => sum + place.contributionInThousandths, 0),
        canonicalNumeral: `${wholePart}.${fractionalDigits.slice(0, fractionalPrecision).join('')}`,
        places,
        sumTerms
    };
}

function sampleValue(): readonly [number, FractionalDigits, 3] {
    // Each dataset sample includes a 1/1000 contribution; sparse cases also
    // expose 5.008- and 0.305-style placeholders regularly.
    switch (Math.floor(random() * 5)) {
        case 0: return [randomInteger(1, 99), [0, 0, nonzeroDigit()], 3];
        case 1: return [0, [nonzeroDigit(), 0, nonzeroDigit()], 3];
        case 2: return [randomInteger(1, 999), [nonzeroDigit(), nonzeroDigit(), nonzeroDigit()], 3];
        case 3: return [randomInteger(0, 99), [0, nonzeroDigit(), nonzeroDigit()], 3];
        default: return [randomInteger(100, 999), [nonzeroDigit(), 0, nonzeroDigit()], 3];
    }
}

export class DecimalPlaceValueExpandedGenerator implements ProblemGenerator<
    DecimalPlaceValueExpandedProblem,
    DecimalPlaceValueExpandedGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = DecimalPlaceValueExpandedGeneratorSchema;

    generate(
        config: DecimalPlaceValueExpandedGeneratorConfig
    ): ProblemStub<DecimalPlaceValueExpandedProblem> | null {
        validateConfigFields('decimal-place-value-expanded', config, []);
        const [wholePart, fractionalDigits, fractionalPrecision] = sampleValue();
        const data = createExpandedDecimal(wholePart, fractionalDigits, fractionalPrecision);
        return data === null ? null : {data};
    }
}
