import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MassMeasurementProblem} from '../../../types/problems.ts';
import {
    MeasurementMassGeneratorConfig,
    MeasurementMassGeneratorSchema
} from './spec.ts';

export class MeasurementMassGenerator implements ProblemGenerator<
    MassMeasurementProblem,
    MeasurementMassGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementMassGeneratorSchema;

    generate(config: MeasurementMassGeneratorConfig): ProblemStub<MassMeasurementProblem> {
        validateConfigFields('measurement-mass', config, ['measurement']);
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
        throw new Error('[Generator: measurement-mass] Validation Error: Unsupported scale.');
    }
}
