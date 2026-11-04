import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {UnitEquivalenceSequenceProblem} from '../../../types/problems.ts';
import {random} from '../../../lib/random.ts';
import {buildUnitEquivalenceSequenceAt, measurementConversionPairSeeds} from '../helpers.ts';
import {selectUnitEquivalenceStart, unitEquivalenceStarts} from '../unit-equivalence-domain.ts';
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
        validateConfigFields('measurement-unit-equivalences', config, ['unitPair', 'range']);
        if (!Object.hasOwn(measurementConversionPairSeeds, config.unitPair!)) {
            throw new GeneratorValidationError(
                'measurement-unit-equivalences',
                `Unsupported unit pair "${config.unitPair}".`
            );
        }
        const pair = measurementConversionPairSeeds[config.unitPair!];
        const start = selectUnitEquivalenceStart(unitEquivalenceStarts('sequence', config.unitPair!, config.range!), random);
        return {data: buildUnitEquivalenceSequenceAt({...pair}, start)};
    }
}
