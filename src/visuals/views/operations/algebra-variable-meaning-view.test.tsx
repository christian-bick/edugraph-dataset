import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area} from 'edugraph-ts';
import {isAlgebraVariableMeaningProblem} from '../../../generators/algebra/algebra-variable-meaning-helpers.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {AlgebraVariableMeaningProblem as Problem, ExactSymbolicExpressionNode as Node, VariableMeaningDomain} from '../../../types/problems.ts';
import {AlgebraVariableMeaningBody} from './algebra-variable-meaning-view.tsx';
import {variableMeaningBinary as binary, variableMeaningFixture as fixture, variableMeaningNumber as number, variableMeaningParticularOracle as particular, variableMeaningUniversalOracle as universal, variableMeaningValue as q, variableMeaningVariable as variable} from './algebra-variable-meaning-fixtures.ts';
import {AlgebraVariableInterpretationViewSchema, spec} from './algebra-variable-interpretation/spec.ts';

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replaceAll('&#x27;', "'").replace(/\s+/g, ' ').trim();
const render = (data: Problem, isSolutionView: boolean) => renderToStaticMarkup(<AlgebraVariableMeaningBody data={data} isSolutionView={isSolutionView} />);
const unknown = (total: number, domain: VariableMeaningDomain['name'] = 'rational-numbers') => fixture('particular-unknown', domain, 'number', binary('sum', 'addition', variable('x'), number('three', 3)), number('total', total));
const identity = (domain: VariableMeaningDomain['name']) => fixture('arbitrary-generalized-number', domain, 'number', variable('left-x'), variable('right-x'));
const length = fixture('particular-unknown', 'nonnegative-rational-numbers', 'length', binary('sum', 'addition', variable('x'), number('offset', 3, 4)), number('total', 17, 4));
const zeroCount = fixture('particular-unknown', 'nonnegative-integers', 'count', binary('sum', 'addition', variable('x'), number('three', 3)), number('total', 3));
const domainNames: readonly VariableMeaningDomain['name'][] = ['rational-numbers', 'integers', 'nonnegative-rational-numbers', 'nonnegative-integers'];

