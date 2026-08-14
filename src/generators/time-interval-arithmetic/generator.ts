import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../lib/errors.ts';
import {random} from '../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../types/ml-engine.ts';
import {TimeIntervalWordProblem} from '../../types/problems.ts';
import {
    TimeIntervalArithmeticGeneratorConfig,
    TimeIntervalArithmeticGeneratorSchema
} from './spec.ts';

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const formatTime = (hour: number, minute: number): string =>
    `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

export class TimeIntervalArithmeticGenerator implements ProblemGenerator<
    TimeIntervalWordProblem,
    TimeIntervalArithmeticGeneratorConfig
> {
    type: AbstractProblem['type'] = 'time';
    schema = TimeIntervalArithmeticGeneratorSchema;

    generate(
        config: TimeIntervalArithmeticGeneratorConfig
    ): ProblemStub<TimeIntervalWordProblem> | null {
        validateConfigFields('time-interval-arithmetic', config, ['operation']);
        if (config.operation !== Area.Addition && config.operation !== Area.Subtraction) {
            return null;
        }

        const startHour = randomInteger(1, 9);
        const startMinute = randomInteger(35, 54);
        const endHour = startHour + 1;
        const endMinute = randomInteger(5, 30);
        const elapsedMinutes = 60 - startMinute + endMinute;
        const startTime = formatTime(startHour, startMinute);
        const endTime = formatTime(endHour, endMinute);
        const operation = config.operation === Area.Addition ? 'addition' : 'subtraction';

        return {
            tags: [config.operation],
            data: {
                operation,
                story: operation === 'addition'
                    ? `A science club starts at ${Number(startTime.slice(0, 2))}:${startTime.slice(3)} and lasts ${elapsedMinutes} minutes. What time does it end?`
                    : `Art class starts at ${Number(startTime.slice(0, 2))}:${startTime.slice(3)} and ends at ${Number(endTime.slice(0, 2))}:${endTime.slice(3)}. How many minutes does it last?`,
                startTime,
                endTime,
                elapsedMinutes,
                referenceHour: startHour,
                startOffsetMinutes: startMinute,
                endOffsetMinutes: 60 + endMinute,
                unknown: operation === 'addition' ? 'end-time' : 'elapsed-minutes'
            }
        };
    }
}
