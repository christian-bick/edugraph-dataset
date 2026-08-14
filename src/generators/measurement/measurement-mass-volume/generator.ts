import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MassVolumeMeasurementProblem} from '../../../types/problems.ts';
import {
    MeasurementMassVolumeGeneratorConfig,
    MeasurementMassVolumeGeneratorSchema
} from './spec.ts';

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

export class MeasurementMassVolumeGenerator implements ProblemGenerator<
    MassVolumeMeasurementProblem,
    MeasurementMassVolumeGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementMassVolumeGeneratorSchema;

    generate(_config: MeasurementMassVolumeGeneratorConfig): ProblemStub<MassVolumeMeasurementProblem> {
        const capacity = randomInteger(4, 7);
        const value = randomInteger(1, capacity - 1);
        return {
            data: {
                measurementKind: 'liquid-volume',
                object: 'measuring-jug',
                unit: 'L',
                value,
                capacity,
                tickStep: 1
            }
        };
    }
}
