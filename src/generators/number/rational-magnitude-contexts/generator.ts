import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RationalMagnitudeContextProblem, SignedRational} from '../../../types/problems.ts';
import {buildOrderedContextPair, type OrderedContextKind, sampleOrderedContextPair} from '../ordered-context-helpers.ts';
import {compareSignedRationals} from '../signed-rational-helpers.ts';
import {RationalMagnitudeContextsGeneratorSchema, type RationalMagnitudeContextsGeneratorConfig} from './spec.ts';

const generatorId = 'rational-magnitude-contexts';

export function buildRationalMagnitudeContextProblem(context: OrderedContextKind, first: SignedRational, second: SignedRational): RationalMagnitudeContextProblem {
    const pair = buildOrderedContextPair(context, first, second);
    const comparison = compareSignedRationals(pair.first.magnitude, pair.second.magnitude);
    return {kind: 'rational-magnitude-contexts', context: pair.context, first: pair.first, second: pair.second,
        signedRelation: pair.relation, magnitudeRelation: comparison < 0 ? 'less' : comparison > 0 ? 'greater' : 'equal'};
}

export class RationalMagnitudeContextsGenerator implements ProblemGenerator<RationalMagnitudeContextProblem, RationalMagnitudeContextsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RationalMagnitudeContextsGeneratorSchema;

    generate(config: RationalMagnitudeContextsGeneratorConfig): ProblemStub<RationalMagnitudeContextProblem> {
        validateConfigFields(generatorId, config, ['signDomain']);
        if (config.signDomain !== 'nonnegative' && config.signDomain !== 'signed') {
            throw new GeneratorValidationError(generatorId, 'Sign domain must be nonnegative or signed.');
        }
        const pair = sampleOrderedContextPair(config.signDomain);
        return {data: buildRationalMagnitudeContextProblem(pair.context.kind, pair.first.value, pair.second.value)};
    }
}
