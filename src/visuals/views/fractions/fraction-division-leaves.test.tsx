import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionDivisionRelationsGenerator} from '../../../generators/fraction/fraction-division-relations/generator.ts';
import {FractionQuotientModelGenerator} from '../../../generators/fraction/fraction-quotient-model/generator.ts';
import {FractionQuotientBody, type FractionQuotientTask} from './fraction-quotient-view.tsx';
import {spec as modelSpec} from './fractions-division-model-construction/spec.ts';
import {Ability} from 'edugraph-ts';

const leafIds = [
    'fractions-division-execution', 'fractions-division-interpretation',
    'fractions-division-inverse-explanation', 'fractions-division-story-creation',
    'fractions-division-word-problem', 'fractions-division-model-construction'
] as const;
type LeafId = typeof leafIds[number];
type Core = ComponentType<{payload: unknown}>;
let cores: Record<LeafId, Core>;

beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [execution, interpretation, inverse, story, word, model] = await Promise.all([
        import('./fractions-division-execution/view.tsx'),
        import('./fractions-division-interpretation/view.tsx'),
        import('./fractions-division-inverse-explanation/view.tsx'),
        import('./fractions-division-story-creation/view.tsx'),
        import('./fractions-division-word-problem/view.tsx'),
        import('./fractions-division-model-construction/view.tsx')
    ]);
    cores = {
        'fractions-division-execution': execution.FractionsDivisionExecutionCore as unknown as Core,
        'fractions-division-interpretation': interpretation.FractionsDivisionInterpretationCore as unknown as Core,
        'fractions-division-inverse-explanation': inverse.FractionsDivisionInverseExplanationCore as unknown as Core,
        'fractions-division-story-creation': story.FractionsDivisionStoryCreationCore as unknown as Core,
        'fractions-division-word-problem': word.FractionsDivisionWordProblemCore as unknown as Core,
        'fractions-division-model-construction': model.FractionsDivisionModelConstructionCore as unknown as Core
    };
});
afterAll(() => vi.unstubAllGlobals());

const render = (id: LeafId, data: unknown, isSolutionView: boolean) =>
    renderToStaticMarkup(createElement(cores[id], {payload: {
        problem: {type: 'fraction', data, labels: []}, viewId: id,
        targetLabels: [], isSolutionView, seed: 42
    }}));

describe('general fraction division leaf contracts', () => {
    it('accepts every original operand profile, context, and optional witness state in all six leaves and modes', () => {
        const generator = new FractionDivisionRelationsGenerator();
        const contexts = new Set<string>();
        for (const operandProfile of ['fraction-by-fraction', 'fraction-by-integer', 'integer-by-fraction'] as const) {
            for (const withEquation of [false, true]) {
                for (const withMultiplication of [false, true]) {
                    for (let seed = 0; seed < 12; seed++) {
                        setSeed(`general-leaf-${operandProfile}-${withEquation}-${withMultiplication}-${seed}`);
                        const {data} = generator.generate({operandProfile, withEquation, withMultiplication});
                        contexts.add(data.context.kind);
                        for (const id of leafIds) {
                            const question = render(id, data, false);
                            const solution = render(id, data, true);
                            expect(question).not.toContain('Validation Error');
                            expect(solution).not.toContain('Validation Error');
                            if (id === 'fractions-division-word-problem') {
                                expect(question).toContain('Equation: ____________________');
                                expect(question).not.toContain('data-evidence="product-relation"');
                                expect(question).not.toContain('×');
                                expect(question.includes('Check by multiplication: ____________________')).toBe(withMultiplication);
                            } else if (withEquation || withMultiplication) {
                                expect(question).toContain('×');
                            }
                            if (withEquation || withMultiplication) {
                                expect(solution).toContain('×');
                            }
                        }
                    }
                }
            }
        }
        expect(contexts).toEqual(new Set(['sharing', 'measured-groups', 'rectangle']));
    });

    it('rejects malformed general arithmetic, models, contexts, and optional witnesses in every leaf', () => {
        setSeed('general-fraction-invalid-leaf');
        const {data} = new FractionDivisionRelationsGenerator().generate({
            operandProfile: 'fraction-by-fraction', withEquation: true, withMultiplication: true
        });
        for (const invalid of [
            undefined,
            {...data, divisor: {numerator: 0, denominator: 3}},
            {...data, reciprocal: {numerator: 0, denominator: 1}},
            {...data, inverse: undefined},
            {...data, model: {...data.model, dividendTicks: data.model.dividendTicks + 1}},
            {...data, context: {kind: 'unknown'}},
            {...data, equationWitness: {...data.equationWitness, product: {numerator: 99, denominator: 1}}},
            {...data, multiplicationWitness: {...data.multiplicationWitness, reconstructedDividend: {numerator: 99, denominator: 1}}}
        ]) {
            for (const id of leafIds) expect(() => render(id, invalid, false)).toThrow(/Validation Error/);
        }
    });

    it('preserves the exact legacy rendering branch in the five expanded leaves', () => {
        const generator = new FractionQuotientModelGenerator();
        for (const relationProfile of [
            'fraction-as-quotient', 'whole-sharing-equation',
            'unit-dividend-basic', 'unit-dividend-inverse', 'unit-dividend-equation',
            'unit-divisor-basic', 'unit-divisor-inverse', 'unit-divisor-equation'
        ] as const) {
            setSeed(`legacy-division-regression-${relationProfile}`);
            const {data} = generator.generate({relationProfile});
            for (const id of leafIds.slice(0, 5)) {
                for (const isSolutionView of [false, true]) {
                    const task = id.replace('fractions-', '') as FractionQuotientTask;
                    const original = renderToStaticMarkup(<FractionQuotientBody data={data} task={task} isSolutionView={isSolutionView} />);
                    expect(render(id, data, isSolutionView)).toBe(original);
                }
            }
            expect(() => render('fractions-division-model-construction', data, false)).toThrow(/Validation Error/);
        }
    });

    it('declares construction as a fixed visual articulation task', () => {
        expect(modelSpec.generalLabels).toEqual([Ability.VisualArticulation]);
        expect(modelSpec.compatibility).toBeUndefined();
    });
});
