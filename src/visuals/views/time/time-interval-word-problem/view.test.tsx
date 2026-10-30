import {renderToStaticMarkup} from 'react-dom/server';
import {Area, Scope} from 'edugraph-ts';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {getRandomState, setSeed} from '../../../../lib/random.ts';
import type {TimeIntervalWordProblem} from '../../../../types/problems.ts';

let Core: typeof import('./view.tsx').TimeIntervalWordProblemCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./view.tsx')).TimeIntervalWordProblemCore;
});
afterAll(() => vi.unstubAllGlobals());

function original(operation: typeof Area.Addition | typeof Area.Subtraction): TimeIntervalWordProblem {
    return {operation: operation === Area.Addition ? 'addition' : 'subtraction',
        startTime: '08:42', endTime: '09:14', elapsedMinutes: 32,
        referenceHour: 8, startOffsetMinutes: 42, endOffsetMinutes: 74};
}
function render(data: TimeIntervalWordProblem, solution: boolean, clockType: typeof Scope.AnalogClock | typeof Scope.DigitalClock = Scope.AnalogClock) {
    return renderToStaticMarkup(<Core config={{clockType}} payload={{
        problem: {type: 'time', data, labels: []}, targetLabels: [], viewId: 'time-interval-word-problem',
        seed: 1702282119, isSolutionView: solution
    }} />);
}
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

describe('time interval whole-hour reference', () => {
    it('makes the original8:00 reference an explicit zero-minute quantity without changing the interval or clock geometry', () => {
        const data = original(Area.Addition);
        setSeed(1702282119);
        const state = getRandomState();
        const question = render(data, false);
        const solution = render(data, true);
        expect(text(question)).toContain('Count minutes after 8:00 (0 minutes into the hour), then write the addition equation.');
        expect(text(solution)).toContain('Count minutes after 8:00 (0 minutes into the hour).');
        expect(text(question)).toContain('8:42');
        expect(text(question)).toContain('32 minutes');
        expect(text(question)).not.toContain('9:14');
        expect(text(question)).not.toContain('42 + 32 = 74');
        expect(question).not.toContain('rotate(277 50 50)');
        expect(text(solution)).toContain('42 + 32 = 74');
        expect(text(solution)).toContain('Answer: 9:14');
        expect(solution).toContain('rotate(277 50 50)');
        expect(solution).toContain('rotate(84 50 50)');
        expect(getRandomState()).toBe(state);
    });

    it.each([Scope.AnalogClock, Scope.DigitalClock] as const)('preserves unknowns and normalized equations with %s', clockType => {
        for (const operation of [Area.Addition, Area.Subtraction] as const) {
            const data = original(operation);
            const question = text(render(data, false, clockType));
            const solution = text(render(data, true, clockType));
            expect(question).toContain('8:00 (0 minutes into the hour)');
            expect(solution).toContain('8:00 (0 minutes into the hour)');
            if (operation === Area.Addition) {
                expect(question).not.toContain('9:14');
                expect(question).toContain('32 minutes');
                expect(solution).toContain('42 + 32 = 74');
                expect(solution).toContain('Answer: 9:14');
            } else {
                expect(question).toContain('8:42');
                expect(question).toContain('9:14');
                expect(question).not.toContain('32 minutes');
                expect(question).not.toContain('74 − 42 = 32');
                expect(solution).toContain('74 − 42 = 32');
                expect(solution).toContain('Answer: 32 minutes');
            }
        }
    });

    it.each([1, 9])('uses the actual canonical whole-hour reference%i:00 in both modes', referenceHour => {
        const data: TimeIntervalWordProblem = {operation: 'addition', startTime: `${String(referenceHour).padStart(2, '0')}:35`,
            endTime: `${String(referenceHour + 1).padStart(2, '0')}:05`, elapsedMinutes: 30, referenceHour,
            startOffsetMinutes: 35, endOffsetMinutes: 65};
        for (const solution of [false, true]) {
            const rendered = text(render(data, solution));
            expect(rendered).toContain(`${referenceHour}:00 (0 minutes into the hour)`);
            expect(rendered).not.toContain('8:00');
            if (solution) expect(rendered).toContain('35 + 30 = 65');
            else expect(rendered).not.toContain('35 + 30 = 65');
        }
    });
});
