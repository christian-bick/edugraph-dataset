import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MeasurementDataProblem} from '../../../types/problems.ts';
import {
    makeEighthUnitObservations, makeHalfUnitObservations,
    makeQuarterUnitObservations, makeWholeUnitObservations
} from '../measurement-data-helpers.ts';
import {MeasurementDataGeneratorConfig, MeasurementDataGeneratorSchema} from './spec.ts';

export class MeasurementDataGenerator implements ProblemGenerator<MeasurementDataProblem, MeasurementDataGeneratorConfig> {
    type: AbstractProblem['type'] = 'statistics';
    schema = MeasurementDataGeneratorSchema;

    generate(config: MeasurementDataGeneratorConfig): ProblemStub<MeasurementDataProblem> {
        validateConfigFields('measurement-data', config, ['numberKind', 'unitScale', 'useSingleFrame']);
        if (!['integer', 'fraction', 'half', 'quarter', 'eighth'].includes(config.numberKind!)
            || !['cm', 'in'].includes(config.unitScale!)
            || typeof config.useSingleFrame !== 'boolean') {
            throw new GeneratorValidationError('measurement-data', 'Invalid number kind, unit, or frame configuration.');
        }
        if (config.useSingleFrame && config.numberKind === 'integer') {
            throw new GeneratorValidationError('measurement-data', 'A single-frame fractional dataset requires fractional measurements.');
        }
        const subdivisions = config.numberKind === 'half' ? 2
            : config.numberKind === 'quarter' ? 4
            : config.numberKind === 'eighth' ? 8
            : config.useSingleFrame ? 8 : config.numberKind === 'fraction' ? 4 : 1;
        const observations = subdivisions === 2 ? makeHalfUnitObservations()
            : subdivisions === 8 ? makeEighthUnitObservations()
            : subdivisions === 4 ? makeQuarterUnitObservations()
            : makeWholeUnitObservations();
        return {data: {
            unit: config.unitScale!,
            subdivisions,
            observations
        }};
    }
}
