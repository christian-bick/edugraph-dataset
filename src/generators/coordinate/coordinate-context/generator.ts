import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    ContextualCoordinateProblem,
    ContextualCoordinateValue
} from '../../../types/problems.ts';
import {CoordinateContextGeneratorConfig, CoordinateContextGeneratorSchema} from './spec.ts';

type Coordinate = Readonly<{xValue: ContextualCoordinateValue; yValue: ContextualCoordinateValue}>;

const VALUES = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const LOCATION_IDS = ['pond', 'garden', 'playground'] as const;

const randomIndex = (length: number): number => Math.floor(random() * length);

const availableCoordinates = (): Coordinate[] =>
    VALUES.flatMap(xValue => VALUES.map(yValue => ({xValue, yValue})));

/** Draw without replacement so named landmarks never share a location. */
function drawCoordinate(available: Coordinate[], distinctComponents: boolean): Coordinate {
    const eligibleIndices = available.flatMap((coordinate, index) =>
        !distinctComponents || coordinate.xValue !== coordinate.yValue ? [index] : []);
    const selectedIndex = eligibleIndices[randomIndex(eligibleIndices.length)]!;
    return available.splice(selectedIndex, 1)[0]!;
}

function contextualLocations(): ContextualCoordinateProblem {
    const available = availableCoordinates();
    const referenceIndex = randomIndex(LOCATION_IDS.length);
    const pond = drawCoordinate(available, referenceIndex === 0);
    const garden = drawCoordinate(available, referenceIndex === 1);
    const playground = drawCoordinate(available, referenceIndex === 2);

    return {
        kind: 'contextual-coordinate-locations',
        situation: {
            kind: 'park-map',
            originLandmark: 'park-gate',
            horizontalQuantity: {
                kind: 'eastward-distance',
                positiveDirection: 'east',
                unitId: 'block'
            },
            verticalQuantity: {
                kind: 'northward-distance',
                positiveDirection: 'north',
                unitId: 'block'
            }
        },
        locations: [
            {id: 'pond', ...pond},
            {id: 'garden', ...garden},
            {id: 'playground', ...playground}
        ],
        referenceLocationId: LOCATION_IDS[referenceIndex]!
    };
}

export class CoordinateContextGenerator implements ProblemGenerator<
    ContextualCoordinateProblem,
    CoordinateContextGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = CoordinateContextGeneratorSchema;

    generate(config: CoordinateContextGeneratorConfig): ProblemStub<ContextualCoordinateProblem> {
        validateConfigFields('coordinate-context', config, []);
        return {data: contextualLocations()};
    }
}
