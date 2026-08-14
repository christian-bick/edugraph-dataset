import {Scope} from 'edugraph-ts';
import {random} from '../../../lib/random.ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MassVolumeEstimateProblem} from '../../../types/problems.ts';
import {
    MeasurementMassVolumeEstimationGeneratorConfig,
    MeasurementMassVolumeEstimationGeneratorSchema
} from './spec.ts';

const liquidEstimates = [
    {container: 'water-bottle', estimateLiters: 1},
    {container: 'juice-carton', estimateLiters: 2},
    {container: 'watering-can', estimateLiters: 5},
    {container: 'bucket', estimateLiters: 10}
] as const;

export class MeasurementMassVolumeEstimationGenerator implements ProblemGenerator<
    MassVolumeEstimateProblem,
    MeasurementMassVolumeEstimationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementMassVolumeEstimationGeneratorSchema;

    generate(config: MeasurementMassVolumeEstimationGeneratorConfig): ProblemStub<MassVolumeEstimateProblem> {
        validateConfigFields('measurement-mass-volume-estimation', config, ['measurement', 'scale']);
        if (config.scale === Scope.GramScale) {
            if (config.measurement !== Scope.WeightMeasurement) throw new Error('Gram scale requires weight measurement.');
            const profiles = [
                {object: 'crayon' as const, estimate: 10},
                {object: 'apple' as const, estimate: 200},
                {object: 'book' as const, estimate: 500}
            ];
            const profile = profiles[Math.floor(random() * profiles.length)];
            return {tags: [config.measurement, config.scale], data: {
                measurementKind: 'mass', ...profile, referenceCount: profile.estimate, unit: 'g',
                referenceObject: 'paperclip', referenceValue: 1
            }};
        }
        if (config.scale === Scope.KilogramScale) {
            if (config.measurement !== Scope.WeightMeasurement) throw new Error('Kilogram scale requires weight measurement.');
            const profiles = [
                {object: 'backpack' as const, estimate: 3},
                {object: 'chair' as const, estimate: 5},
                {object: 'bicycle' as const, estimate: 12}
            ];
            const profile = profiles[Math.floor(random() * profiles.length)];
            return {tags: [config.measurement, config.scale], data: {
                measurementKind: 'mass', ...profile, referenceCount: profile.estimate, unit: 'kg',
                referenceObject: 'one-kilogram-bag', referenceValue: 1
            }};
        }
        if (config.scale !== Scope.LiterScale) throw new Error('Unsupported scale.');
        if (config.measurement !== Scope.LiquidVolumes) throw new Error('Liter scale requires liquid volume.');
        const estimate = liquidEstimates[Math.floor(random() * liquidEstimates.length)];
        return {tags: [config.measurement, config.scale], data: {
            measurementKind: 'liquid-volume',
            ...estimate,
            unit: 'L',
            referenceLiters: 1
        }};
    }
}
