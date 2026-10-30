import {Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {getRandomState} from '../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {ElapsedTimeProblem, TimeIntervalWordProblem} from '../../../types/problems.ts';
import {spec as elapsedSpec} from './time-elapsed/spec.ts';
import {spec as storySpec} from './time-interval-word-problem/spec.ts';

type ClockType = typeof Scope.AnalogClock | typeof Scope.DigitalClock;
let TimeElapsed: typeof import('./time-elapsed/view.tsx').TimeElapsed;
let TimeIntervalWordProblemView: typeof import('./time-interval-word-problem/view.tsx').TimeIntervalWordProblemView;

beforeAll(async () => {
    vi.stubGlobal('window', {});
    [TimeElapsed, TimeIntervalWordProblemView] = await Promise.all([
        import('./time-elapsed/view.tsx').then(module => module.TimeElapsed),
        import('./time-interval-word-problem/view.tsx').then(module => module.TimeIntervalWordProblemView)
    ]);
});

afterAll(() => vi.unstubAllGlobals());

const preparedView = (viewId: string, clockType: ClockType) => ({
    version: 1 as const,
    viewId,
    planHash: 'whole-hour-reference',
    variantHash: clockType,
    config: {clockType},
    labels: [clockType, Scope.NumbersWithZero],
    randomState: 417
});

const text = (markup: string): string => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const elapsedData: ElapsedTimeProblem = {
    startMinutesSinceMidnight: 8 * 60 + 31,
    endMinutesSinceMidnight: 9 * 60 + 27,
    elapsedMinutes: 56,
    minutesToNextHour: 29,
    minutesAfterHour: 27,
    crossesHour: true
};

const storyData: TimeIntervalWordProblem = {
    operation: 'addition',
    startTime: '08:35',
    endTime: '09:27',
    elapsedMinutes: 52,
    referenceHour: 8,
    startOffsetMinutes: 35,
    endOffsetMinutes: 87
};

describe.each([Scope.AnalogClock, Scope.DigitalClock] as const)('whole-hour reference with %s', clockType => {
    it('requires the existing elapsed-time split without giving either interval or the answer', () => {
        const payload = (isSolutionView: boolean): ViewRenderPayload<'time-elapsed'> => ({
            viewId: 'time-elapsed',
            problem: {type: 'time', data: elapsedData, labels: []},
            targetLabels: [],
            isSolutionView,
            seed: 1,
            preparedView: preparedView('time-elapsed', clockType)
        });
        const question = text(renderToStaticMarkup(<TimeElapsed payload={payload(false)} />));
        const solution = text(renderToStaticMarkup(<TimeElapsed payload={payload(true)} />));

        expect(question).toContain('Split the interval at 9:00, then add the two minute intervals.');
        expect(question).toContain('Elapsed time: ____ minutes');
        expect(question).not.toContain('29');
        expect(question).not.toContain('56');
        expect(solution).toContain('8:31 → 9:00: 29 min');
        expect(solution).toContain('9:00 → 9:27: 27 min');
        expect(solution).toContain('29 + 27 = 56 minutes');
        expect(getRandomState()).toBe(417);
        expect(elapsedSpec.generalLabels).toContain(Scope.NumbersWithZero);
    });

    it.each(['addition', 'subtraction'] as const)('requires the existing %s reference without revealing the unknown', operation => {
        const payload = (isSolutionView: boolean): ViewRenderPayload<'time-interval-word-problem'> => ({
            viewId: 'time-interval-word-problem',
            problem: {type: 'time', data: {...storyData, operation}, labels: []},
            targetLabels: [],
            isSolutionView,
            seed: 1,
            preparedView: preparedView('time-interval-word-problem', clockType)
        });
        const question = text(renderToStaticMarkup(<TimeIntervalWordProblemView payload={payload(false)} />));
        const solution = text(renderToStaticMarkup(<TimeIntervalWordProblemView payload={payload(true)} />));

        expect(question).toContain(`Count minutes after 8:00, then write the ${operation} equation.`);
        expect(question).toContain('Answer: __________');
        expect(question).not.toContain('87');
        expect(solution).toContain('Count minutes after 8:00.');
        if (operation === 'addition') {
            expect(question).not.toContain('9:27');
            expect(solution).toContain('35 + 52 = 87');
            expect(solution).toContain('Answer: 9:27');
        } else {
            expect(question).not.toContain('52');
            expect(solution).toContain('87 − 35 = 52');
            expect(solution).toContain('Answer: 52 minutes');
        }
        expect(getRandomState()).toBe(417);
        expect(storySpec.generalLabels).toContain(Scope.NumbersWithZero);
    });
});
