import {random} from '../../../lib/random.ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MassEstimateProblem} from '../../../types/problems.ts';
import {
    MeasurementMassEstimationGeneratorConfig,
    MeasurementMassEstimationGeneratorSchema
} from './spec.ts';

export class MeasurementMassEstimationGenerator implements ProblemGenerator<
    MassEstimateProblem,
    MeasurementMassEstimationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementMassEstimationGeneratorSchema;

    generate(config: MeasurementMassEstimationGeneratorConfig): ProblemStub<MassEstimateProblem> {
        validateConfigFields('measurement-mass-estimation', config, ['measurement']);
        if (config.measurement === 'gram-weight') {
            const profiles = [
                {object: 'crayon' as const, estimate: 10},
                {object: 'apple' as const, estimate: 200},
                {object: 'book' as const, estimate: 500}
            ];
            const profile = profiles[Math.floor(random() * profiles.length)];
            return {data: {
                measurementKind: 'mass', ...profile, referenceCount: profile.estimate, unit: 'g',
                referenceObject: 'paperclip', referenceValue: 1
            }};
        }
        if (config.measurement === 'kilogram-weight') {
            const profiles = [
                {object: 'backpack' as const, estimate: 3},
                {object: 'chair' as const, estimate: 5},
                {object: 'bicycle' as const, estimate: 12}
            ];
            const profile = profiles[Math.floor(random() * profiles.length)];
            return {data: {
                measurementKind: 'mass', ...profile, referenceCount: profile.estimate, unit: 'kg',
                referenceObject: 'one-kilogram-bag', referenceValue: 1
            }};
        }
        throw new Error('[Generator: measurement-mass-estimation] Validation Error: Unsupported scale.');
    }
}
