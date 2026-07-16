import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { CountingCardinalityProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Scope, Ability } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class CountingCardinalityGenerator implements ProblemGenerator<CountingCardinalityProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'cardinality') {
            return null;
        }
        if (!constraints.mode && labels) {
            if (!labels.some(l => isSubConceptOf(l, Scope.AdditiveCount)) ||
                !labels.some(l => isSubConceptOf(l, Scope.PhysicalNumbers)) ||
                !labels.some(l => isSubConceptOf(l, Ability.ProcedureUnderstanding))) {
                return null;
            }
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        let maxCount = constraints.maxCount || constraints.count || resolvedRange.max;
        let minCount = constraints.minCount || (constraints.count !== undefined ? constraints.count : resolvedRange.min);
        
        const numObjects = constraints.count !== undefined ? constraints.count : Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        
        const arrangement = constraints.arrangement || 'line';

        return {
            id: `cardinality-${numObjects}-simple-linear-${arrangement}`,
            data: {
                mode: 'cardinality',
                numObjects: numObjects,
                simpleAnswer: numObjects,
                arrangement
            }
        };
    }
}
