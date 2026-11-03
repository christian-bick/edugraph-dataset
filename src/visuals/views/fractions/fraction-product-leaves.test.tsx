import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionProductFixtureGenerator as FractionProductsGenerator, productRelationFixture} from '../../../generators/fraction/fraction-product-fixtures.ts';
import type {FractionProductProblem} from '../../../types/problems.ts';
import {spec as interpretationSpec} from './fractions-product-partition-interpretation/spec.ts';
import {spec as storySpec} from './fractions-product-story-creation/spec.ts';
import {Scope} from 'edugraph-ts';

const leafIds = [
    'fractions-product-partition-interpretation',
    'fractions-product-story-creation',
    'fractions-product-word-problem'
] as const;
const profiles = ['fraction-partition-proper', 'fraction-partition-improper',
    'fraction-equation-proper', 'fraction-equation-improper', 'mixed-equation'] as const;
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
        problem: {type: 'fraction', data: id === 'fractions-product-partition-interpretation' ? data : productRelationFixture(data), labels: []}, viewId: id,
        targetLabels: [], isSolutionView, seed: 1
    }}));

describe('fraction product leaf contracts', () => {
    it.each(profiles)('evidences the declared bars and number lines for %s in both modes', productProfile => {
        const generator = new FractionProductsGenerator();
        expect(interpretationSpec.generalLabels).toContain(Scope.Numberline);
        expect(storySpec.generalLabels).toContain(Scope.Numberline);
        expect(interpretationSpec.generalLabels).toContain(Scope.BarModel);
        expect(storySpec.generalLabels).toContain(Scope.BarModel);
            for (let seed = 0; seed < 20; seed++) {
                setSeed(`fraction-product-leaf-${productProfile}-${seed}`);
                const data = generator.generate({productProfile}).data;
                for (const id of leafIds) {
                    for (const isSolutionView of [false, true]) {
                        const markup = render(id, data, isSolutionView);
                        if (id !== 'fractions-product-word-problem') {
                            expect(markup).toContain('<line x1="132" y1="60" x2="692" y2="60"');
                            expect(markup).toMatch(/<text x="132"[^>]*>0 m<\/text>/);
                            expect(markup).toMatch(/<text[^>]*>1 m<\/text>/);
                            const parts = [...markup.matchAll(/<rect[^>]* width="([^"]+)" height="34" fill="([^"]+)"/g)];
                            expect(parts).toHaveLength(data.partition.equalPartsPerCopy * data.partition.copyCount);
                            expect(parts.filter(part => part[2] === '#7dd3fc')).toHaveLength(data.partition.selectedPartCount);
                            const quantity = data.quantityValue.numerator / data.quantityValue.denominator;
                            const wholeRowWidth = 560 * quantity / Math.ceil(quantity);
                            for (const part of parts) {
                                expect(Number(part[1])).toBeCloseTo(wholeRowWidth / data.partition.equalPartsPerCopy, 12);
                            }
                        }
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
