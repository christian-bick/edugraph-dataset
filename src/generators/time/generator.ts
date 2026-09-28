import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {TimeIntervalSeconds, TimeProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {TimeGeneratorConfig, TimeGeneratorSchema} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../lib/errors.ts";

function resolveInterval(intervalLabel: TimeGeneratorConfig['intervalLabel']): TimeIntervalSeconds {
    switch (intervalLabel) {
        case Scope.SecondIntervals:
            return 1;
        case Scope.MinuteIntervals:
            return 60;
        case Scope.HalfHourIntervals:
            return 1800;
        case Scope.HourIntervals:
            return 3600;
        default:
            throw new GeneratorValidationError('time', `Unsupported interval label: ${intervalLabel}`);
    }
}

export class TimeGenerator implements ProblemGenerator<TimeProblem, TimeGeneratorConfig> {
    type: AbstractProblem['type'] = 'time';
    schema = TimeGeneratorSchema;

    generate(config: TimeGeneratorConfig): ProblemStub | null {
        validateConfigFields('time', config, [
            'intervalLabel',
            'requireZero',
            'requireMultipleOf5',
            'isAnteMeridiem',
            'isPostMeridiem'
        ]);
        const interval = resolveInterval(config.intervalLabel);
        if (config.isAnteMeridiem && config.isPostMeridiem) {
            throw new GeneratorValidationError('time', 'A time cannot be both ante meridiem and post meridiem.');
        }
        if (config.requireMultipleOf5 && config.intervalLabel !== Scope.MinuteIntervals) {
            return null;
        }

        const dayInSeconds = 24 * 3600;
        const halfDayInSeconds = 12 * 3600;
        const periodStart = config.isPostMeridiem ? halfDayInSeconds : 0;
        const periodEnd = config.isAnteMeridiem ? halfDayInSeconds : dayInSeconds;
        let totalSeconds: number;
        if (config.requireMultipleOf5) {
            const firstHour = Math.floor(periodStart / 3600);
            const hourCount = Math.floor((periodEnd - periodStart) / 3600);
            // Use non-ten multiples of five so these samples distinguish five-minute precision.
            const selection = Math.floor(random() * hourCount * 6);
            const hour = firstHour + Math.floor(selection / 6);
            const minute = 5 + (selection % 6) * 10;
            totalSeconds = hour * 3600 + minute * 60;
        } else {
            const minInterval = Math.ceil(periodStart / interval);
            const maxIntervalExclusive = Math.floor(periodEnd / interval);
            const alignment = config.intervalLabel === Scope.HalfHourIntervals ? 2 : 1;
            const residue = config.intervalLabel === Scope.HalfHourIntervals ? 1 : 0;
            const firstInterval = minInterval
                + ((residue - (minInterval % alignment) + alignment) % alignment);
            const alignedCount = Math.floor((maxIntervalExclusive - 1 - firstInterval) / alignment) + 1;
            if (alignedCount <= 0) return null;

            const randomInterval = firstInterval + Math.floor(random() * alignedCount) * alignment;
            totalSeconds = randomInterval * interval;
        }

        if (config.requireZero && interval === 1) {
            totalSeconds -= totalSeconds % 60;
        }

        return {
            data: {
                secondsSinceMidnight: totalSeconds,
                intervalSeconds: interval,
                ...(config.isAnteMeridiem ? {period: 'ante-meridiem' as const} : {}),
                ...(config.isPostMeridiem ? {period: 'post-meridiem' as const} : {})
            }
        };
    }
}
