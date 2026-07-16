import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryEnvShapesProblem} from "../../types/problems.ts";
import {Area} from "edugraph-ts";
import {isSubConceptOf} from "../../lib/ontology.ts";
import {random} from "../../lib/random.ts";

export class GeometryEnvShapesGenerator implements ProblemGenerator<GeometryEnvShapesProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const validShapes: string[] = [];
        if (!labels || labels.length === 0) {
            validShapes.push('circle', 'square', 'rectangle');
        } else {
            if (labels.some(l => isSubConceptOf(l, Area.Circle))) validShapes.push('circle');
            if (labels.some(l => isSubConceptOf(l, Area.Square))) validShapes.push('square');
            if (labels.some(l => isSubConceptOf(l, Area.Rectangle))) validShapes.push('rectangle');
            if (validShapes.length === 0) {
                validShapes.push('circle', 'square', 'rectangle');
            }
        }

        const answer = validShapes[Math.floor(random() * validShapes.length)];
        
        const envMap: Record<string, string> = {
            circle: 'clock',
            square: 'window',
            rectangle: 'table'
        };
        const target = envMap[answer];

        return {
            id: `geometry-env-shapes-${target}`,
            data: {
                target,
                answer
            }
        };
    }
}
