import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {CountingIncDecProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {resolveRangeFromLabels} from "../../lib/ontology.ts";

export class CountingIncDecGenerator implements ProblemGenerator<CountingIncDecProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        // Guard
        const incDecType = constraints.type; 
        if (!incDecType || (incDecType !== 'inc' && incDecType !== 'dec')) {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        let maxCount = constraints.maxCount || constraints.count || resolvedRange.max;
        let minCount = constraints.minCount || (constraints.count !== undefined ? constraints.count : resolvedRange.min);
        
        const numObjects = constraints.count !== undefined ? constraints.count : Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        
        if (incDecType === 'dec' && numObjects <= 1) {
            return null;
        }

        let incDecAnswer = 0;
        if (incDecType === 'inc') incDecAnswer = numObjects + 1;
        if (incDecType === 'dec') incDecAnswer = numObjects - 1;

        const arrangement = constraints.arrangement || 'line';
        const layout = arrangement === 'line' ? 'linear' : arrangement === 'scattered' ? 'scattered' : 'linear';

        return {
            id: `simple-${numObjects}-${incDecType}-linear-${arrangement}`,
            data: {
                numObjects: numObjects,
                incDecType: incDecType as 'inc' | 'dec',
                incDecAnswer: incDecAnswer,
                simpleAnswer: numObjects,
                layout,
                arrangement
            }
        };
    }
}
