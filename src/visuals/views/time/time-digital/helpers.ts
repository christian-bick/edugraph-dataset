import {TimeProblem} from '../../../../types/problems.ts';
import {
    formatDayPeriod,
    TimeViewId,
    validateTimeProblem
} from '../time-presentation.ts';

export interface DigitalTimeParts {
    hour: number;
    minute: number;
    second?: number;
}

export function validateDigitalTimeProblem(
    data: TimeProblem,
    viewId: TimeViewId = 'time-digital'
): DigitalTimeParts {
    const {hour, minute, second} = validateTimeProblem(viewId, data);
    return {hour, minute, ...(second === undefined ? {} : {second})};
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

export function formatTimeClue(parts: DigitalTimeParts, period?: TimeProblem['period']): string {
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
    const periodLabel = formatDayPeriod(period);
    return periodLabel === undefined ? clue : `${clue} ${periodLabel}`;
}
