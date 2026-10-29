import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {MeasurementConversionValuesProblem} from '../../../types/problems.ts';
import {buildMeasurementConversionValues, measurementConversionPairSeeds} from '../helpers.ts';
import {
    MeasurementConversionValuesGeneratorConfig,
    MeasurementConversionValuesGeneratorSchema
} from './spec.ts';

export class MeasurementConversionValuesGenerator implements ProblemGenerator<
    MeasurementConversionValuesProblem,
    MeasurementConversionValuesGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementConversionValuesGeneratorSchema;

    generate(
        config: MeasurementConversionValuesGeneratorConfig
    ): ProblemStub<MeasurementConversionValuesProblem> {
        validateConfigFields('measurement-conversion-values', config, ['unitPair', 'numericProfile']);
        if (!Object.hasOwn(measurementConversionPairSeeds, config.unitPair!)) {
            throw new GeneratorValidationError(
                'measurement-conversion-values',
                `Unsupported unit pair "${config.unitPair}".`
            );
        }
        const pair = measurementConversionPairSeeds[config.unitPair!];
        if (config.numericProfile !== 'integer' && config.numericProfile !== 'decimal') {
            throw new GeneratorValidationError(
                'measurement-conversion-values',
                `Unsupported numeric profile "${config.numericProfile}".`
            );
        }
        return {data: buildMeasurementConversionValues({...pair}, config.numericProfile)};
    }
}
