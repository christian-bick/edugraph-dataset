import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {AngleMeasure, AngleMeasurementProblem} from '../../../types/problems.ts';
import {AngleMeasurementGeneratorConfig, AngleMeasurementGeneratorSchema} from './spec.ts';

const ANGLE_MEASURES: readonly AngleMeasure[] = [
    23, 30, 37, 45, 52, 60, 68, 75, 90, 105, 112, 120, 127, 135, 143, 150, 158
];

function randomItem<T>(items: readonly T[]): T {
    return items[Math.floor(random() * items.length)];
}

export class AngleMeasurementGenerator implements ProblemGenerator<
    AngleMeasurementProblem,
    AngleMeasurementGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = AngleMeasurementGeneratorSchema;

    generate(config: AngleMeasurementGeneratorConfig): ProblemStub<AngleMeasurementProblem> | null {
        validateConfigFields('angle-measurement', config, ['useProtractorMeasurement']);
        return {data: {angleMeasure: randomItem(ANGLE_MEASURES)}};
    }
}
