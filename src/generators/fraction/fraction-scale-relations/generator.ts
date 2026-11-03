import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionScaleRelationProblem} from '../../../types/problems.ts';
import {buildFractionScaleRelation, fractionScaleDomain, selectFractionScaleFrame} from '../fraction-scale-domain.ts';
import {FractionScaleRelationsGeneratorSchema} from './spec.ts';
import type {FractionScaleRelationsGeneratorConfig} from './spec.ts';

export class FractionScaleRelationsGenerator implements ProblemGenerator<FractionScaleRelationProblem, FractionScaleRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionScaleRelationsGeneratorSchema;

    generate(config: FractionScaleRelationsGeneratorConfig): ProblemStub<FractionScaleRelationProblem> {
        validateConfigFields('fraction-scale-relations', config, ['comparisonProfile', 'range']);
        switch (config.comparisonProfile) {
            case 'greater':
            case 'less':
            case 'equal':
                return {data: buildFractionScaleRelation(selectFractionScaleFrame(
                    fractionScaleDomain('comparison', config.comparisonProfile, config.range!),
                    config.comparisonProfile, random), config.comparisonProfile)};
            default:
                throw new GeneratorValidationError('fraction-scale-relations', 'Unsupported comparison profile.');
        }
    }
}
