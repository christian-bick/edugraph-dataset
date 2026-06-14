import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope, Ability } from "edugraph-ts";

export class CountingGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'counting';
    compatibleRenderers = ['counting-objects', 'counting-inc-dec'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        
        let maxCount = constraints.maxCount || constraints.count;
        if (!maxCount) {
            if (labels.includes(Scope.NumbersSmaller20)) maxCount = 20;
            else if (labels.includes(Scope.NumbersSmaller10)) maxCount = 10;
            else maxCount = 10;
        }

        let incDecType = constraints.type; 
        if (incDecType === undefined && labels.includes(Ability.ProcedureApplication)) {
            // Pick inc or dec randomly if not specified but label says it should be one of them
            incDecType = random() > 0.5 ? 'inc' : 'dec';
        }
        
        const minCount = Math.max(1, maxCount - 9); 
        const numObjects = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        
        // Handle invalid states for decrement (cannot decrement 1 objects in this context)
        if (incDecType === 'dec' && numObjects <= 1) {
            return null;
        }

        let incDecAnswer = undefined;
        if (incDecType === 'inc') incDecAnswer = numObjects + 1;
        if (incDecType === 'dec') incDecAnswer = numObjects - 1;
        
        const problemKey = `${numObjects}_${incDecType || 'simple'}`;
        
        return {
            id: problemKey,
            data: {
                numObjects: numObjects,
                incDecType: incDecType,
                incDecAnswer: incDecAnswer,
                simpleAnswer: numObjects
            }
        };
    }
}
