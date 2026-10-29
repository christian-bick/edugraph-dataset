import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    MeasurementConversionPair,
    MeasurementConversionPairId,
    StandardUnitEquivalencesProblem
} from '../../../types/problems.ts';
import {
    buildMeasurementConversionValues,
    buildUnitEquivalenceSequence,
    measurementConversionPairSeeds
} from '../helpers.ts';
import {
    MeasurementConversionGeneratorConfig,
    MeasurementConversionGeneratorSchema
} from './spec.ts';

const buildPair = (id: MeasurementConversionPairId): MeasurementConversionPair =>
    ({...measurementConversionPairSeeds[id]});

export class MeasurementConversionGenerator implements ProblemGenerator<
    StandardUnitEquivalencesProblem,
    MeasurementConversionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementConversionGeneratorSchema;

    generate(
        config: MeasurementConversionGeneratorConfig
    ): ProblemStub<StandardUnitEquivalencesProblem> {
        validateConfigFields('measurement-conversion', config, ['unitPair', 'numericProfile']);

        const pairSeed = measurementConversionPairSeeds[config.unitPair!];
        if (!pairSeed) {
            throw new GeneratorValidationError(
                'measurement-conversion',
                `Unsupported unit pair "${config.unitPair}".`
            );
        }
        const pair = buildPair(pairSeed.id);

        if (config.numericProfile !== 'legacy'
            && config.numericProfile !== 'integer'
            && config.numericProfile !== 'decimal') {
            throw new GeneratorValidationError(
                'measurement-conversion',
                `Unsupported numeric profile "${config.numericProfile}".`
            );
        }

        const legacy = buildUnitEquivalenceSequence(pair);
        if (config.numericProfile === 'legacy') return {data: legacy};

        return {data: {
            ...legacy,
            numericExamples: buildMeasurementConversionValues(pair, config.numericProfile).numericExamples
        }};
    }
}
