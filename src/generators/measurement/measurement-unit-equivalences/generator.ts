import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {UnitEquivalenceSequenceProblem} from '../../../types/problems.ts';
import {buildUnitEquivalenceSequence, measurementConversionPairSeeds} from '../helpers.ts';
import {
    MeasurementUnitEquivalencesGeneratorConfig,
    MeasurementUnitEquivalencesGeneratorSchema
} from './spec.ts';

export class MeasurementUnitEquivalencesGenerator implements ProblemGenerator<
    UnitEquivalenceSequenceProblem,
    MeasurementUnitEquivalencesGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementUnitEquivalencesGeneratorSchema;

    generate(
        config: MeasurementUnitEquivalencesGeneratorConfig
    ): ProblemStub<UnitEquivalenceSequenceProblem> {
        validateConfigFields('measurement-unit-equivalences', config, ['unitPair']);
        if (!Object.hasOwn(measurementConversionPairSeeds, config.unitPair!)) {
            throw new GeneratorValidationError(
                'measurement-unit-equivalences',
                `Unsupported unit pair "${config.unitPair}".`
            );
        }
        const pair = measurementConversionPairSeeds[config.unitPair!];
        return {data: buildUnitEquivalenceSequence({...pair})};
    }
}
