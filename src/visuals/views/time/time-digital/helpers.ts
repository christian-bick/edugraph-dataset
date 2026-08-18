import {TimeProblem} from '../../../../types/problems.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';

export interface DigitalTimeParts {
    hour: number;
    minute: number;
    second?: number;
}

const SUPPORTED_INTERVALS = new Set([1, 60, 1800, 3600]);

export function validateDigitalTimeProblem(data: TimeProblem): DigitalTimeParts {
    if (typeof data.time !== 'string') {
        throw new ViewValidationError('time-digital', 'Time must be an HH:MM:SS string.');
    }
    if (!Number.isSafeInteger(data.interval) || !SUPPORTED_INTERVALS.has(data.interval)) {
        throw new ViewValidationError('time-digital', `Unsupported interval: ${data.interval}`);
    }

    const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(data.time);
    if (!match) throw new ViewValidationError('time-digital', `Invalid time: ${data.time}`);

    const hour24 = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3]);
    if (hour24 > 23 || minute > 59 || second > 59) {
        throw new ViewValidationError('time-digital', `Invalid time: ${data.time}`);
    }

    const elapsedSeconds = hour24 * 3600 + minute * 60 + second;
    if (elapsedSeconds % data.interval !== 0) {
        throw new ViewValidationError('time-digital', `Time ${data.time} is not aligned to interval ${data.interval}.`);
    }

    if (data.period !== undefined) {
        if (data.period !== 'a.m.' && data.period !== 'p.m.') {
            throw new ViewValidationError('time-digital', `Unsupported day period: ${data.period}`);
        }
        const expectedPeriod = hour24 < 12 ? 'a.m.' : 'p.m.';
        if (data.period !== expectedPeriod) {
            throw new ViewValidationError('time-digital', `Day period ${data.period} does not agree with ${data.time}.`);
        }
    }

    const normalizedHour = hour24 % 12;
    return {
        hour: normalizedHour === 0 ? 12 : normalizedHour,
        minute,
        ...(data.interval === 1 ? {second} : {})
    };
}

export function formatDigitalTime(parts: DigitalTimeParts): string {
    const base = `${parts.hour}:${String(parts.minute).padStart(2, '0')}`;
    return parts.second === undefined ? base : `${base}:${String(parts.second).padStart(2, '0')}`;
}

function numberToWords(value: number): string {
    const small = [
        'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
        'seventeen', 'eighteen', 'nineteen'
    ];
    if (value < 20) return small[value];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
    const remainder = value % 10;
    return remainder === 0 ? tens[Math.floor(value / 10)] : `${tens[Math.floor(value / 10)]}-${small[remainder]}`;
}

export function formatTimeClue(parts: DigitalTimeParts, period?: 'a.m.' | 'p.m.'): string {
    let clue: string;
    if (parts.second !== undefined) {
        clue = `${numberToWords(parts.hour)} hours, ${numberToWords(parts.minute)} minutes, and ${numberToWords(parts.second)} seconds`;
    } else if (parts.minute === 0) {
        clue = `${numberToWords(parts.hour)} o'clock`;
    } else if (parts.minute === 30) {
        clue = `half past ${numberToWords(parts.hour)}`;
    } else {
        clue = `${numberToWords(parts.minute)} minutes past ${numberToWords(parts.hour)}`;
    }
    return period === undefined ? clue : `${clue} ${period}`;
}
