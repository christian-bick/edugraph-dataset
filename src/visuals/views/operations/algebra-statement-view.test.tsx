import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {isAlgebraicEquationProblem, isAlgebraicInequalityProblem} from '../../../generators/algebra/algebra-statement-helpers.ts';
import type {AlgebraicInequalityProblem, ExactEquation, StatementAmbientDomain} from '../../../types/problems.ts';
import {AlgebraEquationModelSolveBody, AlgebraInequalityInfiniteSolutionsBody, AlgebraInequalityModelBody, AlgebraInequalityNumberlineBody, AlgebraSolutionMeaningBody, AlgebraSubstitutionCheckBody} from './algebra-statement-view.tsx';
import type {StatementProblem} from './algebra-statement-format.tsx';
import {statementAxis, statementBounded, statementEquationFixture as equation, statementHalfAxis, statementInequalityFixture as inequality, statementNonnegative, statementNumber, statementPhysicalAdditionFixture, statementPhysicalProductFixture, statementRational as q, statementRationals, statementRayOracle} from './algebra-statement-fixtures.ts';

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&#x27;', "'").replace(/\s+/g, ' ').trim();
const check = (data: StatementProblem, solution: boolean) => renderToStaticMarkup(<AlgebraSubstitutionCheckBody data={data} isSolutionView={solution} />);
const meaning = (data: StatementProblem, solution: boolean) => renderToStaticMarkup(<AlgebraSolutionMeaningBody data={data} isSolutionView={solution} />);
const solve = (data: ReturnType<typeof equation>, solution: boolean) => renderToStaticMarkup(<AlgebraEquationModelSolveBody data={data} isSolutionView={solution} />);
const model = (data: AlgebraicInequalityProblem, solution: boolean) => renderToStaticMarkup(<AlgebraInequalityModelBody data={data} isSolutionView={solution} />);
const infinite = (data: AlgebraicInequalityProblem, solution: boolean) => renderToStaticMarkup(<AlgebraInequalityInfiniteSolutionsBody data={data} isSolutionView={solution} />);
const line = (data: AlgebraicInequalityProblem, solution: boolean, seed = 0) => renderToStaticMarkup(<AlgebraInequalityNumberlineBody data={data} isSolutionView={solution} seed={seed} />);
const finite: StatementAmbientDomain = {kind: 'finite', values: [q(0), q(1), q(2)]};
const hole: StatementAmbientDomain = {kind: 'numeric', values: {kind: 'rational', lower: {value: q(0), inclusive: true}, upper: {value: q(2), inclusive: true}, excludedValues: [q(1)]}};
const singleton: StatementAmbientDomain = {kind: 'numeric', values: {kind: 'rational', lower: {value: q(0), inclusive: true}, upper: {value: q(0), inclusive: true}, excludedValues: []}};

