import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometrySameAttributeProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometrySameAttributeGeneratorConfig, GeometrySameAttributeGeneratorSchema} from "./spec.ts";

export class GeometrySameAttributeGenerator implements ProblemGenerator<GeometrySameAttributeProblem, GeometrySameAttributeGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometrySameAttributeGeneratorSchema;

    generate(config: GeometrySameAttributeGeneratorConfig): ProblemStub | null {

        const possible: string[] = [];
        if (config.rollable) possible.push('can-roll');
        if (config.stackable) possible.push('can-stack');
        if (config.flatFaces) possible.push('flat-faces');

        let attribute = 'can-roll';
        if (possible.length > 0) {
            attribute = possible[Math.floor(random() * possible.length)];
        } else {
            const allAttributes = ['can-roll', 'can-stack', 'flat-faces'];
            attribute = allAttributes[Math.floor(random() * allAttributes.length)];
        }
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
