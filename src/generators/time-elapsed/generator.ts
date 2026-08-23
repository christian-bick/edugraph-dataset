import {random} from '../../lib/random.ts';
import {validateConfigFields} from '../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../types/ml-engine.ts';
import {ElapsedTimeProblem} from '../../types/problems.ts';
import {TimeElapsedGeneratorConfig, TimeElapsedGeneratorSchema} from './spec.ts';

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

export class TimeElapsedGenerator implements ProblemGenerator<
    ElapsedTimeProblem,
    TimeElapsedGeneratorConfig
> {
    type: AbstractProblem['type'] = 'time';
    schema = TimeElapsedGeneratorSchema;

    generate(config: TimeElapsedGeneratorConfig): ProblemStub<ElapsedTimeProblem> | null {
        validateConfigFields('time-elapsed', config, ['requireElapsedCount']);
        if (!config.requireElapsedCount) return null;

        const startHour = randomInteger(1, 10);
        const startMinute = randomInteger(31, 55);
        const endHour = startHour + 1;
        const endMinute = randomInteger(5, 30);
        const minutesToNextHour = 60 - startMinute;
        const minutesAfterHour = endMinute;

        return {
            data: {
                startMinutesSinceMidnight: startHour * 60 + startMinute,
                endMinutesSinceMidnight: endHour * 60 + endMinute,
                elapsedMinutes: minutesToNextHour + minutesAfterHour,
                minutesToNextHour,
                minutesAfterHour,
                crossesHour: true
            }
        };
    }
}