describe('exact candidate versus complete solution semantics', () => {
    it('validates an independent complete strict-ray oracle with literal-only side calculations', () => {
        expect(isAlgebraicInequalityProblem(statementRayOracle)).toBe(true);
        expect(statementRayOracle.candidateChecks.map(row => row.comparison.truth)).toEqual([true, false, false]);
        expect(statementRayOracle.candidateChecks[0].right.replacements).toEqual([]);
        expect(statementRayOracle.candidateChecks[0].right.calculation.reductions).toEqual([]);
        expect(statementRayOracle.solutionCardinality).toEqual({kind: 'infinite'});
    });
    it('withholds substituted sides/truth in check Q and evaluates the given false boundary assignment in S', () => {
        const question = check(statementRayOracle, false), solution = text(check(statementRayOracle, true));
        expect(text(question)).toContain('Given candidate: x = 1');
        expect(question).not.toMatch(/statement-side-work|statement-truth|ambient-solution|solution-cardinality|emerald/);
        expect(solution).toContain('Left side after substitution 1 Value: 1');
        expect(solution).toContain('Right side after substitution 1 Value: 1');
        expect(solution).toContain('1 < 1 is false');
        expect(solution).toContain('does not determine every solution');
    });
    it('preserves the supplied binding spelling exactly in original and replaced occurrences', () => {
        const base = inequality('less', q(1, 2), statementRationals, [q(0), q(1, 2)], statementHalfAxis, {kind: 'decimal', coefficient: 500, scale: 3, numeral: '0.500'});
        const row = base.candidateChecks[1]!;
        const notation = {kind: 'fraction' as const, numerator: 2, denominator: 4};
        const changed = {...base, assignment: {...row.binding, notation}, candidateUniverse: [base.candidateUniverse[0], {...base.candidateUniverse[1]!, notation}],
            candidateChecks: [base.candidateChecks[0], {...row, binding: {...row.binding, notation}, left: {...row.left, replacements: row.left.replacements.map(item => ({...item, notation})), calculation: {...row.left.calculation, expression: {id: 'variable-x', kind: 'number' as const, value: q(1, 2), notation}}}}]} as AlgebraicInequalityProblem;
        expect(isAlgebraicInequalityProblem(changed)).toBe(true);
        expect(text(check(changed, false))).toContain('Given candidate: x = 2/4');
        expect(check(changed, true)).toContain('data-literal-notation="2/4"');
        expect(check(changed, true)).toContain('data-literal-notation="0.500"');
        expect(isAlgebraicInequalityProblem({...changed, assignment: {...changed.assignment, notation: {kind: 'fraction', numerator: 1, denominator: 2}}})).toBe(false);
    });
    it('keeps a root absent from candidates separate from the ambient singleton and verifies it independently', () => {
        const data = statementPhysicalAdditionFixture();
        expect(isAlgebraicEquationProblem(data)).toBe(true);
        expect(data.restrictedSolutions.values).toEqual([]);
        expect(data.ambientSolution).toEqual({kind: 'singleton', value: q(5, 4), notation: {kind: 'fraction', numerator: 5, denominator: 4}});
        expect(data.solutionWitness.kind === 'isolated-variable' && data.solutionWitness.verification?.binding.value).toEqual(q(5, 4));
        expect(text(meaning(data, true))).toContain('selected set {}');
        expect(text(solve(data, true))).toContain('complete solution set is {5/4}');
    });
    it('keeps the finite ambient table complete even when the candidate universe omits an ambient solution', () => {
        const data = inequality('less', q(3, 2), finite, [q(0), q(2)]);
        expect(data.restrictedSolutions.values).toEqual([q(0)]);
        expect(data.ambientSolution).toEqual({kind: 'finite', values: [q(0), q(1)]});
        expect(data.ambientChecks.map(row => row.binding.value)).toEqual([q(0), q(1), q(2)]);
        const question = meaning(data, false), solution = text(meaning(data, true));
        expect(question).toContain('candidate-truth-table');
        expect(text(question)).toContain('Selected values: {0}');
        expect(question).not.toContain('Every value in this finite universe was checked');
        expect(solution).toContain('all and only its satisfying values');
        expect(solution).toContain('Values elsewhere in the ambient domain were not decided');
    });
});

