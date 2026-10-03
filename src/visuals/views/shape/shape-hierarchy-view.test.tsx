import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {ShapeCategoryHierarchyGenerator} from '../../../generators/shape/shape-category-hierarchy/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {ShapeCategoryHierarchyProblem} from '../../../types/problems.ts';

let InheritanceCore: typeof import('./shape-inherited-attributes/view.tsx').ShapeInheritedAttributesCore;
let ClassificationCore: typeof import('./shape-hierarchy-classification/view.tsx').ShapeHierarchyClassificationCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    InheritanceCore = (await import('./shape-inherited-attributes/view.tsx')).ShapeInheritedAttributesCore;
    ClassificationCore = (await import('./shape-hierarchy-classification/view.tsx')).ShapeHierarchyClassificationCore;
});
afterAll(() => vi.unstubAllGlobals());

const fixture = (classificationModel: 'inheritance' | 'classification', seed = 7): ShapeCategoryHierarchyProblem => {
    setSeed(`shape-hierarchy-view-${classificationModel}-${seed}`);
    return new ShapeCategoryHierarchyGenerator().generate({classificationModel}).data;
};
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const svg = (markup: string): string => markup.match(/<svg[\s\S]*?<\/svg>/)?.[0] || '';

const renderInheritance = (data: ShapeCategoryHierarchyProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'shape-inherited-attributes'> = {
        problem: {type: 'shape', data, labels: []}, viewId: 'shape-inherited-attributes',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<InheritanceCore config={{}} payload={payload} />);
};
const renderClassification = (data: ShapeCategoryHierarchyProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'shape-hierarchy-classification'> = {
        problem: {type: 'shape', data, labels: []}, viewId: 'shape-hierarchy-classification',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<ClassificationCore config={{}} payload={payload} />);
};

describe('shape hierarchy task projections', () => {
    it('asks for a derived square property without showing it, then explains the inclusion chain', () => {
        const base = fixture('inheritance');
        for (const inheritance of [
            {broader: 'rectangle', narrower: 'square', property: 'four-right-angles'},
            {broader: 'rhombus', narrower: 'square', property: 'four-equal-sides'}
        ] as const) {
            const data = {...base, inheritance};
            const q = visible(renderInheritance(data, false));
            const s = visible(renderInheritance(data, true));
            const property = inheritance.broader === 'rectangle' ? 'four right angles' : 'four equal sides';
            expect(q).toContain(`Every ${inheritance.broader} has ${property}`);
            expect(q).toContain(`Every square is a ${inheritance.broader}`);
            expect(q).not.toContain(`Every square has ${property}`);
            expect(s).toContain(`Every square has ${property} because every square is a ${inheritance.broader}`);
        }
    });

    it('requires the complete diamond and classifies figures in every applicable box', () => {
        const data = fixture('classification');
        const q = renderClassification(data, false);
        const s = renderClassification(data, true);
        expect(visible(q)).toContain('left middle box has four right angles');
        expect(visible(q)).toContain('right middle box has four equal sides');
        expect(visible(q)).toContain('Write each figure letter in every category box it belongs to');
        expect(svg(q)).toContain('Figures: ____');
        expect(svg(q)).not.toContain('>Square</text>');
        expect(svg(q).match(/data-hierarchy-node=/g)).toHaveLength(4);
        expect(svg(s)).toContain('>Square</text>');
        expect(svg(s)).toContain('Figures: B, D');
        expect(svg(s)).toContain('Figures: C, D');
        expect(svg(s)).toContain('Figures: D');
        expect(visible(s)).toContain('A square belongs to both rectangles and rhombuses');
    });

    it('accepts both producer profiles in both leaves and modes', () => {
        for (const classificationModel of ['inheritance', 'classification'] as const) {
            for (let seed = 0; seed < 20; seed++) {
                const data = fixture(classificationModel, seed);
                for (const render of [renderInheritance, renderClassification]) {
                    expect(() => render(data, false)).not.toThrow();
                    expect(() => render(data, true)).not.toThrow();
                }
            }
        }
    });

    it('rejects a malformed direct inclusion in both leaves', () => {
        const data = fixture('classification');
        const invalid = {...data, directInclusions: [
            data.directInclusions[0], data.directInclusions[1], data.directInclusions[2],
            {narrower: 'square', broader: 'quadrilateral'}
        ] as unknown as ShapeCategoryHierarchyProblem['directInclusions']};
        for (const render of [renderInheritance, renderClassification]) {
            expect(() => render(invalid, false)).toThrow(/Validation Error/);
        }
    });
});
