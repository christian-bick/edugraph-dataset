import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {AffineExpression, AlgebraExpressionEquivalenceProblem, AlgebraicScalar, ArithmeticOperation,
    CommonAffineDomain, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {buildAlgebraExpressionEquivalenceProblem, type AffineRewriteDescriptor} from '../algebra-equivalence-helpers.ts';
import {AlgebraExpressionEquivalenceGeneratorSchema, type AlgebraExpressionEquivalenceGeneratorConfig} from './spec.ts';

const generatorId = 'algebra-expression-equivalence';
const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const scalar = (nonzero = false): AlgebraicScalar => {
    const numerator = integer(nonzero ? 1 : 0, 6) * (random() < 0.5 ? -1 : 1);
    return makeSignedRational(numerator, integer(1, 3));
};
const q = (value: number): AlgebraicScalar => makeSignedRational(value, 1);
const product = (a: AlgebraicScalar, b: AlgebraicScalar): AlgebraicScalar => makeSignedRational(a.numerator * b.numerator, a.denominator * b.denominator);
const sum = (a: AlgebraicScalar, b: AlgebraicScalar): AlgebraicScalar => makeSignedRational(a.numerator * b.denominator + b.numerator * a.denominator, a.denominator * b.denominator);
const number = (id: string, value: AlgebraicScalar): Node => ({id, kind: 'number', value,
    notation: value.denominator === 1 ? {kind: 'integer', numeral: String(value.numerator)} : {kind: 'fraction', ...value}});
const variable = (id: string, symbolId = 'x'): Node => ({id, kind: 'variable', symbolId});
const group = (id: string, expression: Node): Node => ({id, kind: 'group', expression});
const binary = (id: string, operation: ArithmeticOperation, left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const term = (id: string, coefficient: AlgebraicScalar, atom: Node): Node => binary(id, 'multiplication', number(`${id}-coefficient`, coefficient), atom);
const declaration = (symbolId: string): CommonAffineDomain['symbols'][number] => ({symbolId, symbol: symbolId,
    domain: {kind: 'rational', lower: null, upper: null, excludedValues: []}});
const domain = (names: readonly [string, ...string[]]): CommonAffineDomain => ({domainId: 'independent-rationals', kind: 'independent-rational-variables',
    symbols: [declaration(names[0]), ...names.slice(1).map(declaration)]});
type MathematicalIdentity = {source: Node; rewritten: Node; symbols: readonly [string, ...string[]]; descriptor: Pick<AffineRewriteDescriptor, 'kind'> &
    {direction?: 'factored-to-expanded' | 'expanded-to-factored' | 'left-to-right' | 'right-to-left'}};

function distribution(): MathematicalIdentity {
    const k = scalar(true), a = scalar(true), b = scalar(true), x = variable('x-atom'), y = variable('y-atom', 'y');
    const factored = binary('factored-product', 'multiplication', number('scalar', k), group('linear-group', binary('linear-sum', 'addition',
        term('first-term', a, x), term('second-term', b, y))));
    const expanded = binary('expanded-sum', 'addition', term('first-expanded', product(k, a), x), term('second-expanded', product(k, b), y));
    const expanding = random() < 0.5;
    return {source: expanding ? factored : expanded, rewritten: expanding ? expanded : factored, symbols: ['x', 'y'],
        descriptor: {kind: 'distribution', direction: expanding ? 'factored-to-expanded' : 'expanded-to-factored'}};
}

function collection(): MathematicalIdentity {
    const scenario = integer(0, 3), count = integer(2, 4);
    const coefficients = scenario === 0 ? Array.from({length: count}, () => q(1))
        : scenario === 1 ? [q(3), q(-3)] : Array.from({length: count}, () => scalar());
    const terms = coefficients.map((coefficient, index): Node => scenario === 0 ? variable(`y-${index}`, 'y')
        : term(`term-${index}`, coefficient, variable(`y-${index}`, 'y')));
    const before = terms.slice(1).reduce((left, right, index) => binary(`sum-${index}`, 'addition', left, right), terms[0]);
    const coefficient = coefficients.reduce(sum, q(0));
    const after = coefficient.numerator === 0 ? number('collected-zero', q(0)) : term('collected-term', coefficient, variable('y-0', 'y'));
    return {source: before, rewritten: after, symbols: ['y'], descriptor: {kind: 'collection'}};
}

function association(): MathematicalIdentity {
    const multiplication = random() < 0.5, operation = multiplication ? 'multiplication' : 'addition';
    const first = multiplication ? number('first', scalar(true)) : variable('x-atom');
    const second = number('middle', scalar(true)), third = multiplication ? variable('x-atom') : variable('y-atom', 'y');
    const left = binary('left-root', operation, group('left-group', binary('left-inner', operation, first, second)), third);
    const right = binary('right-root', operation, first, group('right-group', binary('right-inner', operation, second, third)));
    const forward = random() < 0.5;
    return {source: forward ? left : right, rewritten: forward ? right : left, symbols: multiplication ? ['x'] : ['x', 'y'],
        descriptor: {kind: 'association', direction: forward ? 'left-to-right' : 'right-to-left'}};
}

function commutation(): MathematicalIdentity {
    const multiplication = random() < 0.5, operation = multiplication ? 'multiplication' : 'addition';
    const first = multiplication ? number('first', scalar(true)) : term('first-term', scalar(true), variable('x-atom'));
    const second = multiplication ? group('second-group', binary('inside', 'addition', variable('x-atom'), number('offset', scalar())))
        : term('second-term', scalar(true), variable('y-atom', 'y'));
    return {source: binary('source-root', operation, first, second), rewritten: binary('rewritten-root', operation, second, first),
        symbols: multiplication ? ['x'] : ['x', 'y'], descriptor: {kind: 'commutation'}};
}

function normalization(): MathematicalIdentity {
    const a = scalar(), b = scalar();
    const source = binary('source-sum', 'addition', binary('source-product', 'multiplication', number('multiplier', a),
        group('source-group', binary('source-inner', 'addition', variable('first-x'), number('offset', b)))), variable('second-x'));
    const rewritten = binary('rewritten-sum', 'addition', term('rewritten-term', sum(a, q(1)), variable('first-x')), number('rewritten-constant', product(a, b)));
    return {source, rewritten, symbols: ['x'], descriptor: {kind: 'coefficient-normalization'}};
}

export class AlgebraExpressionEquivalenceGenerator implements ProblemGenerator<AlgebraExpressionEquivalenceProblem, AlgebraExpressionEquivalenceGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = AlgebraExpressionEquivalenceGeneratorSchema;

    generate(config: AlgebraExpressionEquivalenceGeneratorConfig): ProblemStub<AlgebraExpressionEquivalenceProblem> {
        validateConfigFields(generatorId, config, ['relation']);
        if (!config.relation || !['distribution', 'collection', 'association', 'commutation', 'normalization'].includes(config.relation)) {
            throw new GeneratorValidationError(generatorId, 'Choose an actual affine expression identity relation.');
        }
        const identity = config.relation === 'distribution' ? distribution() : config.relation === 'collection' ? collection()
            : config.relation === 'association' ? association() : config.relation === 'commutation' ? commutation() : normalization();
        const common = domain(identity.symbols);
        const source: AffineExpression = {expressionId: 'source', domainId: common.domainId, root: identity.source};
        const rewritten: AffineExpression = {expressionId: 'rewritten', domainId: common.domainId, root: identity.rewritten};
        const expressions: [AffineExpression, AffineExpression, ...AffineExpression[]] = [source, rewritten];
        const invalidCandidate = random() < 0.5;
        if (invalidCandidate) expressions.push({expressionId: 'candidate', domainId: common.domainId,
            root: binary('candidate-root', 'addition', structuredClone(identity.rewritten), random() < 0.5
                ? number('candidate-shift', q(1)) : variable('candidate-shift', identity.symbols[0]))});
        const descriptor = {...identity.descriptor, beforeExpressionId: source.expressionId, afterExpressionId: rewritten.expressionId,
            beforeSubtreeId: identity.source.id, afterSubtreeId: identity.rewritten.id} as AffineRewriteDescriptor;
        return {data: buildAlgebraExpressionEquivalenceProblem({domain: common, expressions, sourceExpressionId: source.expressionId,
            equivalentExpressionId: rewritten.expressionId, rewriteSteps: [descriptor], candidateExpressionId: invalidCandidate ? 'candidate' : rewritten.expressionId})};
    }
}
