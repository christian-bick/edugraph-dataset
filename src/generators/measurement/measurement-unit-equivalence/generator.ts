import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {UnitEquivalenceProblem} from '../../../types/problems.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {buildSingleUnitEquivalence, selectUnitEquivalenceStart, unitEquivalenceStarts} from '../unit-equivalence-domain.ts';
import {MeasurementUnitEquivalenceGeneratorSchema} from './spec.ts';
import type {MeasurementUnitEquivalenceGeneratorConfig} from './spec.ts';

export class MeasurementUnitEquivalenceGenerator implements ProblemGenerator<UnitEquivalenceProblem, MeasurementUnitEquivalenceGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementUnitEquivalenceGeneratorSchema;

    generate(config: MeasurementUnitEquivalenceGeneratorConfig): ProblemStub<UnitEquivalenceProblem> {
        validateConfigFields('measurement-unit-equivalence', config, ['unitPair', 'range']);
        if (!Object.hasOwn(measurementConversionPairSeeds, config.unitPair!))
            throw new GeneratorValidationError('measurement-unit-equivalence', `Unsupported unit pair "${config.unitPair}".`);
        const start = selectUnitEquivalenceStart(unitEquivalenceStarts('single', config.unitPair!, config.range!), random);
        return {data: buildSingleUnitEquivalence({...measurementConversionPairSeeds[config.unitPair!]}, start)};
    }
}
