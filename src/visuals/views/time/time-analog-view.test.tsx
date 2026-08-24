import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {TimeProblem} from '../../../types/problems.ts';
import {TimeAnalogView, TimeAnalogViewId} from './time-analog-view.tsx';

const data: TimeProblem = {
    secondsSinceMidnight: 14 * 3600 + 30 * 60,
    intervalSeconds: 1800,
    period: 'post-meridiem'
};

const payload = (
    viewId: TimeAnalogViewId,
    isSolutionView: boolean
): ViewRenderPayload<TimeAnalogViewId> => ({
    problem: {type: 'time', data, labels: []},
    viewId,
    targetLabels: [],
    isSolutionView,
    seed: 9
});

describe('time analog task modes', () => {
    it('keeps clock hands visible and withholds numeral time when reading', () => {
        const question = renderToStaticMarkup(
            <TimeAnalogView mode="reading" viewId="time-analog" payload={payload('time-analog', false)} />
        );
        expect(question).toContain('What time is it?');
        expect(question).toContain('<line');
        expect(question).not.toContain('2:30 p.m.');
    });

    it('keeps numeral time visible and withholds clock hands when constructing', () => {
        const question = renderToStaticMarkup(
            <TimeAnalogView mode="construction" viewId="time-analog-construction" payload={payload('time-analog-construction', false)} />
        );
        const solution = renderToStaticMarkup(
            <TimeAnalogView mode="construction" viewId="time-analog-construction" payload={payload('time-analog-construction', true)} />
        );
        expect(question).toContain('2:30 p.m.');
        expect(question).not.toContain('<line');
        expect(solution).toContain('Short indigo hand = hour');
    });
});
