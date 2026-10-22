import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RationalOrderContextProblem, SignedRational} from '../../../types/problems.ts';
import {buildOrderedContextPair, type OrderedContextKind, sampleOrderedContextPair} from '../ordered-context-helpers.ts';
import {RationalOrderContextsGeneratorSchema, type RationalOrderContextsGeneratorConfig} from './spec.ts';

const generatorId = 'rational-order-contexts';

export function buildRationalOrderContextProblem(context: OrderedContextKind, first: SignedRational, second: SignedRational): RationalOrderContextProblem {
    return {kind: 'rational-order-contexts', ...buildOrderedContextPair(context, first, second)};
}

export class RationalOrderContextsGenerator implements ProblemGenerator<RationalOrderContextProblem, RationalOrderContextsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RationalOrderContextsGeneratorSchema;

    generate(config: RationalOrderContextsGeneratorConfig): ProblemStub<RationalOrderContextProblem> {
        validateConfigFields(generatorId, config, ['relation']);
        if (config.relation !== 'less' && config.relation !== 'greater') {
            throw new GeneratorValidationError(generatorId, 'Relation must be less or greater.');
        }
        const pair = sampleOrderedContextPair('unrestricted');
        const swap = pair.relation !== config.relation;
        return {data: buildRationalOrderContextProblem(pair.context.kind,
            swap ? pair.second.value : pair.first.value, swap ? pair.first.value : pair.second.value)};
    }
}
