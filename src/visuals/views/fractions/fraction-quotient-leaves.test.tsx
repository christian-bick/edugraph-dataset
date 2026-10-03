import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionQuotientModelGenerator} from '../../../generators/fraction/fraction-quotient-model/generator.ts';
import type {FractionQuotientProblem} from '../../../types/problems.ts';

const leafIds = [
    'fractions-quotient-interpretation', 'fractions-division-interpretation',
    'fractions-division-execution', 'fractions-division-story-creation',
    'fractions-division-inverse-explanation', 'fractions-division-word-problem'
] as const;
type LeafId = typeof leafIds[number];
const profiles = [
    'fraction-as-quotient', 'whole-sharing-equation',
    'unit-dividend-basic', 'unit-dividend-inverse', 'unit-dividend-equation',
    'unit-divisor-basic', 'unit-divisor-inverse', 'unit-divisor-equation'
] as const;
type Core = ComponentType<{payload: unknown}>;
let cores: Record<LeafId, Core>;

beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [notation, interpretation, execution, creation, inverse, word] = await Promise.all([
        import('./fractions-quotient-interpretation/view.tsx'),
        import('./fractions-division-interpretation/view.tsx'),
        import('./fractions-division-execution/view.tsx'),
        import('./fractions-division-story-creation/view.tsx'),
        import('./fractions-division-inverse-explanation/view.tsx'),
        import('./fractions-division-word-problem/view.tsx')
    ]);
    cores = {
        'fractions-quotient-interpretation': notation.FractionsQuotientInterpretationCore as unknown as Core,
        'fractions-division-interpretation': interpretation.FractionsDivisionInterpretationCore as unknown as Core,
        'fractions-division-execution': execution.FractionsDivisionExecutionCore as unknown as Core,
        'fractions-division-story-creation': creation.FractionsDivisionStoryCreationCore as unknown as Core,
        'fractions-division-inverse-explanation': inverse.FractionsDivisionInverseExplanationCore as unknown as Core,
        'fractions-division-word-problem': word.FractionsDivisionWordProblemCore as unknown as Core
    };
});
afterAll(() => vi.unstubAllGlobals());

const render = (id: LeafId, data: FractionQuotientProblem, isSolutionView: boolean) =>
    renderToStaticMarkup(createElement(cores[id], {payload: {
        problem: {type: 'fraction', data, labels: []}, viewId: id,
        targetLabels: [], isSolutionView, seed: 1
    }}));

describe('fraction quotient leaf contracts', () => {
    it('accepts all eight mathematical profiles in all six leaves and both modes', () => {
        const generator = new FractionQuotientModelGenerator();
        for (const relationProfile of profiles) {
            for (let seed = 0; seed < 12; seed++) {
                setSeed(`fraction-quotient-leaf-${relationProfile}-${seed}`);
                const data = generator.generate({relationProfile}).data;
                for (const id of leafIds) {
                    expect(() => render(id, data, false)).not.toThrow();
                    expect(() => render(id, data, true)).not.toThrow();
                }
            }
        }
    });

    it('rejects an invalid inverse in every leaf', () => {
        setSeed('fraction-quotient-invalid-leaf');
        const data = new FractionQuotientModelGenerator().generate({relationProfile: 'unit-dividend-inverse'}).data;
        const invalid = {...data, inverse: {...data.inverse,
            reconstructedDividend: {numerator: 25, denominator: 1}}};
        for (const id of leafIds) expect(() => render(id, invalid, false)).toThrow(/Validation Error/);
    });
});
