import {Area} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt, planCompatibility} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import * as rng from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {spec as gradeSix} from '../../../spec/ccss/grade-06.ts';
import type {AlgebraicExpressionProblem, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {AlgebraExpressionPartsBody, AlgebraSubexpressionBody} from '../../../visuals/views/operations/algebra-expression-view.tsx';
import {spec as parts} from '../../../visuals/views/operations/algebra-expression-parts/spec.ts';
import {spec as grouped} from '../../../visuals/views/operations/algebra-subexpression-interpretation/spec.ts';
import {spec as writer} from '../../../visuals/views/operations/algebra-expression-write/spec.ts';
import {AlgebraExpressionsGenerator} from './generator.ts';
import {numericExpressionCaseCount, numericExpressionInputsAt, numericExpressionRangeProfiles} from './numeric-domain.ts';
import {profilesForRelation} from './numeric-profiles.ts';
import {expressionRangeLabels} from './range-profile.ts';
import {AlgebraExpressionsGeneratorSchema as schema, spec} from './spec.ts';

function quantities(data: AlgebraicExpressionProblem): number[] {
    const literals = (node: Node): number[] => node.kind === 'number' ? [node.value.numerator / node.value.denominator]
        : node.kind === 'binary' ? [...literals(node.left), ...literals(node.right)]
            : node.kind === 'group' ? literals(node.expression) : node.kind === 'negation' ? literals(node.operand) : [];
    const values = literals(data.structuralExpression.expression), relation = data.structuralRelations[0];
    if (relation.kind === 'additive-components') for (const term of relation.terms) {
        const value = data.substitution.nodeValues.find(row => row.nodeId === term.sourceNodeId)!.value;
        values.push(term.polarity * value.numerator / value.denominator);
    }
    return values;
}
const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const plan = (id: string, labels: readonly string[], view: typeof parts | typeof grouped | typeof writer) => planCompatibility({
    identity: {targetId: id, generatorId: spec.generatorId, viewId: view.viewId}, targetLabels: labels,
    generatorLabels: spec.generalLabels, viewLabels: view.generalLabels, generatorRules: spec.compatibility,
    viewRules: view.compatibility, fields: normalizeSchemaChoices(schema, labels, 'generator')
});

describe('structural numeric range source and consumer contracts', () => {
    it('executes every one of the45 real numeric source selections on direct/planned/replay paths', () => {
        const targets = gradeSix.filter(target => target.id.startsWith('6.EE.A.2b-') && target.labels.includes(Area.ArithmeticExpression));
        expect(targets).toHaveLength(6);
        const evaluator = createLabelDependencyEvaluator(), generator = new AlgebraExpressionsGenerator();
        let checked = 0;
        for (const target of targets) {
            const view = target.id.includes('interpret-subexpressions') ? grouped : parts;
            const result = plan(target.id, target.labels, view);
            if (!result.supported) throw new Error('An existing numeric target stopped matching.');
            const enumeration = enumerateDependencyAuditSelections(result.plan);
            expect(enumeration.status).toBe('complete');
            for (const selection of enumeration.selections) {
                const sampleKey = `${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`, seed = 37;
                const replay = {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(result.plan, selection.choices)};
                const input = {plan: result.plan, sampleKey, seed, attempt: 1, replay, viewSchema: {}};
                const resolved = resolvePlannedConfigurations({...input, generatorSchema: schema});
                const direct = extractConfig(schema, selection.labels).config;
                expect(direct).toEqual(resolved.generatorConfig);
                rng.setRandomState(resolved.generatorRandomState);
                const directStub = generator.generate(direct), state = rng.getRandomState();
                const draw = generatePlannedDraw({...input, generator});
                expect(draw.stub!.data).toEqual(directStub!.data);
                expect(rng.getRandomState()).toBe(state);
                expect(generatePlannedDraw({...input, generator})).toEqual(draw);
                const range = direct.range;
                if (!range) throw new Error('Numeric structural selections must resolve a range.');
                const data = draw.stub!.data as AlgebraicExpressionProblem;
                expect(hasCanonicalRangeWitness(quantities(data), range)).toBe(true);
                const evaluated = evaluator.evaluate(draw.labels);
                expect(evaluated.errors).toEqual([]);
                expect(evaluated.conflicts).toEqual([]);
                expect(evaluated.assessments.filter(item => item.status === 'missing')).toEqual([]);
                for (const isSolutionView of [false, true]) {
                    const markup = renderToStaticMarkup(view === grouped ? <AlgebraSubexpressionBody data={data} isSolutionView={isSolutionView} />
                        : <AlgebraExpressionPartsBody data={data} isSolutionView={isSolutionView} />);
                    expect(markup).toContain('data-frame-kind="numeric"');
                    expect(markup).not.toMatch(/algebra-calculation|algebra-final-value|data-symbol-id/);
                    expect(markup.includes('data-role="algebra-response"')).toBe(!isSolutionView);
                }
                checked++;
            }
        }
        expect(checked).toBe(45);
    });

    it('keeps eight unbound symbolic/writing findings explicitly deferred instead of bounding their hidden bindings', () => {
        const targets = gradeSix.filter(target => (target.id.startsWith('6.EE.A.2a-') || target.id.startsWith('6.EE.A.2b-'))
            && target.labels.includes(Area.AlgebraicExpression));
        expect(targets).toHaveLength(8);
        const evaluator = createLabelDependencyEvaluator();
        for (const target of targets) {
            const view = target.id.startsWith('6.EE.A.2a-') ? writer : target.id.includes('interpret-subexpressions') ? grouped : parts;
            const result = plan(target.id, target.labels, view);
            if (!result.supported) throw new Error('A symbolic source stopped matching.');
            const selection = enumerateDependencyAuditSelections(result.plan).selections;
            expect(selection).toHaveLength(1);
            expect(extractConfig(schema, selection[0]!.labels).config.range).toBe(false);
            expect(selection[0]!.labels.some(label => expressionRangeLabels.includes(label))).toBe(false);
            expect(evaluator.evaluate(selection[0]!.labels).assessments.filter(item => item.status === 'missing').map(item => item.facet)).toEqual(['range']);
            expect(plan('unsupported-symbolic-bound', [...target.labels, ...numericExpressionRangeProfiles[0]!.labels], view).supported).toBe(false);
        }
    });

    it('preserves canonical quantities at every pool boundary without exposing unused evaluation totals', () => {
        const generator = new AlgebraExpressionsGenerator(), draw = vi.spyOn(rng, 'random');
        let projections = 0;
        try {
            for (const relation of ['numeric-terms', 'numeric-factors', 'numeric-sum', 'numeric-product', 'numeric-quotient', 'numeric-grouped'] as const)
                for (const numericProfile of profilesForRelation(relation)) for (const {range} of numericExpressionRangeProfiles) {
                    const count = numericExpressionCaseCount(relation, numericProfile, range);
                    if (!count) continue;
                    for (const index of new Set([0, Math.floor(count / 2), count - 1])) {
                        draw.mockClear().mockReturnValue((index + 0.5) / count);
                        const data = generator.generate({relation, power: 'none', numericProfile, range})!.data;
                        expect(hasCanonicalRangeWitness(quantities(data), range)).toBe(true);
                        expect(draw).toHaveBeenCalledTimes(1);
                        for (const isSolutionView of [false, true]) {
                            const markup = renderToStaticMarkup(relation === 'numeric-grouped'
                                ? <AlgebraSubexpressionBody data={data} isSolutionView={isSolutionView} />
                                : <AlgebraExpressionPartsBody data={data} isSolutionView={isSolutionView} />);
                            expect(markup).not.toMatch(/NaN|undefined|algebra-final-value|algebra-calculation/);
                            projections++;
                        }
                    }
                }
            expect(projections).toBe(270);
        } finally { draw.mockRestore(); }
        const range = createCanonicalNumericRange(10, 5), count = numericExpressionCaseCount('numeric-product', 1, range);
        const index = Array.from({length: count}, (_, index) => index).find(index => {
            const inputs = numericExpressionInputsAt('numeric-product', 1, range, index);
            return inputs.a === 9 && inputs.b === 6 && inputs.input.numerator === 8 && inputs.input.denominator === 1;
        })!;
        const forced = vi.spyOn(rng, 'random').mockReturnValue((index + 0.5) / count);
        try {
            const data = generator.generate({relation: 'numeric-product', power: 'none', numericProfile: 1, range})!.data;
            expect(data.substitution.finalValue.numerator).toBe(126);
            const solution = text(renderToStaticMarkup(<AlgebraExpressionPartsBody data={data} isSolutionView />));
            expect(solution).toContain('9 × ( 8 + 6 )');
            expect(solution).not.toContain('126');
            expect(quantities(data)).toEqual([9, 8, 6]);
        } finally { forced.mockRestore(); }
    });
});
