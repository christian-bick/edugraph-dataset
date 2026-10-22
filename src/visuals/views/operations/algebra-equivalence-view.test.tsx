import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {isAlgebraExpressionEquivalenceProblem} from '../../../generators/algebra/algebra-equivalence-helpers.ts';
import type {AlgebraExpressionEquivalenceProblem as Problem} from '../../../types/problems.ts';
import {AlgebraEquivalenceGenerateBody, AlgebraEquivalenceJudgeBody} from './algebra-equivalence-view.tsx';
import {buildEquivalenceViewFixture, equivalenceAssociationOracle, equivalenceBinary as binary, equivalenceCommutationOracle, equivalenceDistributionOracle, equivalenceFalseOracle, equivalenceNumber as number, equivalenceRetainedNotationOracle, equivalenceSignedCancellationOracle, equivalenceTrueOracle, equivalenceVariable as variable} from './algebra-equivalence-fixtures.ts';

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const generate = (data: Problem, solution: boolean) => renderToStaticMarkup(<AlgebraEquivalenceGenerateBody data={data} isSolutionView={solution} />);
const judge = (data: Problem, solution: boolean) => renderToStaticMarkup(<AlgebraEquivalenceJudgeBody data={data} isSolutionView={solution} />);

describe('same-source affine identity and candidate evidence', () => {
    it('accepts independent full true/false literal proofs, including a literal numeric counterexample side', () => {
        expect(isAlgebraExpressionEquivalenceProblem(equivalenceTrueOracle)).toBe(true);
        expect(isAlgebraExpressionEquivalenceProblem(equivalenceFalseOracle)).toBe(true);
        const comparison = equivalenceFalseOracle.comparison;
        expect(comparison.kind).toBe('not-equivalent');
        if (comparison.kind !== 'not-equivalent') throw new Error('Expected false oracle');
        expect(comparison.counterexample.left.calculation.finalValue).toEqual({numerator: 2, denominator: 1});
        expect(comparison.counterexample.right.calculation.reductions).toEqual([]);
        expect(comparison.counterexample.right.calculation.finalValue).toEqual({numerator: 1, denominator: 1});
    });
    it('keeps the valid rewrite unchanged when the same source has a false comparison candidate', () => {
        expect(equivalenceFalseOracle.validIdentity).toEqual(equivalenceTrueOracle.validIdentity);
        for (const solution of [false, true]) expect(generate(equivalenceFalseOracle, solution)).toBe(generate(equivalenceTrueOracle, solution));
        const solution = text(generate(equivalenceFalseOracle, true));
        expect(solution).toContain('x + x = 2 × x');
        expect(solution).toContain('1 + 1 = 2');
        expect(solution).toContain('Collected coefficient: 2');
        expect(solution).not.toContain('not equivalent');
    });
    it('withholds the generated expression, coefficient totals and proof in Question Mode', () => {
        const question = generate(equivalenceFalseOracle, false);
        expect(text(question)).toContain('x + x');
        expect(text(question)).toContain('Combine the like terms');
        expect(question).not.toMatch(/affine-normal-form|affine-rewrite-step|equivalence-generated-answer|equivalence-candidate|equivalence-verdict|counterexample|emerald/);
        expect(text(question)).not.toContain('2 × x');
        expect(text(question)).not.toContain('1 + 1 = 2');
    });
    it('shows only genuine original variable-atom coefficient1 premises when source syntax has no digits', () => {
        for (const render of [generate, judge]) {
            const question = render(equivalenceFalseOracle, false);
            expect(question.match(/A bare variable atom/g)).toHaveLength(1);
            expect(text(question)).toContain('A bare variable atom x denotes 1 × x');
            expect(text(question)).not.toMatch(/Coefficient of x:|Constant:|Collected coefficient:/);
        }
        const cancellation = equivalenceSignedCancellationOracle();
        expect(text(generate(cancellation, false))).toContain('- x + x');
        expect(text(generate(cancellation, false))).toContain('bare variable atom x denotes 1 × x');
        expect(text(generate(cancellation, false))).not.toContain('term has coefficient 1');
    });
    it('presents both comparison expressions but withholds verdict, rewrite and counterexample in judgment Q', () => {
        const question = judge(equivalenceFalseOracle, false);
        expect(text(question)).toContain('Expression A x + x Expression B x');
        expect(question).not.toMatch(/equivalence-verdict|universal-affine-proof|affine-normal-form|affine-rewrite-step|counterexample|emerald/);
        expect(text(question)).not.toContain('not equivalent');
        expect(text(question)).not.toContain('2 × x');
        expect(text(question)).not.toContain('x = 1');
        expect(text(judge(equivalenceTrueOracle, false))).toContain('Expression B 2 × x');
    });
    it('proves a true verdict universally using complete exact coefficient maps rather than sampled agreement', () => {
        const solution = judge(equivalenceTrueOracle, true);
        expect(text(solution)).toContain('The expressions are equivalent');
        expect(solution.match(/data-role="affine-normal-form"/g)).toHaveLength(2);
        expect(text(solution)).toContain('Coefficient of x : 2');
        expect(text(solution)).toContain('same value for every assignment in the common rational domain');
        expect(solution).not.toContain('affine-coefficient-calculations');
        expect(solution).not.toContain('counterexample-calculation');
    });
    it('disproves the false candidate using its exact admissible binding and every stored numeric snapshot', () => {
        const solution = judge(equivalenceFalseOracle, true);
        expect(text(solution)).toContain('The expressions are not equivalent');
        expect(text(solution)).toContain('x = 1');
        expect(solution.match(/data-role="counterexample-calculation"/g)).toHaveLength(2);
        expect(text(solution)).toContain('Expression A after substitution 1 + 1 Step 1 2 Value: 2');
        expect(text(solution)).toContain('Expression B after substitution 1 Value: 1');
        expect(text(solution)).toContain('2 is not equal to 1');
        expect(solution).not.toContain('affine-rewrite-step');
    });
    it('does not mistake agreement at0 for a universal identity', () => {
        const x = variable('x');
        const source = binary('source', 'addition', binary('twice', 'multiplication', number('two', 2), x), number('one', 1));
        const result = binary('result', 'addition', number('one', 1), binary('twice', 'multiplication', number('two', 2), x));
        const candidate = binary('candidate', 'addition', variable('candidate-x'), number('candidate-one', 1));
        const data = buildEquivalenceViewFixture(source, result, {kind: 'commutation'}, candidate);
        expect(data.comparison.kind).toBe('not-equivalent');
        expect(text(judge(data, true))).toContain('not equal');
        expect(judge(data, false)).not.toContain('equivalence-counterexample-bindings');
    });
});

