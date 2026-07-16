import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { CountingProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Scope, Area } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class CountingGenerator implements ProblemGenerator<CountingProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        
        let mode = constraints.mode || 'simple';
        if (mode !== 'simple' && mode !== 'one-to-one' && mode !== 'cardinality') {
            return null;
        }
        if (constraints.countOut || constraints.type) {
            return null;
        }
        if (!constraints.mode && labels) {
            if (labels.some(l => isSubConceptOf(l, Area.NumericIdentity)) ||
                labels.some(l => isSubConceptOf(l, Area.ObjectSorting))) {
                return null;
            }
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        let maxCount = constraints.maxCount || constraints.count || resolvedRange.max;
        let minCount = constraints.minCount || (constraints.count !== undefined ? constraints.count : resolvedRange.min);
        
        const numObjects = constraints.count !== undefined ? constraints.count : Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        
        const arrangement = constraints.arrangement || 'line';

        return {
            id: `${mode}-${numObjects}-simple-linear-${arrangement}`,
            data: {
                numObjects: numObjects,
                simpleAnswer: numObjects,
                arrangement
            }
        };
    }
}
