import {validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RatioRelationProblem} from '../../../types/problems.ts';
import {pick, randomInteger, rational, ratioQuantities, validateMagnitudeRange} from '../helpers.ts';
import {RatioRelationsGeneratorSchema, type RatioRelationsGeneratorConfig} from './spec.ts';

export class RatioRelationsGenerator implements ProblemGenerator<RatioRelationProblem, RatioRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RatioRelationsGeneratorSchema;

    generate(config: RatioRelationsGeneratorConfig): ProblemStub<RatioRelationProblem> {
        validateConfigFields('ratio-relations', config, ['range']);
        const maximum = validateMagnitudeRange('ratio-relations', config.range!);
        const [first, second] = pick(ratioQuantities);
        return {data: {
            kind: 'ratio-relation',
            antecedent: {...first, value: rational(randomInteger(1, maximum))},
            consequent: {...second, value: rational(randomInteger(1, maximum))}
        }};
    }
}
