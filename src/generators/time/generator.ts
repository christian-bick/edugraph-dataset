import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { TimeProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Scope } from "edugraph-ts";

export class TimeGenerator implements ProblemGenerator<TimeProblem> {
    type: AbstractProblem['type'] = 'time';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        
        let interval = constraints.interval;
        if (!interval) {
            if (labels.includes(Scope.SecondIntervals)) interval = 1;
            else if (labels.includes(Scope.MinuteIntervals)) interval = 60;
            else interval = 3600;
        }

        const dayInSeconds = 24 * 3600;

        const maxIntervals = Math.floor(dayInSeconds / interval);
        const randomInterval = Math.floor(random() * maxIntervals);
        const totalSeconds = randomInterval * interval;

        const hour = Math.floor(totalSeconds / 3600);
        const remainingSeconds = totalSeconds % 3600;
        const minute = Math.floor(remainingSeconds / 60);
        const second = remainingSeconds % 60;

        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
        
        const problemKey = `${interval}_${timeStr.replace(/:/g, '-')}`;
        
        return {
            id: problemKey,
            data: {
                time: timeStr,
                interval: interval
            }
        };
    }
}
