import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {GeometryClassifyDimProblem} from "../../../types/problems.ts";
import {GeometryClassifyDimGeneratorConfig, GeometryClassifyDimGeneratorSchema} from "./spec.ts";
import {Area, Scope} from "edugraph-ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class GeometryClassifyDimGenerator implements ProblemGenerator<GeometryClassifyDimProblem, GeometryClassifyDimGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryClassifyDimGeneratorSchema;

    generate(config: GeometryClassifyDimGeneratorConfig): ProblemStub | null {
        validateConfigFields('geometry-classify-dim', config, ['classify']);
        let label = config.classify;

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

        const dimLabel = shapeType === '2d' ? Scope.TwoDimensional : Scope.ThreeDimensional;

        return {
            id: `geometry-classify-dim-${shapeType}-${shape}`,
            data: {
                shapeType,
                shape,
                answer: shapeType
            },
            tags: [dimLabel, label]
        };
    }
}
