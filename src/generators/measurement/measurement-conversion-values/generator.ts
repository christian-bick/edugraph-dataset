import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {MeasurementConversionValuesProblem} from '../../../types/problems.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {random} from '../../../lib/random.ts';
import {conversionValueTuples} from './numeric-domain.ts';
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
        validateConfigFields('measurement-conversion-values', config, ['range']);
        const tuples = conversionValueTuples(config.unitPair!, config.numericProfile, config.range!);
        if (!tuples.length) throw new GeneratorValidationError('measurement-conversion-values', 'Unsupported canonical range.');
        const selected = tuples[Math.floor(random() * tuples.length)]!;
        const equality = (largerHundredths: number) => ({largerHundredths,
            smallerHundredths: largerHundredths * pair.factor});
        return {data: {pair: {...pair}, numericExamples: {numberKind: config.numericProfile,
            equalities: [equality(selected[0]), equality(selected[1])]}}};
    }
}
