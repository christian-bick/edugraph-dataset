import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryCompareAttributesProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometryCompareAttributesGeneratorConfig, GeometryCompareAttributesGeneratorSchema} from "./spec.ts";

export class GeometryCompareAttributesGenerator implements ProblemGenerator<GeometryCompareAttributesProblem, GeometryCompareAttributesGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryCompareAttributesGeneratorSchema;

    generate(config: GeometryCompareAttributesGeneratorConfig): ProblemStub | null {
        const attribute = random() > 0.5 ? 'sides' : 'corners';

        const validShapes = new Set<string>();
        if (config.wantsTriangle) validShapes.add('triangle');
        if (config.wantsSquare) validShapes.add('square');
        if (config.wantsRectangle) validShapes.add('rectangle');
        if (config.wantsPolygon) validShapes.add('hexagon'); // simplistic fallback
        
        let pool = Array.from(validShapes);
        if (pool.length < 2) {
            pool = ['triangle', 'square', 'rectangle', 'hexagon'];
        }

        const idx1 = Math.floor(random() * pool.length);
        let idx2 = Math.floor(random() * pool.length);
        while (idx2 === idx1) {
            idx2 = Math.floor(random() * pool.length);
        }

        const shape1 = pool[idx1];
        const shape2 = pool[idx2];
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
