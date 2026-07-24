import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeCompareAttributesProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {ShapeCompareAttributesGeneratorConfig, ShapeCompareAttributesGeneratorSchema} from "./spec.ts";
import {Area} from "edugraph-ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class ShapeCompareAttributesGenerator implements ProblemGenerator<ShapeCompareAttributesProblem, ShapeCompareAttributesGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeCompareAttributesGeneratorSchema;

    generate(config: ShapeCompareAttributesGeneratorConfig): ProblemStub | null {
        validateConfigFields('shape-compare-attributes', config, ['classify']);
        const attribute = random() > 0.5 ? 'sides' : 'corners';

        const attrs: Record<string, Record<string, number>> = {
            circle: { sides: 0, corners: 0 },
            triangle: { sides: 3, corners: 3 },
            square: { sides: 4, corners: 4 },
            rectangle: { sides: 4, corners: 4 },
            hexagon: { sides: 6, corners: 6 }
        };

        const allShapes = Object.keys(attrs);

        let shape1: string;
        const label = config.classify;

        switch (label) {
            case Area.Circle:
                shape1 = 'circle';
                break;
            case Area.Triangle:
                shape1 = 'triangle';
                break;
            case Area.Square:
                shape1 = 'square';
                break;
            case Area.Rectangle:
                shape1 = 'rectangle';
                break;
            case Area.Hexagon:
                shape1 = 'hexagon';
                break;
            default:
                return null;
        }

        const val1 = attrs[shape1][attribute];

        // Filter pool to find shape2 that has a different count of the attribute
        const pool = allShapes.filter(s => s !== shape1 && attrs[s][attribute] !== val1);
        if (pool.length === 0) {
            return null;
        }

        const shape2 = pool[Math.floor(random() * pool.length)];
        const val2 = attrs[shape2][attribute];

        const answer = val1 > val2 ? shape1 : shape2;

        const SHAPE_LABELS: Record<string, string> = {
            circle: Area.Circle,
            triangle: Area.Triangle,
            square: Area.Square,
            rectangle: Area.Rectangle,
            hexagon: Area.Hexagon
        };

        return {
            data: {
                attribute: attribute as 'sides' | 'corners',
                shape1,
                shape2,
                val1,
                val2,
                answer
            },
            tags: [label, SHAPE_LABELS[shape2]]
        };
    }
}
