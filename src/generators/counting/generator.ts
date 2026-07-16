import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { CountingSimpleProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Scope, Area } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class CountingGenerator implements ProblemGenerator<CountingSimpleProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        
        let mode = constraints.mode || 'simple';
        if (mode === 'cardinality' || mode === 'one-to-one' || mode === 'count-out' || mode === 'conservation' || mode === 'classify-count' || mode === 'classify-sort') {
            return null;
        }
        if (constraints.countOut || constraints.type) {
            return null;
        }
        if (!constraints.mode && labels) {
            if (labels.some(l => isSubConceptOf(l, Area.NumericIdentity)) ||
                labels.some(l => isSubConceptOf(l, Area.ObjectSorting)) ||
                (labels.some(l => isSubConceptOf(l, Scope.AdditiveCount)) && labels.some(l => isSubConceptOf(l, Scope.PhysicalNumbers)))) {
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
                mode: mode as 'simple' | 'how-many' | 'cardinality',
                numObjects: numObjects,
                simpleAnswer: numObjects,
                arrangement
            }
        };
    }
}
