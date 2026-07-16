import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryCompareAttributesProblem } from "../../types/problems.ts";

export class GeometryCompareAttributesGenerator implements ProblemGenerator<GeometryCompareAttributesProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;


        const attribute = constraints.attribute || 'sides'; // sides, corners
        const shape1 = constraints.shape1 || 'rectangle';
        const shape2 = constraints.shape2 || 'triangle';
        
        const attrs: Record<string, Record<string, number>> = {
            rectangle: { sides: 4, corners: 4 },
            triangle: { sides: 3, corners: 3 },
            square: { sides: 4, corners: 4 },
            hexagon: { sides: 6, corners: 6 }
        };

        const val1 = attrs[shape1]?.[attribute] || 4;
        const val2 = attrs[shape2]?.[attribute] || 3;
        const answer = val1 > val2 ? shape1 : shape2;

        return {
            id: `geometry-compare-attr-${attribute}-${shape1}-${shape2}`,
            data: {
                attribute: attribute as 'sides' | 'corners',
                shape1,
                shape2,
                val1,
                val2,
                answer
            }
        };
    }
}
