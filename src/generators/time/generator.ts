import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {TimeProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {isSubConceptOf} from "../../lib/ontology.ts";

export class TimeGenerator implements ProblemGenerator<TimeProblem> {
    type: AbstractProblem['type'] = 'time';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        
        let interval = 3600; // default HourIntervals
        if (constraints.interval) {
            interval = constraints.interval;
        } else if (labels && labels.some(l => isSubConceptOf(l, Scope.SecondIntervals))) {
            interval = 1;
        } else if (labels && labels.some(l => isSubConceptOf(l, Scope.MinuteIntervals))) {
            interval = 60;
        } else if (labels && labels.some(l => isSubConceptOf(l, Scope.HourIntervals))) {
            interval = 3600;
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
