import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {buildCategoryCountRelations} from '../../../generators/counting/category-count-relations.ts';
import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {CountingClassifySortProblem} from '../../../types/problems.ts';
import {CategoryCountView} from './category-count-view.tsx';

const problem = (
    relation: CountingClassifySortProblem['relation'], categories = {A: 3, B: 1, C: 2}
): CountingClassifySortProblem => ({
    categories, relation, numObjects: Object.values(categories).reduce((sum, count) => sum + count, 0),
    ...buildCategoryCountRelations(categories)
});

function render(data: CountingClassifySortProblem, task: 'extremum' | 'order', isSolutionView: boolean) {
    const payload: RenderPayload<AbstractProblem<CountingClassifySortProblem>> = {
        problem: {type: 'counting', data, labels: []}, viewId: 'category-count-example', targetLabels: [],
        isSolutionView, seed: 17
    };
    return renderToStaticMarkup(<CategoryCountView payload={payload} viewId={payload.viewId} task={task} />);
}

describe('category-count leaf projections', () => {
    it.each(['least', 'most', 'ascending', 'descending'] as const)('both leaves accept the complete %s payload', relation => {
        for (const task of ['extremum', 'order'] as const) {
            for (const isSolutionView of [false, true]) {
                const markup = render(problem(relation), task, isSolutionView);
                expect(markup.match(/data-classification-item="true"/g)).toHaveLength(6);
                expect(markup).not.toContain('Invalid problem');
            }
        }
    });

    it.each(['least', 'most'] as const)('withholds the %s endpoint in Question Mode and reveals it in Solution Mode', relation => {
        const question = render(problem(relation), 'extremum', false);
        const solution = render(problem(relation), 'extremum', true);
        expect(question).not.toContain('data-selected');
        expect(question).not.toContain('data-category-count');
        expect(question).not.toContain('counts in digits');
        expect(question).not.toContain('tie');
        expect(solution.match(/data-selected="true"/g)).toHaveLength(1);
        const selectedCard = solution.match(/data-selected="true"[\s\S]*?<span>([^<]+)<\/span>/)?.[1];
        expect(selectedCard).toBe(relation === 'least' ? 'Square' : 'Circle');
    });

    it.each(['ascending', 'descending'] as const)('requests digit counts and the full %s order without leaking either answer', relation => {
        const question = render(problem(relation), 'order', false);
        expect(question).toContain('Write the counts in digits.');
        expect(question).toContain(relation === 'ascending' ? 'fewest to most' : 'most to fewest');
        expect(question.match(/Blank shape and count/g)).toHaveLength(3);
        expect(question).not.toContain('data-category-count');
        expect(question).not.toContain('data-ordered-category');
        expect(question).not.toContain('data-order-group');
        expect(question).not.toContain('data-selected');
        const solution = render(problem(relation), 'order', true);
        const ids = [...solution.matchAll(/data-ordered-category="([^"]+)"/g)].map(match => match[1]);
        const counts = [...solution.matchAll(/data-category-count="true">(\d+)</g)].map(match => Number(match[1]));
        expect(ids).toEqual(relation === 'ascending' ? ['B', 'C', 'A'] : ['A', 'C', 'B']);
        expect(counts).toEqual(relation === 'ascending' ? [1, 2, 3] : [3, 2, 1]);
        expect(solution).toContain(relation === 'ascending' ? '&lt;' : '&gt;');
    });

    it.each([
        ['ascending', {A: 1, B: 1, C: 3}, ['A', 'B', 'C'], 2],
        ['descending', {A: 3, B: 1, C: 3}, ['A', 'C', 'B'], 2],
        ['ascending', {A: 2, B: 2, C: 2}, ['A', 'B', 'C'], 3]
    ] as const)('groups ties and renders tied extrema for %s %j', (relation, categories, orderedIds, endpointCount) => {
        const data = problem(relation, categories);
        const solution = render(data, 'order', true);
        expect([...solution.matchAll(/data-ordered-category="([^"]+)"/g)].map(match => match[1])).toEqual(orderedIds);
        expect(solution).toContain('>=</span>');
        expect(solution.match(/data-category-count="true"/g)).toHaveLength(3);
        expect(render(data, 'order', false)).not.toContain('data-order-group');
        expect(render(data, 'extremum', true).match(/data-selected="true"/g)).toHaveLength(endpointCount);
        expect(render(data, 'extremum', false)).not.toContain('data-selected');
    });

    it('renders deterministically and validates before producing an image', () => {
        const data = problem('ascending');
        expect(render(data, 'order', true)).toEqual(render(data, 'order', true));
        expect(() => render({...data, numObjects: 9}, 'order', true)).toThrow('must agree');
    });
});
