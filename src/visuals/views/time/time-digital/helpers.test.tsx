import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {TimeProblem} from '../../../../types/problems.ts';
import {formatDigitalTime, formatTimeClue, validateDigitalTimeProblem} from './helpers.ts';
import {TimeDigitalCore} from './view.tsx';

const payload = (data: TimeProblem, isSolutionView: boolean): ViewRenderPayload<'time-digital'> => ({
    problem: {type: 'time', data}, viewId: 'time-digital', labels: [], isSolutionView, seed: 9
});

describe('time-digital payload validation', () => {
    it('validates and formats aligned hour and half-hour payloads', () => {
        const hour = validateDigitalTimeProblem({time: '08:00:00', interval: 3600, period: 'a.m.'});
        const halfHour = validateDigitalTimeProblem({time: '14:30:00', interval: 1800, period: 'p.m.'});
        expect(formatDigitalTime(hour)).toBe('8:00');
        expect(formatDigitalTime(halfHour)).toBe('2:30');
        expect(formatTimeClue(halfHour, 'p.m.')).toBe('half past two p.m.');
    });

    it.each([
        {time: '8:00:00', interval: 3600},
        {time: '08:15:00', interval: 1800},
        {time: '24:00:00', interval: 3600},
        {time: '08:00:00', interval: 30},
        {time: '14:30:00', interval: 1800, period: 'a.m.'}
    ])('rejects malformed or misaligned payload %#', data => {
        expect(() => validateDigitalTimeProblem(data as TimeProblem)).toThrow();
    });
});

describe('time-digital direction modes', () => {
    const data: TimeProblem = {time: '14:30:00', interval: 1800, period: 'p.m.'};

    it('keeps the clue and withholds display digits in construction Question Mode', () => {
        const question = renderToStaticMarkup(<TimeDigitalCore config={{direction: 'construction'}} payload={payload(data, false)} />);
        const solution = renderToStaticMarkup(<TimeDigitalCore config={{direction: 'construction'}} payload={payload(data, true)} />);
        expect(question).toContain('half past two p.m.');
        expect(question).not.toContain('Digital display: 2:30 p.m.');
        expect(solution).toContain('Digital display: 2:30 p.m.');
    });

    it('keeps the display and withholds the written response in reading Question Mode', () => {
        const question = renderToStaticMarkup(<TimeDigitalCore config={{direction: 'reading'}} payload={payload(data, false)} />);
        const solution = renderToStaticMarkup(<TimeDigitalCore config={{direction: 'reading'}} payload={payload(data, true)} />);
        expect(question).toContain('Digital display: 2:30 p.m.');
        expect(question).toContain('________________');
        expect(question).not.toContain('half past two');
        expect(solution).toContain('Written time response');
        expect(solution).toContain('2:30 p.m.');
    });

    it('rejects a render without a resolved direction', () => {
        expect(() => renderToStaticMarkup(<TimeDigitalCore config={{}} payload={payload(data, false)} />)).toThrow('A reading or construction direction is required');
    });
});
