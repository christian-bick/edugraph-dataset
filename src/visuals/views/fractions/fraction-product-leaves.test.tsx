import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionProductsGenerator} from '../../../generators/fraction/fraction-products/generator.ts';
import type {FractionProductProblem} from '../../../types/problems.ts';

const leafIds = [
    'fractions-product-partition-interpretation',
    'fractions-product-story-creation',
    'fractions-product-word-problem'
] as const;
type LeafId = typeof leafIds[number];
type Core = ComponentType<{payload: unknown}>;
let cores: Record<LeafId, Core>;

beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [interpretation, creation, word] = await Promise.all([
        import('./fractions-product-partition-interpretation/view.tsx'),
        import('./fractions-product-story-creation/view.tsx'),
        import('./fractions-product-word-problem/view.tsx')
    ]);
    cores = {
        'fractions-product-partition-interpretation': interpretation.FractionsProductPartitionInterpretationCore as unknown as Core,
        'fractions-product-story-creation': creation.FractionsProductStoryCreationCore as unknown as Core,
        'fractions-product-word-problem': word.FractionsProductWordProblemCore as unknown as Core
    };
});
afterAll(() => vi.unstubAllGlobals());

const render = (id: LeafId, data: FractionProductProblem, isSolutionView: boolean) =>
    renderToStaticMarkup(createElement(cores[id], {payload: {
        problem: {type: 'fraction', data, labels: []}, viewId: id,
        targetLabels: [], isSolutionView, seed: 1
    }}));

describe('fraction product leaf contracts', () => {
    it('accepts all three producer profiles in every leaf and mode', () => {
        const generator = new FractionProductsGenerator();
        for (const productProfile of ['fraction-partition', 'fraction-equation', 'mixed-equation'] as const) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(`fraction-product-leaf-${productProfile}-${seed}`);
                const data = generator.generate({productProfile}).data;
                for (const id of leafIds) {
                    expect(() => render(id, data, false)).not.toThrow();
                    expect(() => render(id, data, true)).not.toThrow();
                }
            }
        }
    });

    it('rejects a contradictory partition in every leaf', () => {
        setSeed('fraction-product-invalid-leaf');
        const data = new FractionProductsGenerator().generate({productProfile: 'mixed-equation'}).data;
        const invalid = {...data, partition: {...data.partition,
            availablePartCount: data.partition.availablePartCount + 1}};
        for (const id of leafIds) expect(() => render(id, invalid, false)).toThrow(/Validation Error/);
    });
});
