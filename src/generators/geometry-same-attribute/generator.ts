import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometrySameAttributeProblem } from "../../types/problems.ts";

export class GeometrySameAttributeGenerator implements ProblemGenerator<GeometrySameAttributeProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;


        const attribute = constraints.attribute || 'can-roll'; // can-roll, can-stack, flat-faces
        let answer = '';
        if (attribute === 'can-roll') answer = 'sphere'; // sphere rolls easily
        else if (attribute === 'can-stack') answer = 'cube'; // cube is stackable
        else if (attribute === 'flat-faces') answer = 'cube'; // or cone. Let's make the question "Which of these shapes has no flat faces?" -> answer: sphere.
        
        return {
            id: `geometry-same-attr-${attribute}`,
            data: {
                attribute: attribute as 'can-roll' | 'can-stack' | 'flat-faces',
                answer: attribute === 'flat-faces' ? 'sphere' : answer // if 'flat-faces' -> "no flat faces" -> answer is sphere
            }
        };
    }
}
