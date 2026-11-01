import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalRoundingProblem} from '../../../types/problems.ts';
import {DecimalRoundingGeneratorConfig, DecimalRoundingGeneratorSchema} from './spec.ts';
import {decimalRoundingRangeBlocks, roundingOffsetAt, ROUNDING_PLACES} from './domain.ts';

const MAX_VALUE_IN_TEN_THOUSANDTHS = 10_000_000;

/** Original place/scenario probabilities, conditioned on the lower endpoint being zero. */
export function decimalRoundingCases(requireZeroEndpoint: boolean) {
    return ROUNDING_PLACES.flatMap(roundingPlace => [0, 1, 2, 3].flatMap(scenario => {
        const intervalCount = MAX_VALUE_IN_TEN_THOUSANDTHS / roundingPlace.quantumInTenThousandths;
        const zeroShare = scenario === 3 ? 0 : 1 / intervalCount;
        const weight = requireZeroEndpoint ? zeroShare : 1 - zeroShare;
        return weight === 0 ? [] : [{roundingPlace, scenario, weight}];
    }));
}

function decimalRounding(config: DecimalRoundingGeneratorConfig): DecimalRoundingProblem {
    const cases = decimalRoundingRangeBlocks(config.requireZeroEndpoint!, config.range!);
    if (!cases.length) throw new GeneratorValidationError('decimal-rounding', 'No rounding intervals support this endpoint and range profile.');
    let remaining = random() * cases.reduce((total, entry) => total + entry.weight, 0);
    const block = cases.find(entry => (remaining -= entry.weight) < 0) ?? cases[cases.length - 1]!;
    const {roundingPlace} = block;
    const quantum = roundingPlace.quantumInTenThousandths;
    const lowerCandidateInTenThousandths = (block.firstInterval + Math.floor(random() * block.intervalCount) * block.intervalStep) * quantum;
    const upperCandidateInTenThousandths = lowerCandidateInTenThousandths + quantum;
    const halfQuantum = quantum / 2;
    const offset = roundingOffsetAt(block, Math.floor(random() * block.offsetCount));
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
        validateConfigFields('decimal-rounding', config, ['requireZeroEndpoint', 'range']);
        return {data: decimalRounding(config)};
    }
}