describe('modeling and elementary equation execution', () => {
    it('requires quantitative prose to recover the equation and preserves exact inverse/substitution work in S', () => {
        const data = statementPhysicalAdditionFixture(), question = solve(data, false), solution = text(solve(data, true));
        expect(text(question)).toContain('added amount of 3/4 dollars');
        expect(text(question)).toContain('total amount is 2 dollars');
        expect(question).not.toMatch(/data-statement-node|equation-inverse-work|checked-assignment|ambient-solution|emerald/);
        expect(text(question)).not.toContain('5/4');
        expect(solution).toContain('x + (3/4) = 2');
        expect(solution).toContain('Subtract the same (3/4) from both sides');
        expect(solution).toContain('x = 5/4');
        expect(solution).toContain('(5/4) + (3/4) Step 1 2 Value: 2');
        expect(solution).toContain('solution values use dollars');
    });
    it('keeps rate/duration units distinct and divides by the supplied nonzero coefficient', () => {
        const data = statementPhysicalProductFixture(), question = solve(data, false), solution = text(solve(data, true));
        expect(text(question)).toContain('duration is unknown, measured in hours');
        expect(text(question)).toContain('rate is 3/4 dollars per hour');
        expect(solution).toContain('Divide both sides by the same nonzero (3/4)');
        expect(solution).toContain('x = 2');
        expect(solution).toContain('solution values use hours');
        expect(data.solutionCardinality).toEqual({kind: 'finite', count: 1});
    });
    it('accepts signed abstract number relations without adding a physical unit or revealing the assigned candidate', () => {
        const data = equation('addition', q(2), q(1)), question = solve(data, false), solution = text(solve(data, true));
        expect(text(question)).toContain('input number is combined by addition with 2');
        expect(text(question)).not.toContain('with its unit');
        expect(question).not.toContain('given-assignment');
        expect(solution).toContain('x = -1');
        expect(solution).not.toContain('solution values use');
    });
    it('classifies zero coefficients as all or none, without dividing by zero or inventing a unique root', () => {
        for (const total of [0, 1]) {
            const data = equation('multiplication', q(0), q(total)), solution = text(solve(data, true));
            expect(data.ambientSolution.kind).toBe(total === 0 ? 'all-domain' : 'empty');
            expect(solution).toContain(`0 = ${total} is ${total === 0 ? 'true' : 'false'}`);
            expect(solution).not.toContain('Divide both sides');
            expect(solution).not.toContain('isolated value');
        }
    });
    it('explains nonnegative impossible addition without storing or printing a negative auxiliary answer', () => {
        const data = equation('addition', q(2), q(1), statementNonnegative), question = solve(data, false), solution = text(solve(data, true));
        expect(data.solutionWitness.kind).toBe('nonnegative-addend-exceeds-total');
        expect(data.solutionCardinality).toEqual({kind: 'finite', count: 0});
        expect(solution).toContain('at least 2, which is greater than 1');
        expect(solution).not.toContain('-1');
        expect(question).not.toContain('equation-exception');
    });
    it('preserves an excluded root and original domain rather than showing an inadmissible verification', () => {
        const domain: StatementAmbientDomain = {kind: 'numeric', values: {kind: 'rational', lower: null, upper: null, excludedValues: [q(2)]}};
        const data = equation('multiplication', q(3, 4), q(3, 2), domain, [q(0), q(1)]), solution = solve(data, true);
        expect(data.solutionWitness.kind === 'isolated-variable' && data.solutionWitness.verification).toBe(null);
        expect(text(solution)).toContain('2 does not belong to the original admissible domain');
        expect(solution).not.toContain('checked-assignment');
        expect(text(solution)).toContain('excluding 2');
    });
    it('preserves genuine grouping and left-associated division in a complete accepted multi-step inverse trace', () => {
        const data = equation('addition', q(2), q(4)), witness = data.solutionWitness;
        if (witness.kind !== 'isolated-variable') throw new Error('Expected isolated oracle');
        const half: ExactEquation = {operator: 'equal', left: {id: 'half-left', kind: 'binary', operation: 'division', left: {id: 'numerator-group', kind: 'group', expression: data.statement.left}, right: statementNumber('divide-two', q(2))}, right: statementNumber('half-right', q(2))};
        const restored: ExactEquation = {operator: 'equal', left: {id: 'restored-left', kind: 'binary', operation: 'division', left: half.left, right: statementNumber('inverse-half', q(1, 2))}, right: statementNumber('restored-right', q(4))};
        const isolated: ExactEquation = {operator: 'equal', left: {id: 'variable-x', kind: 'variable', symbolId: 'x'}, right: statementNumber('final-two', q(2))};
        const changed = {...data, solutionWitness: {...witness, transformations: [
            {kind: 'divide-by-nonzero-coefficient' as const, before: data.statement, divisor: q(2), after: half, rightQuotient: q(2)},
            {kind: 'divide-by-nonzero-coefficient' as const, before: half, divisor: q(1, 2), after: restored, rightQuotient: q(4)},
            {kind: 'subtract-same-addend' as const, before: restored, operand: q(2), after: isolated, rightDifference: q(2)}] as const}};
        expect(isAlgebraicEquationProblem(changed)).toBe(true);
        expect(solve(changed, false)).not.toContain('equation-inverse-work');
        expect(text(solve(changed, true))).toContain('( x + 2 ) ÷ 2 ÷ (1/2) = 4');
        expect(text(solve(changed, true))).toContain('x = 2');
    });
});