describe('actual property and full affine syntax projection', () => {
    it('shows actual distribution coefficient products in both directions and withholds expanded/factored results in Q', () => {
        for (const reverse of [false, true]) {
            const data = equivalenceDistributionOracle(reverse), question = generate(data, false), solution = text(generate(data, true));
            expect(isAlgebraExpressionEquivalenceProblem(data)).toBe(true);
            expect(solution).toContain('3 × 2 = 6');
            expect(solution).toContain('3 × 1 = 3');
            expect(solution).toContain('6 × x + 3 × y');
            expect(solution).toContain('3 × ( 2 × x + 1 × y )');
            expect(text(question)).toContain(reverse ? 'extract a common multiplier' : 'expand the expression');
            expect(question).not.toContain('affine-rewrite-step');
            expect(text(question)).not.toContain(reverse ? '3 × ( 2 × x + 1 × y )' : '6 × x + 3 × y');
        }
    });
    it('shows genuine changed grouping with preserved operand order, and swapped full operand expressions', () => {
        const association = equivalenceAssociationOracle(), commutation = equivalenceCommutationOracle();
        expect(text(generate(association, true))).toContain('( x + 2 ) + y = x + ( 2 + y )');
        expect(text(generate(association, true))).toContain('operand order stays x , 2 , y');
        expect(text(generate(commutation, true))).toContain('2 × x + 3 × y = 3 × y + 2 × x');
        expect(text(generate(commutation, true))).toContain('operands 2 × x and 3 × y swap positions');
    });
    it('preserves cancellation to a constant while retaining the original variable domain and signed coefficients', () => {
        const data = equivalenceSignedCancellationOracle(), question = text(generate(data, false)), solution = text(generate(data, true));
        expect(isAlgebraExpressionEquivalenceProblem(data)).toBe(true);
        expect(question).toContain('x range independently over all rational numbers');
        expect(solution).toContain('Signed coefficients of the like x terms: -1, 1');
        expect(solution).toContain('(-1) + 1 = 0');
        expect(solution).toContain('All variable coefficients are 0');
        expect(judge(data, true)).toContain('equivalence-verdict');
    });
    it('preserves original unreduced fraction and retained decimal notation without an added coefficient legend', () => {
        const data = equivalenceRetainedNotationOracle(), question = generate(data, false), solution = generate(data, true);
        expect(isAlgebraExpressionEquivalenceProblem(data)).toBe(true);
        expect(question).toContain('data-literal-notation="2/4"');
        expect(question).toContain('data-literal-notation="0.500"');
        expect(question).not.toContain('original-atom-premises');
        expect(solution).toContain('data-literal-notation="1/2"');
        expect(solution).toContain('universal-affine-proof');
    });
});

