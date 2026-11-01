import {random} from '../../../lib/random.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {LiquidVolumeEstimateProblem} from '../../../types/problems.ts';
import {MeasurementLiquidVolumeEstimationGeneratorSchema, type MeasurementLiquidVolumeEstimationGeneratorConfig} from './spec.ts';
import {liquidEstimatesForRange} from './numeric-domain.ts';

export class MeasurementLiquidVolumeEstimationGenerator implements ProblemGenerator<LiquidVolumeEstimateProblem, MeasurementLiquidVolumeEstimationGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementLiquidVolumeEstimationGeneratorSchema;

    generate(config: MeasurementLiquidVolumeEstimationGeneratorConfig): ProblemStub<LiquidVolumeEstimateProblem> {
        validateConfigFields('measurement-liquid-volume-estimation', config, ['range']);
        const estimates = liquidEstimatesForRange(config.range!);
        if (estimates.length === 0) throw new GeneratorValidationError('measurement-liquid-volume-estimation', 'Unsupported canonical range.');
        const estimate = estimates[Math.floor(random() * estimates.length)]!;
        return {data: {measurementKind: 'liquid-volume', ...estimate, unit: 'L', referenceLiters: 1}};
    }
}