describe('strict sets, scaled lines and necessary context', () => {
    it('leaves numberline Q blank and shows exact open ray/direction in S in both orientations', () => {
        for (const seed of [0, 1]) {
            const question = line(statementRayOracle, false, seed), solution = line(statementRayOracle, true, seed);
            expect(question).toContain(`data-orientation="${seed ? 'vertical' : 'horizontal'}"`);
            expect(question.match(/data-role="statement-tick"/g)).toHaveLength(4);
            expect(question).not.toMatch(/statement-solution-marks|solution-endpoint|solution-ray-arrow|emerald/);
            expect(solution).toContain('data-role="solution-endpoint" data-tick-index="2" data-included="false"');
            expect(solution.match(/data-role="solution-ray-arrow"/g)).toHaveLength(1);
            expect(text(solution)).toContain('All admissible values less than 1');
        }
        const greater = inequality('greater', q(3, 2));
        expect(text(line(greater, true))).toContain('greater than 3/2');
    });
    it('renders bounded intersections and interior holes with exact supplied locations and no false ray', () => {
        const data = inequality('less', q(3, 2), hole, [q(0), q(2)]), solution = line(data, true);
        expect(data.ambientSolution.kind).toBe('interval');
        expect(solution).toContain('data-role="solution-endpoint" data-tick-index="2" data-included="true"');
        expect(solution).toContain('data-role="solution-endpoint" data-tick-index="5" data-included="false"');
        expect(solution).toContain('data-role="solution-exclusion" data-tick-index="4" data-included="false"');
        expect(solution).not.toContain('data-role="solution-ray-arrow"');
        expect(text(infinite(data, true))).toContain('avoids its exclusions');
        expect(text(infinite(data, true))).not.toContain('Solutions continue without a final value');
    });
    it('keeps a bounded assigned predicate distinct from an unrestricted halfline despite infinitely many solutions', () => {
        const data = inequality('less', q(3, 2), statementBounded);
        expect(data.ambientSolution).toMatchObject({kind: 'interval', lower: {value: q(0), inclusive: true}, upper: {value: q(3, 2), inclusive: false}});
        expect(data.solutionCardinality).toEqual({kind: 'infinite'});
        expect(line(data, true)).not.toContain('solution-ray-arrow');
        expect(text(infinite(data, true))).toContain('included lower endpoint 0');
        expect(text(infinite(data, true))).not.toContain('Solutions continue without a final value');
    });
    it('keeps finite/empty/all/singleton sets truthful and never asserts infinity for a finite ambient domain', () => {
        const members = [inequality('less', q(0), finite), inequality('less', q(3), finite), inequality('greater', q(1), finite), inequality('less', q(3, 2), finite)];
        expect(members.map(data => data.ambientSolution.kind)).toEqual(['empty', 'all-domain', 'singleton', 'finite']);
        members.forEach((data, index) => {
            const solution = line(data, true);
            expect(solution.match(/data-role="solution-member"/g)?.length ?? 0).toBe([0, 3, 1, 2][index]);
            expect(solution).not.toContain('solution-ray-arrow');
            expect(text(infinite(data, true))).not.toContain('infinitely many');
            expect(text(infinite(data, true))).toContain('Number of solutions in the stated domain:');
        });
        const one = inequality('less', q(1), singleton, [q(0)]);
        expect(one.ambientSolution.kind).toBe('all-domain');
        expect(one.solutionCardinality).toEqual({kind: 'finite', count: 1});
        expect(text(infinite(one, true))).toContain('Number of solutions in the stated domain: 1');
    });
    it('explains the complete unrestricted set and supplied infinite family while withholding both in Q', () => {
        const question = infinite(statementRayOracle, false), solution = text(infinite(statementRayOracle, true));
        expect(question).not.toMatch(/ambient-solution|solution-cardinality|infinite-family|emerald/);
        expect(text(question)).not.toContain('infinitely many');
        expect(solution).toContain('For every positive integer n, x = 1 - n × 1');
        expect(solution).toContain('toward smaller numbers');
        expect(solution).toContain('entire ray');
    });
    it('requires signed condition prose and domain for modeling, hiding the ready inequality and solution set in Q', () => {
        for (const kind of ['balance', 'temperature', 'elevation'] as const) {
            const data = inequality('greater', q(1, 2), statementNonnegative, [q(0), q(1)], statementHalfAxis, {kind: 'decimal', coefficient: 500, scale: 3, numeral: '0.500'}, kind);
            const question = model(data, false), solution = model(data, true);
            expect(question).toContain('statement-context-prose');
            expect(text(question)).toContain('strictly above 0.500');
            expect(text(question)).toContain('at least 0');
            expect(question).not.toMatch(/data-statement-node|ambient-solution|solution-cardinality|statement-numberline|emerald/);
            expect(solution).toContain('data-literal-notation="0.500"');
            expect(solution).not.toMatch(/ambient-solution|solution-cardinality|statement-numberline/);
            if (kind === 'temperature') expect(text(question)).toContain('degrees Celsius relative to 0 degrees Celsius');
        }
    });
    it('accepts a broad two-tick asymmetric frame with an endpoint strict boundary', () => {
        const axis = {minimum: q(-1), maximum: q(0), step: q(1), ticks: [q(-1), q(0)], zeroIndex: 1};
        const data = inequality('less', q(0), statementRationals, [q(-1), q(0)], axis);
        expect(isAlgebraicInequalityProblem(data)).toBe(true);
        for (const seed of [0, 1]) expect(line(data, true, seed)).not.toMatch(/NaN|undefined/);
    });
});

