import {Scope} from 'edugraph-ts';
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
        validateConfigFields('measurement-mass-volume', config, ['measurement', 'scale']);
        if (config.scale === Scope.GramScale) {
            if (config.measurement !== Scope.WeightMeasurement) {
                throw new Error('[Generator: measurement-mass-volume] Validation Error: Gram scale requires weight measurement.');
            }
            const profiles = [
                {object: 'apple' as const, value: 180},
                {object: 'book' as const, value: 450},
                {object: 'toy-car' as const, value: 320}
            ];
            const profile = profiles[Math.floor(random() * profiles.length)];
            return {tags: [config.measurement, config.scale], data: {
                measurementKind: 'mass',
                ...profile,
                unit: 'g',
                instrument: 'digital-scale'
            }};
        }
        if (config.scale === Scope.KilogramScale) {
            if (config.measurement !== Scope.WeightMeasurement) {
                throw new Error('[Generator: measurement-mass-volume] Validation Error: Kilogram scale requires weight measurement.');
            }
            const profiles = [
                {object: 'watermelon' as const, value: 4},
                {object: 'backpack' as const, value: 3},
                {object: 'suitcase' as const, value: 12}
            ];
            const profile = profiles[Math.floor(random() * profiles.length)];
            return {tags: [config.measurement, config.scale], data: {
                measurementKind: 'mass',
                ...profile,
                unit: 'kg',
                instrument: 'digital-scale'
            }};
        }
        if (config.scale !== Scope.LiterScale) {
            throw new Error('[Generator: measurement-mass-volume] Validation Error: Unsupported scale.');
        }
        if (config.measurement !== Scope.LiquidVolumes) {
            throw new Error('[Generator: measurement-mass-volume] Validation Error: Liter scale requires liquid volume.');
        }
        const capacity = randomInteger(4, 7);
        const value = randomInteger(1, capacity - 1);
        return {
            tags: [config.measurement, config.scale],
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