let cores: readonly ComponentType<{config: object; payload: unknown}>[];
let definitions: typeof import('./algebra-equivalent-expression-generate/spec.ts')[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./algebra-equivalent-expression-generate/view.tsx'), import('./algebra-expression-equivalence-judge/view.tsx')]);
    cores = [modules[0].AlgebraEquivalentExpressionGenerateCore, modules[1].AlgebraExpressionEquivalenceJudgeCore] as unknown as typeof cores;
    definitions = await Promise.all([import('./algebra-equivalent-expression-generate/spec.ts'), import('./algebra-expression-equivalence-judge/spec.ts')]) as unknown as typeof definitions;
});
afterAll(() => vi.unstubAllGlobals());
const leaf = (index: number, data: unknown, solution: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], seed: 14, isSolutionView: solution}}));

describe('two full-uniform leaf contracts and fixed declarations', () => {
    it('accepts every true/false/specialized/constant-result fixture in both leaves and modes', () => {
        const fixtures = [equivalenceTrueOracle, equivalenceFalseOracle, equivalenceDistributionOracle(), equivalenceDistributionOracle(true), equivalenceAssociationOracle(), equivalenceCommutationOracle(), equivalenceSignedCancellationOracle(), equivalenceRetainedNotationOracle()];
        for (const data of fixtures) for (let index = 0; index < 2; index++) for (const solution of [false, true]) expect(leaf(index, data, solution)).not.toMatch(/NaN|undefined|null/);
    });
    it('rejects malformed domains, sparse proofs, changed source links and cycles through ViewValidationError', () => {
        const cycle: Record<string, unknown> = {id: 'cycle', kind: 'group'}; cycle.expression = cycle;
        const invalid = [undefined, {}, {...equivalenceTrueOracle, domain: {...equivalenceTrueOracle.domain, symbols: new Array(1)}},
            {...equivalenceTrueOracle, expressions: new Array(2)}, {...equivalenceTrueOracle, validIdentity: {...equivalenceTrueOracle.validIdentity, steps: new Array(1)}},
            {...equivalenceTrueOracle, comparison: {...equivalenceTrueOracle.comparison, sourceExpressionId: 'result'}},
            {...equivalenceTrueOracle, expressions: [{...equivalenceTrueOracle.expressions[0], root: cycle}, equivalenceTrueOracle.expressions[1]]},
            {...equivalenceTrueOracle, validIdentity: {...equivalenceTrueOracle.validIdentity, universalProof: {...equivalenceTrueOracle.validIdentity.universalProof, commonNormalForm: {constant: {numerator: 9, denominator: 1}, coefficients: []}}}}];
        for (const data of invalid) for (let index = 0; index < 2; index++) for (const solution of [false, true]) expect(() => leaf(index, data, solution)).toThrow('Validation Error');
    });
    it('keeps neutral questions, green completed work and stable response typography', () => {
        for (const render of [generate, judge]) for (const data of [equivalenceTrueOracle, equivalenceFalseOracle]) {
            expect(render(data, false)).not.toMatch(/emerald|[□→←]/);
            expect(render(data, true)).toContain('text-emerald-900');
        }
    });
    it('owns only the reviewed fixed ability and Arabic numerals, with no view parameters', () => {
        expect(definitions[0]!.spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.ProcedureExecution]);
        expect(definitions[1]!.spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.CorrectnessEvaluation]);
        for (const module of definitions) expect(Object.entries(module).find(([name]) => name.endsWith('ViewSchema'))![1]).toEqual({});
    });
    it('requires genuine letter-equivalence participation and bounds judge selected property evidence only', () => {
        const queries = (target: readonly string[], generator: readonly string[]) => ({has: (scope: string, label: string) => (scope === 'target' ? target : generator).includes(label), exact: (scope: string, label: string) => (scope === 'target' ? target : generator).includes(label)});
        const supports = (index: number, target: readonly string[], generator: readonly string[] = []) => definitions[index]!.spec.compatibility!.every(rule => rule.predicate(queries(target, generator)));
        const target = [Area.AlgebraicExpression, Area.AlgebraicEquivalence];
        for (let index = 0; index < 2; index++) {
            expect(supports(index, target)).toBe(true);
            expect(supports(index, [Area.ArithmeticExpression, Area.CommutativeLaw])).toBe(false);
            expect(supports(index, [Area.AlgebraicExpression])).toBe(false);
        }
        for (const property of [Area.DistributingLinearCombinations, Area.CollectingLinearTerms, Area.AssociativeLaw, Area.CommutativeLaw]) {
            expect(supports(0, target, [Area.AlgebraicExpression, property])).toBe(true);
            expect(supports(1, target, [Area.AlgebraicExpression, property])).toBe(false);
        }
        expect(supports(1, target, [Area.AlgebraicExpression, Area.AlgebraicEquivalence])).toBe(true);
    });
});
