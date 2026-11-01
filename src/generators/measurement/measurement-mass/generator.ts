import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {MassMeasurementProblem} from '../../../types/problems.ts';
import {MeasurementMassGeneratorSchema, type MeasurementMassGeneratorConfig} from './spec.ts';
import {massReadingsForRange} from './numeric-domain.ts';

export class MeasurementMassGenerator implements ProblemGenerator<MassMeasurementProblem, MeasurementMassGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementMassGeneratorSchema;

    generate(config: MeasurementMassGeneratorConfig): ProblemStub<MassMeasurementProblem> {
        validateConfigFields('measurement-mass', config, ['measurement']);
        if (config.measurement !== 'gram-weight' && config.measurement !== 'kilogram-weight') {
            throw new GeneratorValidationError('measurement-mass', 'Unsupported scale.');
        }
        validateConfigFields('measurement-mass', config, ['range']);
        const profiles = massReadingsForRange(config.measurement, config.range!);
        if (profiles.length === 0) throw new GeneratorValidationError('measurement-mass', 'Unsupported canonical range for this scale.');
        const profile = profiles[Math.floor(random() * profiles.length)]!;
        return {data: {
            measurementKind: 'mass', object: profile.object, value: profile.value, unit: profile.unit, instrument: 'digital-scale'
        }};
    }
}