let cores: readonly ComponentType<{config: object; payload: unknown}>[];
let definitions: typeof import('./algebra-substitution-check/spec.ts')[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./algebra-substitution-check/view.tsx'), import('./algebra-solution-meaning/view.tsx'), import('./algebra-equation-model-solve/view.tsx'), import('./algebra-inequality-numberline/view.tsx'), import('./algebra-inequality-infinite-solutions/view.tsx'), import('./algebra-inequality-model/view.tsx')]);
    cores = [modules[0].AlgebraSubstitutionCheckCore, modules[1].AlgebraSolutionMeaningCore, modules[2].AlgebraEquationModelSolveCore, modules[3].AlgebraInequalityNumberlineCore, modules[4].AlgebraInequalityInfiniteSolutionsCore, modules[5].AlgebraInequalityModelCore] as unknown as typeof cores;
    definitions = await Promise.all([import('./algebra-substitution-check/spec.ts'), import('./algebra-solution-meaning/spec.ts'), import('./algebra-equation-model-solve/spec.ts'), import('./algebra-inequality-numberline/spec.ts'), import('./algebra-inequality-infinite-solutions/spec.ts'), import('./algebra-inequality-model/spec.ts')]) as unknown as typeof definitions;
});
afterAll(() => vi.unstubAllGlobals());
const leaf = (index: number, data: unknown, solution: boolean, seed = 0) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {problem: {type: 'arithmetic', data, labels: []}, seed, targetLabels: [], isSolutionView: solution}}));

