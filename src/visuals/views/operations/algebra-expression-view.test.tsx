import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {buildAlgebraicExpressionProblem, isAlgebraicExpressionProblem} from '../../../generators/algebra/algebra-expression-helpers.ts';
import type {AlgebraicExpressionProblem, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {AlgebraExpression} from './algebra-expression-format.tsx';
import {AlgebraExpressionEvaluationBody, AlgebraExpressionModelBody, AlgebraExpressionPartsBody, AlgebraExpressionWritingBody, AlgebraSubexpressionBody} from './algebra-expression-view.tsx';
import {algebraBinary, algebraCoefficientOracle, algebraDeclaration, algebraGroup, algebraNumber, algebraNumericFactorOracle, algebraOperationOracle, algebraPlainOracle, algebraPurchaseOracle, algebraRational, algebraRepeatedOracle, algebraRepeatedRoleOracle, algebraVariable} from './algebra-expression-fixtures.ts';

const text = (markup: string) => markup.replace(/<sup[^>]*>(.*?)<\/sup>/g, '^$1').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const writing = (data: AlgebraicExpressionProblem, solution: boolean) => renderToStaticMarkup(<AlgebraExpressionWritingBody data={data} isSolutionView={solution} />);
const parts = (data: AlgebraicExpressionProblem, solution: boolean) => renderToStaticMarkup(<AlgebraExpressionPartsBody data={data} isSolutionView={solution} />);
const grouped = (data: AlgebraicExpressionProblem, solution: boolean) => renderToStaticMarkup(<AlgebraSubexpressionBody data={data} isSolutionView={solution} />);
const evaluate = (data: AlgebraicExpressionProblem, solution: boolean, formula = false) => renderToStaticMarkup(<AlgebraExpressionEvaluationBody data={data} isSolutionView={solution} formula={formula} />);
const model = (data: AlgebraicExpressionProblem, solution: boolean) => renderToStaticMarkup(<AlgebraExpressionModelBody data={data} isSolutionView={solution} />);
const renderers = [writing, parts, grouped, (data: AlgebraicExpressionProblem, solution: boolean) => evaluate(data, solution), (data: AlgebraicExpressionProblem, solution: boolean) => evaluate(data, solution, true), model];

const source = (expression: Node, relation: 'additive-components' | 'coefficient') => buildAlgebraicExpressionProblem({expression, relation, symbols: [algebraDeclaration()],
    bindings: [{symbolId: 'x', value: algebraRational(3, 2), notation: {kind: 'fraction', numerator: 3, denominator: 2}}], structuralKind: 'symbolic',
    context: {kind: 'parameter-description', parameters: [{symbolId: 'x', meaning: 'number'}], resultMeaning: 'number'}});

describe('literal algebra math and structural projections', () => {
    it('validates hand-authored5-(y) and numeric2(8+7) payloads with independent exact answers', () => {
        expect(isAlgebraicExpressionProblem(algebraPlainOracle)).toBe(true);
        expect(isAlgebraicExpressionProblem(algebraNumericFactorOracle)).toBe(true);
        expect(text(evaluate(algebraPlainOracle, true))).toContain('Value: 7/2');
        expect(text(evaluate(algebraNumericFactorOracle, true))).toContain('Value: 30');
    });
    it('retains an actual numeric structural frame rather than showing the linked symbolic expression', () => {
        for (const solution of [false, true]) {
            const markup = parts(algebraNumericFactorOracle, solution);
            expect(markup).toContain('data-frame-kind="numeric"');
            expect(text(markup)).toContain('2 × ( 8 + 7 )');
            expect(markup).not.toContain('data-symbol-id');
            expect(markup).not.toContain('data-algebra-node="variable"');
        }
    });
    it('withholds category names in parts Q and follows the first stored relation', () => {
        const question = text(parts(algebraPlainOracle, false));
        expect(question).not.toMatch(/\b(term|factor|coefficient|sum|product|quotient)\b/);
        expect(text(parts(algebraPlainOracle, true))).toContain('marked component is a term');
        const sum = algebraOperationOracle('addition', 'symbolic');
        expect(text(parts(sum, true))).toContain('marked component is a sum');
        const first = sum.structuralRelations[0];
        expect(first.kind).toBe('sum');
    });
    it('projects a complete signed additive term instead of the unsigned source subtree', () => {
        const term: Node = {id: 'negative', kind: 'negation', operand: algebraGroup('term-group', algebraBinary('product', 'multiplication', algebraNumber('coefficient', 3), algebraVariable('input')))};
        const data = source(algebraBinary('root', 'addition', term, algebraNumber('constant', 2)), 'additive-components');
        const question = parts(data, false);
        const component = question.split('data-role="algebra-selected-component"')[1]!.split('</div>')[0]!;
        expect(text(component)).toContain('- ( 3 × x )');
        expect(text(parts(data, true))).toContain('complete signed additive component');
    });
    it('identifies the designated coefficient part and handles negative, zero and implicit unit coefficients', () => {
        for (const coefficient of [-3, 0, 2, 'implicit-negative', 'implicit-positive'] as const) {
            const data = algebraCoefficientOracle(coefficient), question = text(parts(data, false)), solution = text(parts(data, true));
            expect(question).toContain('Designated variable part: x');
            expect(question).not.toContain('coefficient');
            expect(solution).toContain('marked component is a coefficient');
            expect(solution).not.toContain('term sign is positive');
            if (typeof coefficient === 'string') {
                const relation = data.structuralRelations[0];
                expect(relation.kind === 'coefficient' && relation.constantFactors).toEqual([]);
                expect(solution).toContain('implicit 1');
                expect(question).toContain(coefficient === 'implicit-negative' ? '-1' : '1');
            }
        }
    });
    it('interprets the entire group as one enclosing factor while retaining its inner sum', () => {
        const question = text(grouped(algebraNumericFactorOracle, false)), solution = text(grouped(algebraNumericFactorOracle, true));
        expect(question).toContain('( 8 + 7 )');
        expect(question).not.toContain('one whole factor');
        expect(solution).toContain('group is one whole factor');
        expect(solution).toContain('Inside the group, 8 + 7 stays together');
        expect(solution).not.toContain('30');
        expect(text(grouped(algebraPlainOracle, true))).toContain('whole subtrahend');
    });
});

describe('substitution and contextual formula projections', () => {
    it('withholds numeric replacement/work/results in Q and substitutes every repeated occurrence in S', () => {
        const data = algebraRepeatedOracle(), question = evaluate(data, false), solution = evaluate(data, true);
        expect(data.substitution.finalValue).toEqual(algebraRational(8));
        expect(question).toContain('data-role="algebra-binding-table"');
        expect(text(question)).toContain('x = 0.500');
        expect(question).not.toMatch(/algebra-calculation|algebra-reduction|algebra-final-value|emerald/);
        expect(text(question)).not.toContain('Value: 8');
        const substitution = solution.split('data-role="algebra-calculation"')[1]!.split('</div>')[0]!;
        expect(substitution.match(/data-literal-notation="0.500"/g)).toHaveLength(2);
        expect(solution.match(/data-role="algebra-reduction"/g)).toHaveLength(data.substitution.reductions.length);
        expect(text(solution)).toContain('Value: 8');
        expect(solution).not.toContain('Power facts');
    });
    it('shows zero/positive-power facts and original nonzero restrictions without a fake unpowered fact', () => {
        const zero = algebraRepeatedOracle(0), positive = algebraRepeatedOracle(2);
        expect(zero.substitution.finalValue).toEqual(algebraRational(7, 2));
        expect(positive.substitution.finalValue).toEqual(algebraRational(77, 4));
        expect(text(evaluate(zero, false))).toContain('must be nonzero');
        expect(evaluate(zero, false)).not.toContain('algebra-power-fact');
        expect(text(evaluate(zero, true))).toContain('raising it to the power 0 gives 1');
        expect(text(evaluate(positive, true))).toContain('2 factors equal to the base');
        expect(evaluate(algebraPlainOracle, true)).not.toContain('algebra-power-fact');
    });
    it('requires prose for parameter inputs and asks for a number when no physical output unit exists', () => {
        const question = evaluate(algebraPlainOracle, false, true), solution = evaluate(algebraPlainOracle, true, true);
        expect(question).toContain('data-role="algebra-context-prose"');
        expect(question).not.toContain('algebra-binding-table');
        expect(text(question)).toContain('that number is 3/2');
        expect(text(question)).toContain('exact resulting number');
        expect(text(question)).not.toContain('with units');
        expect(text(solution)).toContain('Value: 7/2');
        const withoutProse = question.replace(/<div data-role="algebra-context-prose">.*?<\/div>/s, '');
        expect(text(withoutProse)).not.toContain('3/2');
    });
    it('preserves necessary physical input meaning and units, with exact6dollars in S', () => {
        const data = algebraPurchaseOracle(), question = evaluate(data, false, true), solution = evaluate(data, true, true);
        expect(data.substitution.finalValue).toEqual(algebraRational(6));
        expect(text(question)).toContain('Here it is 3/2 hours');
        expect(text(question)).toContain('dollars per hour');
        expect(question).not.toContain('algebra-binding-table');
        expect(text(question)).not.toContain('Value: 6');
        expect(text(solution)).toContain('Value: 6 dollars');
    });
    it('preserves a valid supplied noncanonical spelling of the final exact answer', () => {
        const data = {...algebraPlainOracle, substitution: {...algebraPlainOracle.substitution, finalNotation: {kind: 'fraction' as const, numerator: 14, denominator: 4}}};
        expect(isAlgebraicExpressionProblem(data)).toBe(true);
        expect(text(evaluate(data, true))).toContain('Value: 14/4');
    });
});

describe('phrase writing versus quantitative modeling', () => {
    it('keeps writing Q in necessary prescribed prose without the expression or assignment', () => {
        const question = writing(algebraPlainOracle, false), solution = writing(algebraPlainOracle, true);
        expect(text(question)).toContain('Subtract the second quantity below from the first');
        expect(question).not.toMatch(/data-algebra-node|algebra-written-answer|algebra-binding-table|algebra-calculation|emerald/);
        expect(text(question)).not.toContain('3/2');
        expect(solution).toContain('data-role="algebra-written-answer"');
        expect(text(solution)).toContain('5 - ( y )');
        expect(solution).not.toMatch(/algebra-calculation|algebra-final-value/);
    });
    it('keeps model Q quantitative, with meaningful numeric givens/domains but no symbols or binding', () => {
        const data = algebraPurchaseOracle(), question = model(data, false), solution = model(data, true);
        expect(text(question)).toContain('fixed charge is 3 dollars');
        expect(text(question)).toContain('rate is 2 dollars per hour');
        expect(text(question)).toContain('at least 0');
        expect(question).not.toMatch(/<i>|data-symbol-id|data-algebra-node|algebra-modeled-answer|algebra-calculation|emerald/);
        expect(text(question)).not.toContain('3/2');
        expect(solution).toContain('data-role="algebra-modeled-answer"');
        expect(text(solution)).toContain('3 + 2 × ( t )');
        expect(text(solution)).toContain('Output unit: dollars');
        expect(solution).not.toMatch(/algebra-binding-table|algebra-final-value/);
        expect(text(solution)).not.toContain('3/2');
    });
    it('accepts abstract parameter contexts off-target without revealing canonical model symbols in Q', () => {
        const question = model(algebraPlainOracle, false);
        expect(text(question)).toContain('input numbers and a resulting number');
        expect(text(question)).toContain('the number 5');
        expect(question).not.toMatch(/<i>|data-symbol-id|data-algebra-node/);
        expect(text(model(algebraPlainOracle, true))).toContain('5 - ( y )');
    });
    it('disambiguates repeated quantity roles consistently without revealing model symbols or assignments', () => {
        const data = algebraRepeatedRoleOracle();
        expect(isAlgebraicExpressionProblem(data)).toBe(true);
        for (const markup of [model(data, false), model(data, true), evaluate(data, false, true), evaluate(data, true, true)]) {
            const prose = text(markup);
            expect(prose).toContain('concerns the total amount 2');
            expect(prose).toContain('initial amount 2 is 3 dollars');
            expect(prose).toContain('initial amount 3 is 2 dollars');
            expect(prose).toContain('total amount 1 consists of the initial amount 1 and the initial amount 2');
            expect(prose).toContain('total amount 2 consists of the total amount 1 and the initial amount 3');
        }
        expect(model(data, false)).not.toMatch(/<i>|data-symbol-id|data-algebra-node/);
        expect(text(model(data, false))).not.toContain('3/2');
        expect(text(evaluate(data, true, true))).toContain('Value: 13/2 dollars');
    });
    it('formats negative/fractional powers, nested unary and explicit association without fake group nodes', () => {
        const symbols = [algebraDeclaration()] as const;
        const negativePower: Node = {id: 'power', kind: 'power', base: algebraNumber('base', -1, 2, {kind: 'fraction', numerator: -2, denominator: 4}), exponent: 2};
        const negated: Node = {id: 'negative', kind: 'negation', operand: {id: 'power', kind: 'power', base: algebraVariable('input'), exponent: 2}};
        expect(text(renderToStaticMarkup(<AlgebraExpression node={negativePower} symbols={symbols} />))).toBe('(-2/4) ^2');
        expect(text(renderToStaticMarkup(<AlgebraExpression node={negated} symbols={symbols} />))).toBe('-( x ^2 )');
        const nested: Node = {id: 'outer', kind: 'negation', operand: negated};
        expect(renderToStaticMarkup(<AlgebraExpression node={nested} symbols={symbols} />)).not.toContain('data-algebra-node="group"');
    });
});

let cores: readonly ComponentType<{config: object; payload: unknown}>[];
let definitions: typeof import('./algebra-expression-write/spec.ts')[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./algebra-expression-write/view.tsx'), import('./algebra-expression-parts/view.tsx'), import('./algebra-subexpression-interpretation/view.tsx'), import('./algebra-expression-evaluate/view.tsx'), import('./algebra-formula-evaluate/view.tsx'), import('./algebra-expression-model/view.tsx')]);
    cores = [modules[0].AlgebraExpressionWriteCore, modules[1].AlgebraExpressionPartsCore, modules[2].AlgebraSubexpressionInterpretationCore, modules[3].AlgebraExpressionEvaluateCore, modules[4].AlgebraFormulaEvaluateCore, modules[5].AlgebraExpressionModelCore] as unknown as typeof cores;
    definitions = await Promise.all([import('./algebra-expression-write/spec.ts'), import('./algebra-expression-parts/spec.ts'), import('./algebra-subexpression-interpretation/spec.ts'), import('./algebra-expression-evaluate/spec.ts'), import('./algebra-formula-evaluate/spec.ts'), import('./algebra-expression-model/spec.ts')]) as unknown as typeof definitions;
});
afterAll(() => vi.unstubAllGlobals());
const leaf = (index: number, data: unknown, solution: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], seed: 14, isSolutionView: solution}}));

