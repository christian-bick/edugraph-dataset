import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope, Ability } from "edugraph-ts";

export class CountingGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'counting';
    compatibleRenderers = ['counting-objects', 'counting-inc-dec'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;
        const maxCount = constraints.maxCount || constraints.count || 10;
        const incDecType = constraints.type; 
        
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
