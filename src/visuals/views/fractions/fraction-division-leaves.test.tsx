import {divisionFixtureRange} from '../../../generators/fraction/fraction-division-relations/range-fixtures.ts';
import {quotientFixtureRange} from '../../../generators/fraction/fraction-quotient-model/range-fixtures.ts';
import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionDivisionRelationsGenerator} from '../../../generators/fraction/fraction-division-relations/generator.ts';
import {FractionQuotientFixtureGenerator as FractionQuotientModelGenerator} from '../../../generators/fraction/fraction-quotient-fixtures.ts';
import {sharingFixture} from '../../../generators/fraction/fraction-quotient-fixtures.ts';
import {FractionQuotientBody, type FractionQuotientTask} from './fraction-quotient-view.tsx';
import {spec as modelSpec} from './fractions-division-model-construction/spec.ts';
import {spec as executionSpec} from './fractions-general-division-execution/spec.ts';
import {Ability, Scope} from 'edugraph-ts';

const leafIds = [
    'fractions-general-division-execution', 'fractions-general-division-interpretation',
    'fractions-general-division-inverse-explanation', 'fractions-general-division-story-creation',
    'fractions-general-division-word-problem', 'fractions-division-model-construction'
] as const;
const legacyLeafIds = ['fractions-division-execution', 'fractions-division-interpretation',
    'fractions-division-inverse-explanation', 'fractions-division-story-creation', 'fractions-division-word-problem'] as const;
type LeafId = typeof leafIds[number] | typeof legacyLeafIds[number];
type Core = ComponentType<{payload: unknown}>;
let cores: Record<LeafId, Core>;

beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [execution, generalExecution, interpretation, generalInterpretation, inverse, generalInverse,
        story, generalStory, word, generalWord, model] = await Promise.all([
        import('./fractions-division-execution/view.tsx'),
        import('./fractions-general-division-execution/view.tsx'),
        import('./fractions-division-interpretation/view.tsx'),
        import('./fractions-general-division-interpretation/view.tsx'),
        import('./fractions-division-inverse-explanation/view.tsx'),
        import('./fractions-general-division-inverse-explanation/view.tsx'),
        import('./fractions-division-story-creation/view.tsx'),
        import('./fractions-general-division-story-creation/view.tsx'),
        import('./fractions-division-word-problem/view.tsx'),
        import('./fractions-general-division-word-problem/view.tsx'),
        import('./fractions-division-model-construction/view.tsx')
    ]);
    cores = {
        'fractions-division-execution': execution.FractionsDivisionExecutionCore as unknown as Core,
        'fractions-general-division-execution': generalExecution.FractionsGeneralDivisionExecutionCore as unknown as Core,
        'fractions-division-interpretation': interpretation.FractionsDivisionInterpretationCore as unknown as Core,
        'fractions-general-division-interpretation': generalInterpretation.FractionsGeneralDivisionInterpretationCore as unknown as Core,
        'fractions-division-inverse-explanation': inverse.FractionsDivisionInverseExplanationCore as unknown as Core,
        'fractions-general-division-inverse-explanation': generalInverse.FractionsGeneralDivisionInverseExplanationCore as unknown as Core,
        'fractions-division-story-creation': story.FractionsDivisionStoryCreationCore as unknown as Core,
        'fractions-general-division-story-creation': generalStory.FractionsGeneralDivisionStoryCreationCore as unknown as Core,
        'fractions-division-word-problem': word.FractionsDivisionWordProblemCore as unknown as Core,
        'fractions-general-division-word-problem': generalWord.FractionsGeneralDivisionWordProblemCore as unknown as Core,
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
        for (const operandProfile of ['fraction-by-fraction-proper', 'fraction-by-fraction-improper',
            'fraction-by-integer-proper', 'fraction-by-integer-improper',
            'integer-by-fraction-proper', 'integer-by-fraction-improper'] as const)
            for (const groupCountProfile of operandProfile === 'fraction-by-integer-proper'
                ? ['zero'] as const : ['zero', 'positive'] as const) {
            for (const withEquation of [false, true]) {
                for (const withMultiplication of [false, true]) {
                    for (let seed = 0; seed < 12; seed++) {
                        setSeed(`general-leaf-${operandProfile}-${withEquation}-${withMultiplication}-${seed}`);
                        const {data} = generator.generate({range: divisionFixtureRange(operandProfile, groupCountProfile), operandProfile, groupCountProfile, withEquation, withMultiplication});
                        contexts.add(data.context.kind);
                        for (const id of leafIds) {
                            const question = render(id, data, false);
                            const solution = render(id, data, true);
                            expect(question).not.toContain('Validation Error');
                            expect(solution).not.toContain('Validation Error');
                            expect(question).toContain('Use the count of complete divisor-sized groups');
                            expect(solution).toContain(`${data.model.completeGroups} complete divisor-sized`);
                            for (const markup of [question, solution]) {
                                expect(/<text[^>]*x="32"[^>]*>0<\/text>/.test(markup))
                                    .toBe(groupCountProfile === 'zero');
                            }
                            if (id === 'fractions-general-division-execution') {
                                expect(executionSpec.generalLabels).toContain(Scope.BarModel);
                                for (const markup of [question, solution]) {
                                    const parts = [...markup.matchAll(/<rect[^>]* y="83" width="([^"]+)" height="29" fill="([^"]+)"/g)];
                                    expect(parts).toHaveLength(data.model.coverageTicks);
                                    expect(parts.filter(part => part[2] === '#a5b4fc')).toHaveLength(data.model.dividendTicks);
                                    for (const part of parts) {
                                        expect(Number(part[1])).toBeCloseTo(700 / data.model.coverageTicks, 12);
                                    }
                                    expect(markup.match(/ y="219" width="[^"]+" height="27"/g))
                                        .toHaveLength(data.model.divisorTicks);
                                    expect(markup).toContain('All rows use the same numerical scale.');
                                }
                            }
                            if (id === 'fractions-division-model-construction') {
                                // The invariant Numberline claim holds for the blank and completed frames.
                                for (const markup of [question, solution]) {
                                    expect(markup).toMatch(/<line x1="32" x2="732" y1="38" y2="38"/);
                                    expect(markup).toMatch(/<text[^>]*>1<\/text>/);
                                }
                            }
                            if (id === 'fractions-general-division-word-problem') {
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
    }, 30_000);

    it('rejects malformed general arithmetic, models, contexts, and optional witnesses in every leaf', () => {
        setSeed('general-fraction-invalid-leaf');
        const {data} = new FractionDivisionRelationsGenerator().generate({range: divisionFixtureRange('fraction-by-fraction-proper', 'zero'),
            operandProfile: 'fraction-by-fraction-proper', groupCountProfile: 'zero', withEquation: true, withMultiplication: true
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
            for (const id of leafIds) for (const solution of [false, true]) {
                expect(() => render(id, invalid, solution)).toThrow(/Validation Error/);
            }
        }
    });

    it('preserves the exact legacy rendering branch in the five expanded leaves', () => {
        const generator = new FractionQuotientModelGenerator();
        for (const relationProfile of [
            'fraction-as-quotient', 'whole-sharing-equation',
            'unit-dividend-basic', 'unit-dividend-inverse', 'unit-dividend-equation',
            'unit-divisor-basic', 'unit-divisor-inverse', 'unit-divisor-equation'
        ] as const) {
            const numericProfiles = relationProfile === 'fraction-as-quotient'
                ? ['proper', 'improper'] as const : relationProfile.startsWith('unit-dividend-')
                    ? ['nonzero'] as const : ['zero', 'nonzero'] as const;
            for (const numericProfile of numericProfiles) {
                setSeed(`legacy-division-regression-${relationProfile}-${numericProfile}`);
                const {data} = generator.generate({range: quotientFixtureRange(relationProfile, numericProfile), relationProfile, numericProfile});
                for (const id of legacyLeafIds) {
                    for (const isSolutionView of [false, true]) {
                        const task = id.replace('fractions-', '') as FractionQuotientTask;
                        const projected = ['fractions-division-execution', 'fractions-division-interpretation'].includes(id) ? data : sharingFixture(data);
                        const original = renderToStaticMarkup(<FractionQuotientBody data={projected} task={task} isSolutionView={isSolutionView} />);
                        expect(render(id, projected, isSolutionView)).toBe(original);
                        if (id === 'fractions-division-execution') {
                            // Even scalar zero retains a proportional one-meter reference bar.
                            // The empty dividend text alone would not evidence BarModel.
                            expect(original).toContain('<svg');
                            if (data.orientation !== 'unit-fraction-by-whole' && data.model.wholeUnitCount === 0) {
                                expect(original).toContain('One-meter partition reference');
                                const parts = [...original.matchAll(/<rect[^>]* y="137" width="([^"]+)" height="42"/g)];
                                expect(parts).toHaveLength(data.model.partsPerWhole);
                                for (const part of parts) {
                                    expect(Number(part[1])).toBeCloseTo(570 / data.model.partsPerWhole, 12);
                                }
                            } else if (data.orientation === 'unit-fraction-by-whole') {
                                expect(original).toContain('all cuts use the same one-meter whole.');
                                expect(original.match(/<rect[^>]* y="42"/g)).toHaveLength(data.model.wholePartitionCount);
                                expect(original.match(/<rect[^>]* y="128"/g)).toHaveLength(data.model.refinedPartitionCount);
                            } else {
                                const parts = [...original.matchAll(/<rect[^>]* height="24"/g)];
                                expect(parts).toHaveLength(data.model.wholeUnitCount * data.model.partsPerWhole);
                                expect(original).toContain('Each meter is cut into');
                            }
                        }
                    }
                }
                expect(() => render('fractions-division-model-construction', data, false)).toThrow(/Validation Error/);
            }
        }
    });

    it('declares construction as a fixed visual articulation task', () => {
        expect(modelSpec.generalLabels).toEqual([
            Ability.VisualArticulation, Scope.ArabicNumerals, Scope.Base10, Scope.Numberline
        ]);
        expect(modelSpec.compatibility).toBeUndefined();
    });
});
