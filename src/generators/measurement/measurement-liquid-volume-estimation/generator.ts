import {random} from '../../../lib/random.ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {LiquidVolumeEstimateProblem} from '../../../types/problems.ts';
import {
    MeasurementLiquidVolumeEstimationGeneratorConfig,
    MeasurementLiquidVolumeEstimationGeneratorSchema
} from './spec.ts';

const liquidEstimates = [
    {container: 'water-bottle', estimateLiters: 1},
    {container: 'juice-carton', estimateLiters: 2},
    {container: 'watering-can', estimateLiters: 5},
    {container: 'bucket', estimateLiters: 10}
] as const;

export class MeasurementLiquidVolumeEstimationGenerator implements ProblemGenerator<
    LiquidVolumeEstimateProblem,
    MeasurementLiquidVolumeEstimationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementLiquidVolumeEstimationGeneratorSchema;

    generate(config: MeasurementLiquidVolumeEstimationGeneratorConfig): ProblemStub<LiquidVolumeEstimateProblem> {
        validateConfigFields('measurement-liquid-volume-estimation', config, []);
        const estimate = liquidEstimates[Math.floor(random() * liquidEstimates.length)];
        return {data: {
            measurementKind: 'liquid-volume',
            ...estimate,
            unit: 'L',
            referenceLiters: 1
        }};
    }
}
