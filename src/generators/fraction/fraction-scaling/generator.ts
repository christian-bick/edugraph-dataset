import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionScaleComparisonProblem} from '../../../types/problems.ts';
import {buildFractionScaleComparison, fractionScaleDomain, selectFractionScaleFrame} from '../fraction-scale-domain.ts';
import {FractionScalingGeneratorSchema} from './spec.ts';
import type {FractionScalingGeneratorConfig} from './spec.ts';

export class FractionScalingGenerator implements ProblemGenerator<
    FractionScaleComparisonProblem,
    FractionScalingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionScalingGeneratorSchema;

    generate(config: FractionScalingGeneratorConfig): ProblemStub<FractionScaleComparisonProblem> {
        validateConfigFields('fraction-scaling', config, ['comparisonProfile', 'range']);
        switch (config.comparisonProfile) {
            case 'greater':
            case 'less':
            case 'equal':
                return {data: buildFractionScaleComparison(selectFractionScaleFrame(
                    fractionScaleDomain('analogy', config.comparisonProfile, config.range!),
                    config.comparisonProfile, random), config.comparisonProfile)};
            default:
                throw new GeneratorValidationError('fraction-scaling',
                    'Unsupported comparison profile.');
        }
    }
}
