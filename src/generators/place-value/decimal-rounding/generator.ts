import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalRoundingPlace, DecimalRoundingProblem} from '../../../types/problems.ts';
import {DecimalRoundingGeneratorConfig, DecimalRoundingGeneratorSchema} from './spec.ts';

const MAX_VALUE_IN_TEN_THOUSANDTHS = 10_000_000;
const PLACES: readonly DecimalRoundingPlace[] = [
    {name: 'hundreds', quantumInTenThousandths: 1_000_000},
    {name: 'tens', quantumInTenThousandths: 100_000},
    {name: 'ones', quantumInTenThousandths: 10_000},
    {name: 'tenths', quantumInTenThousandths: 1_000},
    {name: 'hundredths', quantumInTenThousandths: 100},
    {name: 'thousandths', quantumInTenThousandths: 10}
];

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

/** Selects a decimal offset strictly inside one rounding interval. */
function nonWholeOffset(lower: number, minimum: number, maximum: number): number {
    let offset: number;
    do {
        offset = randomInteger(minimum, maximum);
    } while ((lower + offset) % 10_000 === 0);
    return offset;
}

/** A near-upper input rounds to 1000 or carries across an integer boundary. */
function carryLower(quantum: number): number {
    if (quantum >= 100_000) return MAX_VALUE_IN_TEN_THOUSANDTHS - quantum;
    const upperWhole = quantum === 10_000
        ? randomInteger(1, 9) * 10
        : randomInteger(1, 99);
    return upperWhole * 10_000 - quantum;
}

/** Keeps an upward carry visibly inside its interval and the input decimal. */
function carryOffset(lower: number, quantum: number): number {
    const offset = quantum * 4 / 5;
    return (lower + offset) % 10_000 === 0 ? offset + 1 : offset;
}

function decimalRounding(): DecimalRoundingProblem {
    const roundingPlace = PLACES[randomInteger(0, PLACES.length - 1)]!;
    const quantum = roundingPlace.quantumInTenThousandths;
    const scenario = randomInteger(0, 3);
    const lowerCandidateInTenThousandths = scenario === 3
        ? carryLower(quantum)
        : randomInteger(0, MAX_VALUE_IN_TEN_THOUSANDTHS / quantum - 1) * quantum;
    const upperCandidateInTenThousandths = lowerCandidateInTenThousandths + quantum;
    const halfQuantum = quantum / 2;
    const offset = scenario === 3 ? carryOffset(lowerCandidateInTenThousandths, quantum)
        : scenario === 2 && quantum <= 10_000 ? halfQuantum
            : scenario === 0
                ? nonWholeOffset(lowerCandidateInTenThousandths, 1, halfQuantum - 1)
                : nonWholeOffset(lowerCandidateInTenThousandths, halfQuantum + 1, quantum - 1);
    const inputInTenThousandths = lowerCandidateInTenThousandths + offset;
    const midpointInTenThousandths = lowerCandidateInTenThousandths + halfQuantum;
    const direction = inputInTenThousandths < midpointInTenThousandths ? 'down' : 'up';

    return {
        kind: 'decimal-place-rounding',
        inputInTenThousandths,
        roundingPlace,
        lowerCandidateInTenThousandths,
        upperCandidateInTenThousandths,
        midpointInTenThousandths,
        roundedInTenThousandths: direction === 'down'
            ? lowerCandidateInTenThousandths : upperCandidateInTenThousandths,
        direction,
        isMidpointTie: inputInTenThousandths === midpointInTenThousandths,
        distanceToLowerInTenThousandths: offset,
        distanceToUpperInTenThousandths: quantum - offset
    };
}

export class DecimalRoundingGenerator implements ProblemGenerator<DecimalRoundingProblem, DecimalRoundingGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = DecimalRoundingGeneratorSchema;

    generate(config: DecimalRoundingGeneratorConfig): ProblemStub<DecimalRoundingProblem> {
        validateConfigFields('decimal-rounding', config, []);
        return {data: decimalRounding()};
    }
}
