import {TimeProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

export type TimeViewId =
    | 'time-analog'
    | 'time-analog-construction'
    | 'time-digital'
    | 'time-digital-construction';

export interface TimeParts {
    hour24: number;
    hour: number;
    minute: number;
    second?: number;
}

const SUPPORTED_INTERVALS = new Set([1, 60, 1800, 3600]);

export function validateTimeProblem(viewId: TimeViewId, data: TimeProblem): TimeParts {
    validateProblemData(viewId, data, ['secondsSinceMidnight', 'intervalSeconds']);
    if (!Number.isSafeInteger(data.secondsSinceMidnight)
        || data.secondsSinceMidnight < 0
        || data.secondsSinceMidnight >= 24 * 3600) {
        throw new ViewValidationError(
            viewId,
            `Invalid seconds since midnight: ${data.secondsSinceMidnight}`
        );
    }
    if (!Number.isSafeInteger(data.intervalSeconds)
        || !SUPPORTED_INTERVALS.has(data.intervalSeconds)) {
        throw new ViewValidationError(viewId, `Unsupported interval: ${data.intervalSeconds}`);
    }
    if (data.secondsSinceMidnight % data.intervalSeconds !== 0) {
        throw new ViewValidationError(
            viewId,
            `Instant ${data.secondsSinceMidnight} is not aligned to interval ${data.intervalSeconds}.`
        );
    }

    const hour24 = Math.floor(data.secondsSinceMidnight / 3600);
    const remainingSeconds = data.secondsSinceMidnight % 3600;
    const minute = Math.floor(remainingSeconds / 60);
    const second = remainingSeconds % 60;
    if (data.period !== undefined) {
        const expectedPeriod = hour24 < 12 ? 'ante-meridiem' : 'post-meridiem';
        if (data.period !== expectedPeriod) {
            throw new ViewValidationError(
                viewId,
                `Day period ${data.period} does not agree with hour ${hour24}.`
            );
        }
    }

    const normalizedHour = hour24 % 12;
    return {
        hour24,
        hour: normalizedHour === 0 ? 12 : normalizedHour,
        minute,
        ...(data.intervalSeconds === 1 ? {second} : {})
    };
}

export function formatDayPeriod(period: TimeProblem['period']): string | undefined {
    if (period === 'ante-meridiem') return 'a.m.';
    if (period === 'post-meridiem') return 'p.m.';
    return undefined;
}
