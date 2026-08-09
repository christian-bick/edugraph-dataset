import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {TimeProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {TimeGeneratorConfig, TimeGeneratorSchema} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../lib/errors.ts";

function resolveInterval(intervalLabel: TimeGeneratorConfig['intervalLabel']): number {
    switch (intervalLabel) {
        case Scope.SecondIntervals:
            return 1;
        case Scope.MinuteIntervals:
            return 60;
        case Scope.HalfHourIntervals:
            return 30 * 60;
        case Scope.HourIntervals:
            return 60 * 60;
        default:
            throw new GeneratorValidationError('time', `Unsupported interval label: ${intervalLabel}`);
    }
}

export class TimeGenerator implements ProblemGenerator<TimeProblem, TimeGeneratorConfig> {
    type: AbstractProblem['type'] = 'time';
    schema = TimeGeneratorSchema;

    generate(config: TimeGeneratorConfig): ProblemStub | null {
        validateConfigFields('time', config, ['intervalLabel', 'requireZero']);
        const interval = resolveInterval(config.intervalLabel);

        const dayInSeconds = 24 * 3600;

        const maxIntervals = Math.floor(dayInSeconds / interval);
        let randomInterval = Math.floor(random() * maxIntervals);
        if (config.intervalLabel === Scope.HalfHourIntervals && randomInterval % 2 === 0) {
            randomInterval += 1;
        }
        let totalSeconds = randomInterval * interval;

        if (config.requireZero && interval === 1) {
            totalSeconds -= totalSeconds % 60;
        }

        const hour = Math.floor(totalSeconds / 3600);
        const remainingSeconds = totalSeconds % 3600;
        const minute = Math.floor(remainingSeconds / 60);
        const second = remainingSeconds % 60;

        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

        return {
            data: {
                time: timeStr,
                interval: interval
            }
        };
    }
}
