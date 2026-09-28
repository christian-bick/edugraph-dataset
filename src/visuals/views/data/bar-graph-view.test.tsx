import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {BarGraphView} from './bar-graph-view.tsx';
import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {StatisticalGraphProblem} from '../../../types/problems.ts';

const payload = (scale: StatisticalGraphProblem['scale'], isSolutionView: boolean): RenderPayload<AbstractProblem<StatisticalGraphProblem>> => ({
    problem: {type: 'statistics', labels: [], data: {
        categories: [{id: 'apple', count: 3 * scale}, {id: 'book', count: 7 * scale}, {id: 'kite', count: 4 * scale}],
        scale
    }},
    viewId: 'data-bar-graph', targetLabels: [], isSolutionView, seed: 17
});

describe('bar-graph axis evidence', () => {
    it.each([false, true])('shows successive five-step labels in solution mode %s', isSolutionView => {
        const html = renderToStaticMarkup(<BarGraphView mode="construction" payload={payload(5, isSolutionView)}
            requireFiveStepAxis={true} viewId="data-bar-graph" />);
        for (const value of [0, 5, 10, 15, 20, 25, 30, 35, 40]) {
            expect(html).toContain(`>${value}</div>`);
        }
    });

    it('rejects a requested five-step axis with an incompatible scale', () => {
        expect(() => renderToStaticMarkup(<BarGraphView mode="construction" payload={payload(2, false)}
            requireFiveStepAxis={true} viewId="data-bar-graph" />)).toThrow('five-step axis');
    });
});
