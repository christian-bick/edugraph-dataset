import {Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {IntegerRoundingProblem} from '../../../types/problems.ts';
import {IntegerRoundingGeneratorConfig, IntegerRoundingGeneratorSchema} from './spec.ts';

type RoundingPlace = 10 | 100 | 1000 | 10000 | 100000;

const GRADE_FOUR_MIDPOINT_CLEARANCE_RATIO = 0.05;
const GRADE_FOUR_MIDPOINT_TIE_RATE = 0.2;

const places = new Map<string, RoundingPlace>([
    [Scope.StepsOf10, 10],
    [Scope.StepsOf100, 100],
    [Scope.StepsOf1000, 1000],
    [Scope.StepsOf10000, 10000],
    [Scope.StepsOf100000, 100000]
]);

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const selectGradeFourNumber = (
    minimum: number,
    maximum: number,
    midpoint: number,
    roundingPlace: RoundingPlace
): number | null => {
    const minimumMidpointDistance = Math.ceil(
        roundingPlace * GRADE_FOUR_MIDPOINT_CLEARANCE_RATIO
    );
    const lowerMaximum = Math.min(maximum, midpoint - minimumMidpointDistance);
    const upperMinimum = Math.max(minimum, midpoint + minimumMidpointDistance);
    const lowerCount = Math.max(0, lowerMaximum - minimum + 1);
    const upperCount = Math.max(0, maximum - upperMinimum + 1);
    const nonTieCount = lowerCount + upperCount;
    const canUseMidpoint = midpoint >= minimum && midpoint <= maximum;

    if (!canUseMidpoint && nonTieCount === 0) return null;
    if (canUseMidpoint && (
        nonTieCount === 0 || random() < GRADE_FOUR_MIDPOINT_TIE_RATE
    )) return midpoint;

    const offset = randomInteger(0, nonTieCount - 1);
    return offset < lowerCount
        ? minimum + offset
        : upperMinimum + offset - lowerCount;
};

export class IntegerRoundingGenerator implements ProblemGenerator<
    IntegerRoundingProblem,
    IntegerRoundingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = IntegerRoundingGeneratorSchema;

    generate(config: IntegerRoundingGeneratorConfig): ProblemStub<IntegerRoundingProblem> | null {
        validateConfigFields('integer-rounding', config, ['range', 'roundingMagnitude']);

        const place = places.get(config.roundingMagnitude!);
        if (!place) return null;
        const roundingPlace = place;

        if (config.range!.max > 1000 || roundingPlace > 100) {
            const minimum = Math.max(1000, Math.ceil(config.range!.min));
            const maximum = Math.min(1_000_000, Math.floor(config.range!.max));
            const minimumLowerIndex = Math.floor(minimum / roundingPlace);
            const maximumLowerIndex = Math.floor((maximum - 1) / roundingPlace);
            if (minimum > maximum || minimumLowerIndex > maximumLowerIndex) return null;

            const lowerMultiple = randomInteger(minimumLowerIndex, maximumLowerIndex)
                * roundingPlace;
            const upperMultiple = lowerMultiple + roundingPlace;
            const minimumNumber = Math.max(minimum, lowerMultiple + 1);
            const maximumNumber = Math.min(maximum, upperMultiple - 1);

            const midpoint = lowerMultiple + roundingPlace / 2;
            const number = selectGradeFourNumber(
                minimumNumber,
                maximumNumber,
                midpoint,
                roundingPlace
            );
            if (number === null) return null;
            const distanceLower = number - lowerMultiple;
            const distanceUpper = upperMultiple - number;
            const direction = number < midpoint ? 'down' : 'up';
            const roundedValue = direction === 'down' ? lowerMultiple : upperMultiple;
            const isMidpointTie = number === midpoint;
            return {
                data: {
                    task: 'multi-digit-integer-rounding',
                    number,
                    roundingPlace,
                    lowerMultiple,
                    midpoint,
                    upperMultiple,
                    roundedValue,
                    direction,
                    distanceLower,
                    distanceUpper,
                    isMidpointTie
                }
            };
        }

        const minimum = Math.max(0, Math.ceil(config.range!.min));
        const maximum = Math.min(1000, Math.floor(config.range!.max));
        const minimumLower = Math.ceil(Math.max(0, minimum - roundingPlace + 1) / roundingPlace)
            * roundingPlace;
        const maximumLower = Math.floor((maximum - roundingPlace - 1) / roundingPlace)
            * roundingPlace;
        if (minimumLower > maximumLower) return null;

        const lowerMultiple = randomInteger(
            minimumLower / roundingPlace,
            maximumLower / roundingPlace
        ) * roundingPlace;
        const upperMultiple = lowerMultiple + roundingPlace;
        const midpoint = lowerMultiple + roundingPlace / 2;
        const offset = randomInteger(1, roundingPlace - 1);
        const number = lowerMultiple + offset;
        const distanceLower = number - lowerMultiple;
        const distanceUpper = upperMultiple - number;
        const direction = number < midpoint ? 'down' : 'up';
        const roundedValue = direction === 'down' ? lowerMultiple : upperMultiple;

        return {
            data: {
                number,
                roundingPlace: roundingPlace as 10 | 100,
                lowerMultiple,
                midpoint,
                upperMultiple,
                roundedValue,
                direction,
                distanceLower,
                distanceUpper,
                isMidpointTie: number === midpoint
            }
        };
    }
}
