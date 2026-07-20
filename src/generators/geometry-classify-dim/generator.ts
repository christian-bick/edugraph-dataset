import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryClassifyDimProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometryClassifyDimGeneratorConfig, GeometryClassifyDimGeneratorSchema} from "./spec.ts";
import {Area} from "edugraph-ts";

export class GeometryClassifyDimGenerator implements ProblemGenerator<GeometryClassifyDimProblem, GeometryClassifyDimGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryClassifyDimGeneratorSchema;

    generate(config: GeometryClassifyDimGeneratorConfig): ProblemStub | null {
        let label = config.classify;
        
        // If no shape label is selected, pick one at random
        if (!label) {
            const allShapes = [
                Area.Circle,
                Area.Square,
                Area.Rectangle,
                Area.Triangle,
                Area.Hexagon,
                Area.Cube,
                Area.Cone,
                Area.Cylinder,
                Area.Sphere
            ];
            label = allShapes[Math.floor(random() * allShapes.length)] as any;
        }

        let shape: string;
        let shapeType: '2d' | '3d';

        switch (label) {
            case Area.Circle:
                shape = 'circle';
                shapeType = '2d';
                break;
            case Area.Square:
                shape = 'square';
                shapeType = '2d';
                break;
            case Area.Rectangle:
                shape = 'rectangle';
                shapeType = '2d';
                break;
            case Area.Triangle:
                shape = 'triangle';
                shapeType = '2d';
                break;
            case Area.Hexagon:
                shape = 'hexagon';
                shapeType = '2d';
                break;
            case Area.Cube:
                shape = 'cube';
                shapeType = '3d';
                break;
            case Area.Cone:
                shape = 'cone';
                shapeType = '3d';
                break;
            case Area.Cylinder:
                shape = 'cylinder';
                shapeType = '3d';
                break;
            case Area.Sphere:
                shape = 'sphere';
                shapeType = '3d';
                break;
            default:
                return null;
        }

        return {
            id: `geometry-classify-dim-${shapeType}-${shape}`,
            data: {
                shapeType,
                shape,
                answer: shapeType
            }
        };
    }
}