describe('fixed variable-role interpretation', () => {
    it('accepts independently authored complete unique-value and universal coefficient witnesses', () => {
        expect(isAlgebraVariableMeaningProblem(particular)).toBe(true);
        expect(isAlgebraVariableMeaningProblem(universal)).toBe(true);
        expect(particular.role.kind === 'particular-unknown' && particular.role.uniqueValueWitness.uniqueValue).toEqual(q(7));
        expect(universal.role.kind === 'arbitrary-generalized-number' && universal.role.universalProof.commonNormalForm).toEqual({constant: q(0), coefficients: [{symbolId: 'n', coefficient: q(2)}]});
    });
    it('gives one fixed count condition in Q without naming the requested role or exposing its root/proof', () => {
        const question = render(particular, false);
        expect(text(question)).toContain('one fixed bag of tokens');
        expect(text(question)).toContain('Allowed domain: nonnegative integers');
        expect(text(question)).toContain('n + 3 = 10');
        expect(question).toContain('variable-meaning-response');
        expect(question).not.toMatch(/unknown|generalized|arbitrary|unique-value|verification|Normalization|coefficient|emerald/);
        expect(text(question)).not.toContain('7');
    });
    it('explains the particular role with the exact stored value and meaningful count unit in green', () => {
        const solution = render(particular, true);
        expect(text(solution)).toContain('one particular unknown value for this fixed situation');
        expect(text(solution)).toContain('n = 7 tokens');
        expect(text(solution)).toContain('satisfies the original condition');
        expect(solution).toContain('text-emerald-900');
        expect(solution).not.toContain('variable-meaning-response');
    });
    it('uses the quantified relation as a given while leaving generalized interpretation unresolved in Q', () => {
        const question = render(universal, false), solution = text(render(universal, true));
        expect(text(question)).toContain('bags with any admissible token count');
        expect(text(question)).toContain('relation holds for every n in the stated domain');
        expect(text(question)).toContain('n + n = 2 × n');
        expect(question).not.toMatch(/generalized|arbitrary|variable-meaning-answer|universal-proof|normal-form|emerald/);
        expect(solution).toContain('arbitrary member of the nonnegative integers: a generalized number');
        expect(solution).toContain('valid for every member of that domain');
        expect(render(universal, true)).not.toMatch(/coefficient|substitution|binding|verification/);
    });
    it('keeps a zero count particular, and interprets a fractional segment length without narrowing to integers', () => {
        expect(text(render(zeroCount, true))).toContain('x = 0 tokens');
        expect(text(render(zeroCount, true))).toContain('one particular unknown value');
        const question = render(length, false), solution = text(render(length, true));
        expect(text(question)).toContain('one fixed segment');
        expect(text(question)).toContain('segment length measured in meters');
        expect(text(question)).toContain('nonnegative rational numbers');
        expect(text(question)).not.toContain('7/2');
        expect(solution).toContain('x = 7/2 meters');
    });
    it('accepts variables on both original sides with a negative rational root and no invented physical unit', () => {
        const data = fixture('particular-unknown', 'rational-numbers', 'number', binary('left', 'addition', binary('twice', 'multiplication', number('two', 2), variable('first-x')), number('one', 1)), binary('right', 'subtraction', variable('second-x'), number('offset', 2)));
        expect(data.role.kind === 'particular-unknown' && data.role.uniqueValueWitness.uniqueValue).toEqual(q(-3));
        expect(text(render(data, true))).toContain('x = -3.');
        expect(render(data, false)).not.toContain('>-3<');
        expect(render(data, true)).not.toMatch(/meters|tokens|independent|dependent|function/);
    });
    it('preserves literal unreduced fractions, retained decimal zeros and real operand groups', () => {
        const half: Node = {id: 'half', kind: 'number', value: q(1, 2), notation: {kind: 'fraction', numerator: 2, denominator: 4}};
        const decimal: Node = {id: 'decimal', kind: 'number', value: q(1, 2), notation: {kind: 'decimal', coefficient: 500, scale: 3, numeral: '0.500'}};
        const data = fixture('arbitrary-generalized-number', 'rational-numbers', 'number', binary('left', 'addition', variable('left-x'), half), binary('right', 'addition', decimal, variable('right-x')));
        for (const mode of [false, true]) {
            expect(render(data, mode)).toContain('data-literal-notation="2/4"');
            expect(render(data, mode)).toContain('data-literal-notation="0.500"');
        }
        const group: Node = {id: 'group', kind: 'group', expression: binary('inner', 'addition', variable('inside-x'), number('one', 1))};
        const grouped = fixture('arbitrary-generalized-number', 'integers', 'number', binary('left', 'addition', variable('outside-x'), group), binary('right', 'addition', binary('twice', 'multiplication', number('two', 2), variable('right-x')), number('last-one', 1)));
        expect(text(render(grouped, false))).toContain('x + ( x + 1 ) = 2 × x + 1');
    });
    it('accepts every infinite named domain, a bare all-variable identity and canceled variable terms', () => {
        for (const name of domainNames) for (const data of [identity(name), unknown(10, name)]) {
            expect(isAlgebraVariableMeaningProblem(data)).toBe(true);
            for (const mode of [false, true]) expect(render(data, mode)).not.toMatch(/NaN|undefined|null|□/);
        }
        const bare = render(identity('integers'), false);
        expect(text(bare)).toContain('x = x');
        expect(bare).not.toMatch(/coefficient|legend|data-literal-notation/);
        const canceled = fixture('arbitrary-generalized-number', 'rational-numbers', 'number', binary('difference', 'subtraction', variable('one-x'), variable('other-x')), number('zero', 0));
        expect(text(render(canceled, true))).toContain('arbitrary member of the rational numbers');
        expect(text(render(unknown(100003), true))).toContain('x = 100000');
    });
    it('retains one identical requested interpretation for both mathematical roles', () => {
        const prompt = 'Explain what the letter represents, how its domain applies, and how the relation uses it.';
        for (const data of [particular, universal]) for (const mode of [false, true]) expect(text(render(data, mode))).toContain(prompt);
    });
});

