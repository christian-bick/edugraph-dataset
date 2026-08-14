import {random} from '../../../lib/random.ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MassVolumeEstimateProblem} from '../../../types/problems.ts';
import {
    MeasurementMassVolumeEstimationGeneratorConfig,
    MeasurementMassVolumeEstimationGeneratorSchema
} from './spec.ts';

const estimates: readonly Pick<MassVolumeEstimateProblem, 'container' | 'estimateLiters'>[] = [
    {container: 'water-bottle', estimateLiters: 1},
    {container: 'juice-carton', estimateLiters: 2},
    {container: 'watering-can', estimateLiters: 5},
    {container: 'bucket', estimateLiters: 10}
];

export class MeasurementMassVolumeEstimationGenerator implements ProblemGenerator<
    MassVolumeEstimateProblem,
    MeasurementMassVolumeEstimationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementMassVolumeEstimationGeneratorSchema;

    generate(config: MeasurementMassVolumeEstimationGeneratorConfig): ProblemStub<MassVolumeEstimateProblem> {
        validateConfigFields('measurement-mass-volume-estimation', config, []);
        const estimate = estimates[Math.floor(random() * estimates.length)];
        return {data: {
            measurementKind: 'liquid-volume',
            ...estimate,
            unit: 'L',
            referenceLiters: 1
        }};
    }
}
