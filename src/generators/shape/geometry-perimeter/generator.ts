import {Ability, Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {GeometryPerimeterProblem, PolygonVertex} from '../../../types/problems.ts';
import {
    GeometryPerimeterGeneratorConfig,
    GeometryPerimeterGeneratorSchema
} from './spec.ts';

type PolygonTemplate = Omit<GeometryPerimeterProblem, 'task' | 'perimeter' | 'unit'>;

const POLYGONS = new Map<string, PolygonTemplate>([
    [Area.Triangle, {
        shape: 'triangle',
        vertices: [{x: 0, y: 0}, {x: 4, y: 0}, {x: 0, y: 3}],
        sideLengths: [4, 5, 3]
    }],
    [Area.Quadrilateral, {
        shape: 'quadrilateral',
        vertices: [{x: 0, y: 0}, {x: 4, y: 0}, {x: 7, y: 4}, {x: 3, y: 4}],
        sideLengths: [4, 5, 4, 5]
    }],
    [Area.Pentagon, {
        shape: 'pentagon',
        vertices: [{x: 0, y: 0}, {x: 4, y: 0}, {x: 7, y: 4}, {x: 4, y: 8}, {x: 0, y: 5}],
        sideLengths: [4, 5, 5, 5, 5]
    }],
    [Area.Hexagon, {
        shape: 'hexagon',
        vertices: [{x: 0, y: 3}, {x: 4, y: 0}, {x: 10, y: 0}, {x: 14, y: 3}, {x: 10, y: 6}, {x: 4, y: 6}],
        sideLengths: [5, 6, 5, 5, 6, 5]
    }]
]);

function scaleVertex(vertex: PolygonVertex, factor: number): PolygonVertex {
    return {x: vertex.x * factor, y: vertex.y * factor};
}

export class GeometryPerimeterGenerator implements ProblemGenerator<
    GeometryPerimeterProblem,
    GeometryPerimeterGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = GeometryPerimeterGeneratorSchema;

    generate(
        config: GeometryPerimeterGeneratorConfig
    ): ProblemStub<GeometryPerimeterProblem> | null {
        validateConfigFields('geometry-perimeter', config, ['polygonShape', 'taskAbility']);
        if (config.taskAbility !== Ability.ProcedureExecution) return null;

        const template = POLYGONS.get(config.polygonShape!);
        if (!template) return null;

        const factor = Math.floor(random() * 3) + 1;
        const sideLengths = template.sideLengths.map(length => length * factor);
        return {
            data: {
                task: 'find-perimeter',
                shape: template.shape,
                vertices: template.vertices.map(vertex => scaleVertex(vertex, factor)),
                sideLengths,
                perimeter: sideLengths.reduce((sum, length) => sum + length, 0),
                unit: 'units'
            }
        };
    }
}
