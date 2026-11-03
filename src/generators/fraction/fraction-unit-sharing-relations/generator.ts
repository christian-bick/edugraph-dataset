import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionUnitSharingProblem} from '../../../types/problems.ts';
import {buildUnitSharingProblem, unitSharingPairs, unitSharingProfileValues} from '../fraction-unit-sharing-domain.ts';
import {FractionUnitSharingRelationsGeneratorSchema, type FractionUnitSharingRelationsGeneratorConfig} from './spec.ts';

export class FractionUnitSharingRelationsGenerator implements ProblemGenerator<FractionUnitSharingProblem, FractionUnitSharingRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionUnitSharingRelationsGeneratorSchema;
    generate(config: FractionUnitSharingRelationsGeneratorConfig): ProblemStub<FractionUnitSharingProblem> {
        validateConfigFields('fraction-unit-sharing-relations', config, ['relationProfile', 'range']);
        if (!unitSharingProfileValues.includes(config.relationProfile!))
            throw new GeneratorValidationError('fraction-unit-sharing-relations', 'Choose a supported unit-dividend relation.');
        const pairs = unitSharingPairs('sharing', config.range!);
        const [b, n] = pairs[Math.floor(random() * pairs.length)]!;
        return {data: buildUnitSharingProblem(b, n, config.relationProfile!, random() < 0.5 ? 'ribbon' : 'rope')};
    }
}
