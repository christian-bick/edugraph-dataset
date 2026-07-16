import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { CountingProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class CountingGenerator implements ProblemGenerator<CountingProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        let mode = constraints.mode;
        if (!mode && labels) {
            if (labels.some(l => isSubConceptOf(l, Area.NumericIdentity))) {
                mode = 'conservation';
            }
        }
        if (!mode) mode = 'simple';

        if (mode !== 'simple' && mode !== 'one-to-one' && mode !== 'cardinality' && mode !== 'conservation' && mode !== 'count-out') {
            return null;
        }

        if (constraints.countOut || constraints.type) {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        let maxCount = constraints.maxCount || constraints.count || resolvedRange.max;
        let minCount = constraints.minCount || (constraints.count !== undefined ? constraints.count : resolvedRange.min);
        
        const numObjects = constraints.count !== undefined ? constraints.count : Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        const arrangement = constraints.arrangement || 'line';

        if (mode === 'conservation') {
            return {
                id: `conservation-${numObjects}`,
                data: {
                    numObjects,
                    simpleAnswer: numObjects,
                    arrangement
                }
            };
        }

        if (mode === 'count-out') {
            const totalCount = constraints.totalCount || Math.floor(random() * (resolvedRange.max - numObjects + 1)) + numObjects;
            return {
                id: `count-out-${numObjects}-${totalCount}-${arrangement}`,
                data: {
                    numObjects,
                    simpleAnswer: numObjects,
                    arrangement,
                    totalCount
                }
            };
        }

        return {
            id: `${mode}-${numObjects}-simple-linear-${arrangement}`,
            data: {
                numObjects,
                simpleAnswer: numObjects,
                arrangement
            }
        };
    }
}
