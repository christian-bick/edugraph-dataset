import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {AlgebraicInequalityProblem, AlgebraicNotation, AlgebraicScalar, StatementAmbientDomain, StatementCandidate} from '../../../types/problems.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {makeSignedRationalAxis} from '../../number/signed-rational-axis-helpers.ts';
import {makeCoordinateNotation} from '../../coordinate/coordinate-helpers.ts';
import {buildAlgebraicInequalityProblem} from '../algebra-statement-helpers.ts';
import {AlgebraInequalitiesGeneratorSchema, type AlgebraInequalitiesGeneratorConfig} from './spec.ts';

const generatorId = 'algebra-inequalities';
const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const q = (n: number, d = 1): AlgebraicScalar => makeSignedRational(n, d);
const notation = (value: AlgebraicScalar): AlgebraicNotation => {
    const form = integer(0, 2);
    return form === 0 && value.denominator === 1 ? makeCoordinateNotation(value, 'integer')
        : form === 1 ? makeCoordinateNotation(value, 'decimal', 2) : {kind: 'fraction', numerator: value.numerator * 2, denominator: value.denominator * 2};
};

export class AlgebraInequalitiesGenerator implements ProblemGenerator<AlgebraicInequalityProblem, AlgebraInequalitiesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = AlgebraInequalitiesGeneratorSchema;

    generate(config: AlgebraInequalitiesGeneratorConfig): ProblemStub<AlgebraicInequalityProblem> {
        validateConfigFields(generatorId, config, ['relation', 'direction']);
        if (!config.relation || !['instantiated-predicate', 'finite-extension', 'rational-half-line', 'quantitative-threshold'].includes(config.relation)
            || !config.direction || !['less', 'greater'].includes(config.direction)) throw new GeneratorValidationError(generatorId, 'Choose an actual strict predicate/domain family and direction.');
        const quantitative = config.relation === 'quantitative-threshold', denominator = [1, 2, 4][integer(0, 2)]!;
        const boundaryTick = integer(quantitative ? 1 : -2, quantitative ? 3 : 2), value = q(boundaryTick, denominator), boundaryNotation = notation(value);
        const axis = makeSignedRationalAxis(q(1, denominator), quantitative ? 0 : -5, 5);
        const offsets = config.relation === 'finite-extension' ? [[-3, -2, -1], [1, 2, 3], [-2, -1, 0, 1, 2]][integer(0, 2)]! : [-1, 0, 1];
        const values = offsets.map(offset => q(boundaryTick + offset, denominator));
        const candidates = values.map((candidate, index): StatementCandidate => ({id: `candidate-${index}`, value: candidate, notation: notation(candidate)}));
        const candidateUniverse: readonly [StatementCandidate, ...StatementCandidate[]] = [candidates[0]!, ...candidates.slice(1)];
        const given = candidates[integer(0, candidates.length - 1)]!;
        const ambientDomain: StatementAmbientDomain = config.relation === 'finite-extension' ? {kind: 'finite', values: [values[0]!, ...values.slice(1)]}
            : {kind: 'numeric', values: {kind: 'rational', lower: quantitative ? {value: q(0), inclusive: true}
                : config.relation === 'instantiated-predicate' ? {value: q(boundaryTick - 2, denominator), inclusive: true} : null,
            upper: config.relation === 'instantiated-predicate' ? {value: q(boundaryTick + 2, denominator), inclusive: true} : null, excludedValues: []}};
        const variable = {symbolId: 'x', symbol: 'x'} as const;
        return {data: buildAlgebraicInequalityProblem({variable, ambientDomain,
            statement: {operator: config.direction, left: {id: 'variable-x', kind: 'variable', symbolId: variable.symbolId},
                right: {id: 'threshold', kind: 'number', value, notation: boundaryNotation}},
            candidateUniverse, assignment: {symbolId: variable.symbolId, value: given.value, notation: given.notation}, axis,
            context: {kind: 'strict-threshold', context: {kind: 'balance', reference: 'settled-balance', unit: 'dollars'}, quantityId: 'net-balance',
                threshold: {quantityId: 'threshold', value, notation: boundaryNotation},
                relationship: config.direction === 'less' ? 'strictly-below-threshold' : 'strictly-above-threshold'}})};
    }
}
