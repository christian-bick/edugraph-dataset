import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RationalOrderRelationProblem, SignedRationalAxis} from '../../../types/problems.ts';
import {compareSignedRationals, makeSignedRational} from '../signed-rational-helpers.ts';
import {makeSignedRationalAxis, makeSignedRationalLocation} from '../signed-rational-axis-helpers.ts';
import {RationalOrderRelationsGeneratorSchema, type RationalOrderRelationsGeneratorConfig} from './spec.ts';

const generatorId = 'rational-order-relations';

/** Preserve nominal operand order; the exact comparison is not a learner-task choice. */
export function buildRationalOrderRelationProblem(axis: SignedRationalAxis, firstTickIndex: number,
    secondTickIndex: number): RationalOrderRelationProblem {
    const first = makeSignedRationalLocation(axis, firstTickIndex);
    const second = makeSignedRationalLocation(axis, secondTickIndex);
    const comparison = compareSignedRationals(first.value, second.value);
    if (comparison === 0) throw new GeneratorValidationError(generatorId, 'Strict order requires two distinct values.');
    return {kind: 'rational-order-relations', axis, first, second, relation: comparison < 0 ? 'less' : 'greater'};
}

const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));

export class RationalOrderRelationsGenerator implements ProblemGenerator<RationalOrderRelationProblem, RationalOrderRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RationalOrderRelationsGeneratorSchema;

    generate(config: RationalOrderRelationsGeneratorConfig): ProblemStub<RationalOrderRelationProblem> {
        validateConfigFields(generatorId, config, ['relation']);
        if (config.relation !== 'less' && config.relation !== 'greater') {
            throw new GeneratorValidationError(generatorId, 'A strict less or greater relation is required.');
        }
        const radius = integer(2, 5);
        const axis = makeSignedRationalAxis(makeSignedRational(1, integer(1, 4)), -radius, radius);
        const lowerIndex = integer(0, axis.ticks.length - 2);
        const upperIndex = integer(lowerIndex + 1, axis.ticks.length - 1);
        const [first, second] = config.relation === 'less' ? [lowerIndex, upperIndex] : [upperIndex, lowerIndex];
        return {data: buildRationalOrderRelationProblem(axis, first!, second!)};
    }
}
