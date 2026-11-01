import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {MassEstimateProblem} from '../../../types/problems.ts';
import {MeasurementMassEstimationGeneratorSchema, type MeasurementMassEstimationGeneratorConfig} from './spec.ts';
import {massEstimatesForRange} from './numeric-domain.ts';

export class MeasurementMassEstimationGenerator implements ProblemGenerator<MassEstimateProblem, MeasurementMassEstimationGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementMassEstimationGeneratorSchema;

    generate(config: MeasurementMassEstimationGeneratorConfig): ProblemStub<MassEstimateProblem> {
        validateConfigFields('measurement-mass-estimation', config, ['measurement']);
        if (config.measurement !== 'gram-weight' && config.measurement !== 'kilogram-weight') {
            throw new GeneratorValidationError('measurement-mass-estimation', 'Unsupported scale.');
        }
        validateConfigFields('measurement-mass-estimation', config, ['range']);
        const profiles = massEstimatesForRange(config.measurement, config.range!);
        if (profiles.length === 0) throw new GeneratorValidationError('measurement-mass-estimation', 'Unsupported canonical range for this scale.');
        const profile = profiles[Math.floor(random() * profiles.length)]!;
        return {data: {
            measurementKind: 'mass', object: profile.object, estimate: profile.estimate, referenceCount: profile.estimate,
            unit: profile.unit, referenceObject: profile.referenceObject, referenceValue: 1
        }};
    }
}
