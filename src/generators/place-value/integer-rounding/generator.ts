import {Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {IntegerRoundingProblem} from '../../../types/problems.ts';
import {IntegerRoundingGeneratorConfig, IntegerRoundingGeneratorSchema} from './spec.ts';

const places = new Map<string, 10 | 100>([
    [Scope.StepsOf10, 10],
    [Scope.StepsOf100, 100]
]);

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

export class IntegerRoundingGenerator implements ProblemGenerator<
    IntegerRoundingProblem,
    IntegerRoundingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = IntegerRoundingGeneratorSchema;

    generate(config: IntegerRoundingGeneratorConfig): ProblemStub<IntegerRoundingProblem> | null {
        validateConfigFields('integer-rounding', config, ['range', 'roundingMagnitude']);

        const roundingPlace = places.get(config.roundingMagnitude!);
        if (!roundingPlace) return null;

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
                roundingPlace,
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