describe('six strict uniform leaf contracts and semantic participation', () => {
    it('accepts all coherent equation branches and every inequality solution tag through all compatible leaves', () => {
        const equations = [statementPhysicalAdditionFixture(), statementPhysicalProductFixture(), equation('addition', q(2), q(1)), equation('addition', q(2), q(1), statementNonnegative), equation('multiplication', q(0), q(0)), equation('multiplication', q(0), q(1)), equation('multiplication', q(0), q(0), finite)];
        for (const data of equations) for (const index of [0, 1, 2]) for (const solution of [false, true]) expect(leaf(index, data, solution)).not.toMatch(/NaN|undefined|null/);
        const inequalities = [statementRayOracle, inequality('greater'), inequality('less', q(3, 2), hole, [q(0), q(2)]), inequality('less', q(0), finite), inequality('less', q(3), finite), inequality('greater', q(1), finite), inequality('less', q(3, 2), finite), inequality('less', q(1), singleton, [q(0)])];
        for (const data of inequalities) for (const index of [0, 1, 3, 4, 5]) for (const solution of [false, true]) expect(leaf(index, data, solution)).not.toMatch(/NaN|undefined|null/);
    });
    it('rejects sparse/cyclic/incoherent facts and mismatched binding spelling before rendering', () => {
        const cycle: Record<string, unknown> = {id: 'cycle', kind: 'group'}; cycle.expression = cycle;
        const invalid = [undefined, {}, {...statementRayOracle, candidateChecks: new Array(3)}, {...statementRayOracle, ambientChecks: new Array(1)},
            {...statementRayOracle, assignment: {...statementRayOracle.assignment, notation: {kind: 'fraction', numerator: 2, denominator: 2}}},
            {...statementRayOracle, solutionCardinality: {kind: 'finite', count: 1}}, {...statementRayOracle, statement: {...statementRayOracle.statement, left: cycle}},
            {...statementRayOracle, solutionLine: {...statementRayOracle.solutionLine, axis: {...statementAxis, ticks: new Array(4)}}}];
        for (const data of invalid) for (const index of [0, 1, 3, 4, 5]) expect(() => leaf(index, data, false)).toThrow('Validation Error');
        expect(() => leaf(2, statementRayOracle, false)).toThrow('Validation Error');
        expect(() => leaf(3, statementPhysicalAdditionFixture(), false)).toThrow('Validation Error');
    });
    it('keeps all questions neutral, completed work green and response typography stable', () => {
        for (let index = 0; index < 6; index++) {
            const data = index === 2 ? statementPhysicalAdditionFixture() : statementRayOracle;
            expect(leaf(index, data, false)).not.toMatch(/emerald|[□→←]/);
            expect(leaf(index, data, true)).toContain('text-emerald-900');
        }
    });
    it('owns exactly the six reviewed fixed capability sets with empty schemas', () => {
        const labels = [[Scope.ArabicNumerals, Ability.ProcedureExecution, Ability.CorrectnessEvaluation], [Scope.ArabicNumerals, Ability.ProcedureUnderstanding], [Scope.ArabicNumerals, Ability.TextualReception, Ability.Formalization, Ability.ProcedureExecution],
            [Scope.Numberline, Scope.GraphicalAlgebraicRepresentation, Ability.VisualArticulation], [Scope.ArabicNumerals, Ability.Interpretation], [Scope.ArabicNumerals, Ability.TextualReception, Ability.Formalization]];
        definitions.forEach((module, index) => {
            expect(module.spec.generalLabels).toEqual(labels[index]);
            expect(Object.entries(module).find(([name]) => name.endsWith('ViewSchema'))![1]).toEqual({});
        });
    });
    it('admits the exact selected mathematical bundles and rejects hidden extra evidence without narrowing runtime payloads', () => {
        const query = (target: readonly string[], generator: readonly string[]) => ({has: (scope: string, label: string) => (scope === 'target' ? target : generator).includes(label), exact: (scope: string, label: string) => (scope === 'target' ? target : generator).includes(label)});
        const targets = [[Area.AlgebraicSubstitution, Area.RelationSatisfaction], [Area.SolutionSet, Area.EquationSolving], [Area.AlgebraicModeling, Area.Equation, Area.EquationSolving], [Area.Inequality, Area.SolutionSet, Scope.Numberline], [Area.Inequality, Area.SolutionSet], [Area.AlgebraicModeling, Area.Inequality]];
        const bundles = [[Area.AlgebraicSubstitution, Area.RelationSatisfaction], [Area.SolutionSet, Area.EquationSolving], [Area.AlgebraicModeling, Area.EquationSolving], [Area.SolutionSet], [Area.SolutionSet], [Area.AlgebraicModeling]];
        definitions.forEach((module, index) => {
            const supports = (generator: readonly string[]) => module.spec.compatibility!.every(rule => rule.predicate(query(targets[index]!, generator)));
            expect(supports(bundles[index]!)).toBe(true);
            expect(supports([...bundles[index]!, index === 2 || index === 5 ? Area.RelationSatisfaction : Area.AlgebraicModeling])).toBe(false);
        });
        for (const index of [3, 4]) expect(definitions[index]!.spec.compatibility!.every(rule => rule.predicate(query(targets[index]!, [Area.SolutionSet, Area.InequalitySolving])))).toBe(false);
    });
});
