import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {IntegerRoundingProblem} from '../../../types/problems.ts';
import {IntegerRoundingGeneratorConfig, IntegerRoundingGeneratorSchema, spec} from './spec.ts';
import {roundingPlaces} from './endpoint-profile.ts';
import {roundingDomain, roundingFrame} from './domain.ts';

export class IntegerRoundingGenerator implements ProblemGenerator<IntegerRoundingProblem, IntegerRoundingGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = IntegerRoundingGeneratorSchema;
    readonly spec = spec;

    generate(config: IntegerRoundingGeneratorConfig): ProblemStub<IntegerRoundingProblem> | null {
        validateConfigFields('integer-rounding', config, ['range', 'roundingMagnitude', 'zeroEndpoint']);
        const place = roundingPlaces.find(([label]) => label === config.roundingMagnitude)?.[1];
        if (!place) return null;
        const domain = roundingDomain(place, config.zeroEndpoint!, config.range!);
        return domain.count ? {data: roundingFrame(domain, random() * domain.weight)} : null;
    }
}
