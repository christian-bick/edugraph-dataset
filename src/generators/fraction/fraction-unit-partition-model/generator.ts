import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionUnitPartitionProblem} from '../../../types/problems.ts';
import {buildUnitPartitionProblem, unitSharingPairs, unitSharingProfileValues} from '../fraction-unit-sharing-domain.ts';
import {FractionUnitPartitionModelGeneratorSchema, type FractionUnitPartitionModelGeneratorConfig} from './spec.ts';

export class FractionUnitPartitionModelGenerator implements ProblemGenerator<FractionUnitPartitionProblem, FractionUnitPartitionModelGeneratorConfig> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionUnitPartitionModelGeneratorSchema;
    generate(config: FractionUnitPartitionModelGeneratorConfig): ProblemStub<FractionUnitPartitionProblem> {
        validateConfigFields('fraction-unit-partition-model', config, ['relationProfile', 'range']);
        if (!unitSharingProfileValues.includes(config.relationProfile!))
            throw new GeneratorValidationError('fraction-unit-partition-model', 'Choose a supported unit-dividend relation.');
        const pairs = unitSharingPairs('partition', config.range!);
        const [b, n] = pairs[Math.floor(random() * pairs.length)]!;
        return {data: buildUnitPartitionProblem(b, n, config.relationProfile!, random() < 0.5 ? 'ribbon' : 'rope')};
    }
}