describe('six full-uniform leaf contracts and declarations', () => {
    it('renders every independent relation/frame/power/context fixture in all6leaves and both modes', () => {
        const fixtures = [algebraPlainOracle, algebraNumericFactorOracle, algebraPurchaseOracle(), algebraRepeatedRoleOracle(), algebraRepeatedOracle(), algebraRepeatedOracle(0), algebraRepeatedOracle(2),
            algebraCoefficientOracle(-3), algebraCoefficientOracle(0), algebraCoefficientOracle('implicit-negative'), algebraCoefficientOracle('implicit-positive'),
            ...(['addition', 'multiplication', 'division'] as const).flatMap(operation => [algebraOperationOracle(operation, 'numeric'), algebraOperationOracle(operation, 'symbolic')])];
        for (const data of fixtures) {
            expect(isAlgebraicExpressionProblem(data)).toBe(true);
            for (let index = 0; index < 6; index++) for (const solution of [false, true]) expect(leaf(index, data, solution)).not.toMatch(/NaN|undefined|null/);
        }
    });
    it('rejects sparse facts, missing domains, inconsistent occurrences/coefficients and cycles before rendering', () => {
        const cycle: Record<string, unknown> = {id: 'cycle', kind: 'group'}; cycle.expression = cycle;
        const coefficient = algebraCoefficientOracle(-3), relation = coefficient.structuralRelations[0];
        const invalid = [undefined, {}, {...algebraPlainOracle, restrictions: undefined}, {...algebraPlainOracle, groupedOperands: new Array(1)},
            {...algebraPlainOracle, expression: cycle}, {...algebraPlainOracle, symbols: [{...algebraPlainOracle.symbols[0], domain: {}}]},
            {...algebraPlainOracle, substitution: {...algebraPlainOracle.substitution, powerFacts: new Array(1)}},
            {...algebraPlainOracle, substitution: {...algebraPlainOracle.substitution, bindings: [{...algebraPlainOracle.substitution.bindings[0], occurrenceNodeIds: []}]}},
            {...coefficient, structuralRelations: [{...relation, coefficient: algebraRational(3)}]}];
        for (const data of invalid) for (let index = 0; index < 6; index++) for (const solution of [false, true]) expect(() => leaf(index, data, solution)).toThrow('Validation Error');
    });
    it('keeps questions neutral, answers green and excludes unstable response glyphs', () => {
        for (const render of renderers) {
            expect(render(algebraPlainOracle, false)).not.toMatch(/emerald|[□→←]/);
            expect(render(algebraPlainOracle, true)).toContain('text-emerald-900');
        }
    });
    it('preserves the exact fixed view capability matrix and empty schemas', () => {
        const abilities = [[Ability.Formalization, Ability.TextualReception], [Ability.ConceptClassification], [Ability.Interpretation], [Ability.ProcedureExecution], [Ability.ProcedureExecution, Ability.TextualReception], [Ability.Formalization, Ability.TextualReception]];
        definitions.forEach((module, index) => {
            expect(module.spec.generalLabels).toEqual([Scope.ArabicNumerals, ...abilities[index]!]);
            expect(Object.entries(module).find(([name]) => name.endsWith('ViewSchema'))![1]).toEqual({});
        });
    });
    it('admits only plain selected generator evidence for the writer and genuine task participation elsewhere', () => {
        const queries = (target: readonly string[], generator: readonly string[] = []) => ({has: (scope: string, label: string) => (scope === 'target' ? target : generator).includes(label), exact: (scope: string, label: string) => (scope === 'target' ? target : generator).includes(label)});
        const supports = (index: number, target: readonly string[], generator: readonly string[] = []) => definitions[index]!.spec.compatibility!.every(rule => rule.predicate(queries(target, generator)));
        const writingTarget = [Area.AlgebraicExpression, Ability.TextualReception];
        expect(supports(0, writingTarget, [Area.AlgebraicExpression])).toBe(true);
        for (const extra of [Area.Term, Area.Factor, Area.Coefficient, Area.GroupingSymbol, Area.Operand, Area.AlgebraicSubstitution, Area.OrderOfOperations, Area.AlgebraicModeling, Area.Exponentiation]) expect(supports(0, writingTarget, [Area.AlgebraicExpression, extra])).toBe(false);
        expect(supports(0, [Area.ArithmeticExpression, Ability.TextualReception], [Area.ArithmeticExpression])).toBe(false);
        expect(supports(1, [Area.AlgebraicExpression])).toBe(false);
        expect(supports(1, [Area.Coefficient])).toBe(true);
        expect(supports(2, [Area.GroupingSymbol])).toBe(false);
        expect(supports(2, [Area.GroupingSymbol, Area.Operand])).toBe(true);
        expect(supports(3, [Area.AlgebraicSubstitution, Area.OrderOfOperations])).toBe(true);
        expect(supports(4, [Area.AlgebraicSubstitution, Area.OrderOfOperations])).toBe(false);
        expect(supports(4, [Area.AlgebraicSubstitution, Area.OrderOfOperations, Ability.TextualReception])).toBe(true);
        expect(supports(5, writingTarget)).toBe(false);
        expect(supports(5, [Area.AlgebraicModeling])).toBe(true);
    });
});
