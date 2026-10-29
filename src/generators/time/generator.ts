import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {TimeIntervalSeconds, TimeProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {TimeGeneratorConfig, TimeGeneratorSchema, spec} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../lib/errors.ts";
import {ClockInterval} from './clock-profile.ts';

function resolveInterval(intervalLabel: string | undefined): TimeIntervalSeconds {
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

/** Explicit legacy mathematical calls remain available; schema resolution emits ClockProfile. */
interface LegacyTimeConfig {
    intervalLabel: string;
    requireZero: boolean;
    requireMultipleOf5: boolean;
    isAnteMeridiem: boolean;
    isPostMeridiem: boolean;
}

export class TimeGenerator implements ProblemGenerator<TimeProblem, TimeGeneratorConfig> {
    type: AbstractProblem['type'] = 'time';
    schema = TimeGeneratorSchema;
    readonly spec = spec;

    generate(config: TimeGeneratorConfig | LegacyTimeConfig): ProblemStub | null {
        validateConfigFields('time', config, [
            ...('intervalLabel' in config ? ['intervalLabel', 'requireZero'] : ['clockProfile']),
            'requireMultipleOf5',
            'isAnteMeridiem',
            'isPostMeridiem'
        ]);
        const legacy = 'intervalLabel' in config;
        const intervalLabel = legacy ? config.intervalLabel : config.clockProfile!.intervalLabel;
        const mode = legacy ? undefined : config.clockProfile!.mode;
        const validModes: Record<ClockInterval, readonly string[]> = {
            [Scope.HourIntervals]: ['whole-hour'], [Scope.HalfHourIntervals]: ['half-hour'],
            [Scope.MinuteIntervals]: ['zero-minutes', 'positive-minutes'],
            [Scope.SecondIntervals]: ['legacy-seconds', 'zero-seconds']
        };
        if (!legacy && !validModes[intervalLabel as ClockInterval]?.includes(mode!)) {
            throw new GeneratorValidationError('time', 'Unsupported clock interval/profile combination.');
        }
        const interval = resolveInterval(intervalLabel);
        if (config.isAnteMeridiem && config.isPostMeridiem) {
            throw new GeneratorValidationError('time', 'A time cannot be both ante meridiem and post meridiem.');
        }
        if (config.requireMultipleOf5 && (intervalLabel !== Scope.MinuteIntervals || mode === 'zero-minutes')) {
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
        } else if (mode === 'zero-minutes' || mode === 'positive-minutes') {
            const firstHour = Math.floor(periodStart / 3600);
            const hourCount = Math.floor((periodEnd - periodStart) / 3600);
            const minuteCount = mode === 'zero-minutes' ? 1 : 59;
            const selection = Math.floor(random() * hourCount * minuteCount);
            const minute = mode === 'zero-minutes' ? 0 : 1 + selection % minuteCount;
            totalSeconds = (firstHour + Math.floor(selection / minuteCount)) * 3600 + minute * 60;
        } else {
            const minInterval = Math.ceil(periodStart / interval);
            const maxIntervalExclusive = Math.floor(periodEnd / interval);
            const alignment = intervalLabel === Scope.HalfHourIntervals ? 2 : 1;
            const residue = intervalLabel === Scope.HalfHourIntervals ? 1 : 0;
            const firstInterval = minInterval
                + ((residue - (minInterval % alignment) + alignment) % alignment);
            const alignedCount = Math.floor((maxIntervalExclusive - 1 - firstInterval) / alignment) + 1;
            if (alignedCount <= 0) return null;

            const randomInterval = firstInterval + Math.floor(random() * alignedCount) * alignment;
            totalSeconds = randomInterval * interval;
        }

        if ((legacy ? config.requireZero : mode === 'zero-seconds') && interval === 1) {
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
