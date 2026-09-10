import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MeasurementExtremaProblem} from '../../../types/problems.ts';
import {makeEighthUnitObservations} from '../measurement-data-helpers.ts';
import {MeasurementExtremaGeneratorConfig, MeasurementExtremaGeneratorSchema} from './spec.ts';

export class MeasurementExtremaGenerator implements ProblemGenerator<MeasurementExtremaProblem, MeasurementExtremaGeneratorConfig> {
    type: AbstractProblem['type'] = 'statistics';
    schema = MeasurementExtremaGeneratorSchema;

    generate(config: MeasurementExtremaGeneratorConfig): ProblemStub<MeasurementExtremaProblem> {
        validateConfigFields('measurement-extrema', config, ['operation', 'unitScale']);
        if (config.operation !== 'addition' && config.operation !== 'subtraction') {
            throw new GeneratorValidationError('measurement-extrema', 'Expected addition or subtraction.');
        }
        if (config.unitScale !== 'cm' && config.unitScale !== 'in') {
            throw new GeneratorValidationError('measurement-extrema', 'Expected centimeters or inches.');
        }
        const observations = makeEighthUnitObservations();
        const values = observations.map(({value}) => value);
        const shortest = Math.min(...values);
        const longest = Math.max(...values);
        return {data: {
            unit: config.unitScale,
            subdivisions: 8,
            observations,
            extremaRelation: {
                operation: config.operation,
                shortest,
                longest,
                answer: config.operation === 'addition' ? shortest + longest : longest - shortest
            }
        }};
    }
}
