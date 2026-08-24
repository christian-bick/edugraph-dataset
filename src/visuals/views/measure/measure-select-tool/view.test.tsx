import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MeasurementToolSelectionProblem} from '../../../../types/problems.ts';
import {MeasureSelectToolCore} from './view.tsx';

const payload = (
    data: MeasurementToolSelectionProblem,
    isSolutionView: boolean
): ViewRenderPayload<'measure-select-tool'> => ({
    problem: {type: 'measurement', data, labels: []},
    viewId: 'measure-select-tool',
    targetLabels: [],
    isSolutionView,
    seed: 17
});

describe('measure-select-tool view', () => {
    it('owns the fixed candidates and reveals only the calculated suitable tool', () => {
        const data: MeasurementToolSelectionProblem = {object: 'door', correctTool: 'tape'};
        const question = renderToStaticMarkup(<MeasureSelectToolCore
            config={{}}
            payload={payload(data, false)}
        />);
        const solution = renderToStaticMarkup(<MeasureSelectToolCore
            config={{}}
            payload={payload(data, true)}
        />);

        expect(question).toContain('Ruler');
        expect(question).toContain('Measuring tape');
        expect(question).not.toContain('Best choice');
        expect(solution).toContain('Measuring tape');
        expect(solution.match(/Best choice/g)).toHaveLength(1);
    });
});
