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
    it.each(([1, 2, 5, 10] as const).flatMap(scale => [false, true].map(isSolutionView => ({scale, isSolutionView}))))(
        'shows successive $scale-step labels in solution mode $isSolutionView', ({scale, isSolutionView}) => {
            const html = renderToStaticMarkup(<BarGraphView mode="construction" payload={payload(scale, isSolutionView)}
                axisStep={scale} viewId="data-bar-graph" />);
            for (let index = 0; index <= 8; index++) {
                expect(html).toContain(`>${index * scale}</div>`);
            }
        }
    );

    it.each([undefined, 1, 5, 10] as const)('rejects axis step %s with quantity scale two', axisStep => {
        expect(() => renderToStaticMarkup(<BarGraphView mode="construction" payload={payload(2, false)}
            axisStep={axisStep} viewId="data-bar-graph" />)).toThrow('axis step must match');
    });
});
