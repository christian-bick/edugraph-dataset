import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {StatisticalGraphProblem} from '../../../types/problems.ts';
import {PictureGraphView} from './picture-graph-view.tsx';

const categories = [
    {label: 'Apples', count: 2},
    {label: 'Books', count: 3},
    {label: 'Kites', count: 4}
] as const;

const payload = (data: StatisticalGraphProblem, isSolutionView: boolean): ViewRenderPayload<'data-picture-graph'> => ({
    problem: {type: 'statistics', data}, viewId: 'data-picture-graph', labels: [], isSolutionView, seed: 11
});

const markerCount = (markup: string) => (markup.match(/data-picture-marker="true"/g) ?? []).length;

describe('data-picture-graph modes', () => {
    it('shows raw observations and withholds the grouped graph for organization', () => {
        const data: StatisticalGraphProblem = {
            task: 'organize', graphState: 'to-construct', categories, scale: 1,
            rawObservations: ['Books', 'Apples', 'Kites', 'Books', 'Kites', 'Apples', 'Kites', 'Books', 'Kites'],
            prompt: 'Sort the observations into categories.'
        };
        const question = renderToStaticMarkup(<PictureGraphView mode="classification" payload={payload(data, false)} viewId="data-picture-graph-classification" />);
        const solution = renderToStaticMarkup(<PictureGraphView mode="classification" payload={payload(data, true)} viewId="data-picture-graph-classification" />);
        expect(question).toContain('Shuffled observations');
        expect(markerCount(question)).toBe(0);
        expect(markerCount(solution)).toBe(9);
    });

    it('keeps a complete graph visible while withholding the selected count', () => {
        const data: StatisticalGraphProblem = {
            task: 'categorical-data', graphState: 'complete', categories, scale: 1,
            selectedCategoryIndex: 1, selectedCategory: 'Books', answer: 3
        };
        const question = renderToStaticMarkup(<PictureGraphView mode="interpretation" payload={payload(data, false)} viewId="data-picture-graph-interpretation" />);
        const solution = renderToStaticMarkup(<PictureGraphView mode="interpretation" payload={payload(data, true)} viewId="data-picture-graph-interpretation" />);
        expect(markerCount(question)).toBe(9);
        expect(question).toMatch(/data-response="category-count"[^>]*>____<\/span>/);
        expect(solution).toMatch(/data-response="category-count"[^>]*>3<\/span>/);
    });

    it('shows all three addends and withholds only the total', () => {
        const data: StatisticalGraphProblem = {
            task: 'find-total', graphState: 'complete', categories, scale: 1,
            operation: 'addition', operandIndices: [0, 1, 2], answer: 9, prompt: 'How many items altogether?'
        };
        const question = renderToStaticMarkup(<PictureGraphView mode="arithmetic" payload={payload(data, false)} viewId="data-picture-graph-arithmetic" />);
        const solution = renderToStaticMarkup(<PictureGraphView mode="arithmetic" payload={payload(data, true)} viewId="data-picture-graph-arithmetic" />);
        expect(question).toContain('>2</span>');
        expect(question).toContain('>3</span>');
        expect(question).toContain('>4</span>');
        expect(question.match(/<span>\+<\/span>/g)).toHaveLength(2);
        expect(question).toMatch(/data-response="total"[^>]*><\/span>/);
        expect(solution).toMatch(/data-response="total"[^>]*>9<\/span>/);
    });

    it('preserves scaled legacy construction', () => {
        const data: StatisticalGraphProblem = {
            task: 'categorical-data', graphState: 'complete',
            categories: [{label: 'Apples', count: 4}, {label: 'Books', count: 6}, {label: 'Kites', count: 8}],
            scale: 2, selectedCategoryIndex: 1, selectedCategory: 'Books', answer: 6
        };
        const question = renderToStaticMarkup(<PictureGraphView mode="construction" payload={payload(data, false)} viewId="data-picture-graph" />);
        const solution = renderToStaticMarkup(<PictureGraphView mode="construction" payload={payload(data, true)} viewId="data-picture-graph" />);
        expect(question).toContain('Each symbol = 2 items');
        expect(markerCount(question)).toBe(0);
        expect(markerCount(solution)).toBe(9);
    });
});
