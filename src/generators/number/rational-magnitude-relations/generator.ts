import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RationalMagnitudeRelationProblem, SignedRationalAxis} from '../../../types/problems.ts';
import {makeSignedRational} from '../signed-rational-helpers.ts';
import {makeSignedRationalAxis, makeSignedRationalLocation} from '../signed-rational-axis-helpers.ts';
import {RationalMagnitudeRelationsGeneratorSchema, type RationalMagnitudeRelationsGeneratorConfig} from './spec.ts';

const generatorId = 'rational-magnitude-relations';

/** The zero-to-value length remains zero when the two supplied endpoints coincide. */
export function buildRationalMagnitudeRelationProblem(axis: SignedRationalAxis, tickIndex: number): RationalMagnitudeRelationProblem {
    const point = makeSignedRationalLocation(axis, tickIndex);
    return {kind: 'rational-magnitude-relations', axis, point,
        distance: {fromTickIndex: axis.zeroIndex, toTickIndex: point.tickIndex, length: {...point.magnitude}}};
}

const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));

export class RationalMagnitudeRelationsGenerator implements ProblemGenerator<RationalMagnitudeRelationProblem, RationalMagnitudeRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RationalMagnitudeRelationsGeneratorSchema;

    generate(config: RationalMagnitudeRelationsGeneratorConfig): ProblemStub<RationalMagnitudeRelationProblem> {
        validateConfigFields(generatorId, config, ['signDomain']);
        if (config.signDomain !== 'nonnegative' && config.signDomain !== 'signed') {
            throw new GeneratorValidationError(generatorId, 'A nonnegative or signed domain is required.');
        }
        const radius = integer(2, 5);
        const signed = config.signDomain === 'signed';
        const axis = makeSignedRationalAxis(makeSignedRational(1, integer(1, 4)), signed ? -radius : 0, radius);
        const tickIndex = signed ? integer(0, radius - 1) : integer(0, radius);
        return {data: buildRationalMagnitudeRelationProblem(axis, tickIndex)};
    }
}
