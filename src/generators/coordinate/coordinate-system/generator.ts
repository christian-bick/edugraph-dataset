import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {CoordinateSystemProblem} from '../../../types/problems.ts';
import {CoordinateSystemGeneratorConfig, CoordinateSystemGeneratorSchema} from './spec.ts';

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const sampleTicks = (): {tickStep: 1 | 2; tickValues: number[]} => {
    const tickStep = randomInteger(1, 2) as 1 | 2;
    const intervalCount = randomInteger(4, 8);
    return {
        tickStep,
        tickValues: Array.from({length: intervalCount + 1}, (_, index) => index * tickStep)
    };
};

const sampleTravel = (horizontalTicks: readonly number[], verticalTicks: readonly number[]) => {
    const horizontalChoices = horizontalTicks.slice(1, -1);
    const verticalChoices = verticalTicks.slice(1, -1);
    const choices = horizontalChoices.flatMap(xUnits => verticalChoices
        .filter(yUnits => yUnits !== xUnits)
        .map(yUnits => ({xUnits, yUnits})));
    return choices[Math.floor(random() * choices.length)]!;
};

export class CoordinateSystemGenerator implements ProblemGenerator<
    CoordinateSystemProblem, CoordinateSystemGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = CoordinateSystemGeneratorSchema;

    generate(config: CoordinateSystemGeneratorConfig): ProblemStub<CoordinateSystemProblem> {
        validateConfigFields('coordinate-system', config, []);
        const horizontalTicks = sampleTicks();
        const verticalTicks = sampleTicks();
        return {data: {
            kind: 'coordinate-system-foundations',
            origin: {x: 0, y: 0},
            rightAngleDegrees: 90,
            axes: {
                horizontal: {
                    axisName: 'x',
                    coordinateName: 'x',
                    positiveUnitVector: {x: 1, y: 0},
                    ...horizontalTicks
                },
                vertical: {
                    axisName: 'y',
                    coordinateName: 'y',
                    positiveUnitVector: {x: 0, y: 1},
                    ...verticalTicks
                }
            },
            travel: sampleTravel(horizontalTicks.tickValues, verticalTicks.tickValues)
        }};
    }
}