let Core: typeof import('./algebra-variable-interpretation/view.tsx').AlgebraVariableInterpretationCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./algebra-variable-interpretation/view.tsx')).AlgebraVariableInterpretationCore;
});
afterAll(() => vi.unstubAllGlobals());
const leaf = (data: unknown, solution: boolean) => renderToStaticMarkup(<Core config={{}} payload={{problem: {type: 'arithmetic', data, labels: []}, seed: 17, isSolutionView: solution} as unknown as ViewRenderPayload<'algebra-variable-interpretation'>} />);

describe('complete leaf validation and capability boundary', () => {
    it('renders all role/domain/quantity members through the one strict leaf in both modes', () => {
        const generalizedLength = fixture('arbitrary-generalized-number', 'nonnegative-rational-numbers', 'length', variable('left-x'), variable('right-x'));
        for (const data of [particular, universal, zeroCount, length, generalizedLength, ...domainNames.flatMap(name => [identity(name), unknown(10, name)])]) for (const solution of [false, true]) {
            expect(leaf(data, solution)).toContain('Interpret the letter');
            expect(leaf(data, solution)).not.toMatch(/NaN|undefined|null/);
        }
    });
    it('rejects malformed required fields, sparse proofs, cycles and forged role evidence through ViewValidationError', () => {
        const cycle: Record<string, unknown> = {id: 'cycle', kind: 'group'}; cycle.expression = cycle;
        const role = particular.role;
        if (role.kind !== 'particular-unknown') throw new Error('Independent oracle has the wrong role.');
        const universalRole = universal.role;
        if (universalRole.kind !== 'arbitrary-generalized-number') throw new Error('Independent universal oracle has the wrong role.');
        const invalid = [undefined, {}, {...particular, quantity: undefined}, {...particular, domain: {...particular.domain, name: 'integers'}},
            {...particular, expressions: new Array(2)}, {...particular, expressions: [{...particular.expressions[0], root: cycle}, particular.expressions[1]]},
            {...particular, relation: {leftExpressionId: 'right', rightExpressionId: 'left'}},
            {...particular, role: {...role, uniqueValueWitness: {...role.uniqueValueWitness, uniqueValue: q(8)}}},
            {...particular, role: {...role, uniqueValueWitness: {...role.uniqueValueWitness, leftNormalization: {...role.uniqueValueWitness.leftNormalization, steps: new Array(3)}}}},
            {...universal, role: {...universalRole, universalProof: {...universalRole.universalProof, commonNormalForm: {constant: q(1), coefficients: []}}}}];
        for (const data of invalid) for (const solution of [false, true]) expect(() => leaf(data, solution)).toThrow('Validation Error');
    });
    it('owns only invariant Interpretation and requires an actual explicit role, without parameterizing either role', () => {
        expect(spec.generalLabels).toEqual([Ability.Interpretation]);
        expect(AlgebraVariableInterpretationViewSchema).toEqual({});
        const supports = (target: readonly string[]) => spec.compatibility!.every(rule => rule.predicate({has: (_scope, label) => target.includes(label), exact: (_scope, label) => target.includes(label)}));
        expect(supports([Area.UnknownVariable, Ability.Interpretation])).toBe(true);
        expect(supports([Area.GeneralizedVariable, Ability.Interpretation])).toBe(true);
        expect(supports([Area.AlgebraicExpression, Ability.Interpretation])).toBe(false);
        expect(supports([Ability.Interpretation])).toBe(false);
    });
});
