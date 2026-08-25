import {validateConfigFields} from '../../../lib/errors.ts';
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

    generate(config: MeasurementMassVolumeGeneratorConfig): ProblemStub<MassVolumeMeasurementProblem> {
        validateConfigFields('measurement-mass-volume', config, ['measurement']);
        if (config.measurement === 'gram-weight') {
            const profiles = [
                {object: 'apple' as const, value: 180},
                {object: 'book' as const, value: 450},
                {object: 'toy-car' as const, value: 320}
            ];
            const profile = profiles[Math.floor(random() * profiles.length)];
            return {data: {
                measurementKind: 'mass',
                ...profile,
                unit: 'g',
                instrument: 'digital-scale'
            }};
        }
        if (config.measurement === 'kilogram-weight') {
            const profiles = [
                {object: 'watermelon' as const, value: 4},
                {object: 'backpack' as const, value: 3},
                {object: 'suitcase' as const, value: 12}
            ];
            const profile = profiles[Math.floor(random() * profiles.length)];
            return {data: {
                measurementKind: 'mass',
                ...profile,
                unit: 'kg',
                instrument: 'digital-scale'
            }};
        }
        if (config.measurement !== 'liter-volume') {
            throw new Error('[Generator: measurement-mass-volume] Validation Error: Unsupported scale.');
        }
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
