import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { WritingProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Area } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class WritingCountObjectsGenerator implements ProblemGenerator<WritingProblem> {
    type: AbstractProblem['type'] = 'writing';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints, labels } = input;

        // Guard
        const mode = constraints.mode || 'count-objects';
        if (mode !== 'count-objects') {
            return null;
        }
        if (!constraints.mode && labels && !labels.some(l => isSubConceptOf(l, Area.Numeration))) {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const minNum = constraints.minVal !== undefined ? constraints.minVal : (constraints.min !== undefined ? constraints.min : resolvedRange.min);
        const maxNum = constraints.maxVal !== undefined ? constraints.maxVal : (constraints.max !== undefined ? constraints.max : resolvedRange.max);
        const fixedNumber = constraints.number;
        
        const currentNum = fixedNumber !== undefined ? fixedNumber : Math.floor(random() * (maxNum - minNum + 1)) + minNum;
        
        return {
            id: `count-objects-${currentNum}`,
            data: {
                number: currentNum,
                mode: 'count-objects'
            }
        };
    }
}
