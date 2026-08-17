import {Ability, Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {GeometryPerimeterProblem, PolygonVertex} from '../../../types/problems.ts';
import {
    GeometryPerimeterGeneratorConfig,
    GeometryPerimeterGeneratorSchema
} from './spec.ts';

type PolygonTemplate = {
    shape: 'triangle' | 'quadrilateral' | 'pentagon' | 'hexagon';
    vertices: PolygonVertex[];
    sideLengths: number[];
};

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

const RECTANGLE_DIMENSIONS = [
    [4, 3],
    [5, 2],
    [6, 4],
    [7, 3],
    [8, 5],
    [9, 4],
    [10, 6],
    [12, 5]
] as const;

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
        validateConfigFields('geometry-perimeter', config, [
            'polygonShape',
            'taskAbility'
        ]);
        if (
            config.taskAbility !== Ability.ProcedureExecution
            && config.taskAbility !== Ability.ProcedureInversion
        ) return null;

        if (config.polygonShape === Area.Rectangle) {
            const [length, width] = RECTANGLE_DIMENSIONS[
                Math.floor(random() * RECTANGLE_DIMENSIONS.length)
            ];
            const perimeter = 2 * (length + width);
            const sideLengths: [number, number, number, number] = [length, width, length, width];
            const common = {
                shape: 'rectangle' as const,
                vertices: [{x: 0, y: 0}, {x: length, y: 0}, {x: length, y: width}, {x: 0, y: width}],
                sideLengths,
                length,
                width,
                perimeter,
                unit: 'units' as const,
                formula: 'P = length + width + length + width' as const
            };
            if (config.taskAbility === Ability.ProcedureExecution) {
                if (
                    !config.operationFeatures?.includes(Area.Addition)
                    || !config.operationFeatures.includes(Area.Equation)
                ) return null;
                return {
                    data: {
                        ...common,
                        task: 'rectangle-perimeter-formula',
                        prompt: `Find the perimeter of a rectangle with length ${length} units and width ${width} units.`,
                        questionEquation: `P = ${length} + ${width} + ${length} + ${width} = ?`,
                        solutionEquation: `P = ${length} + ${width} + ${length} + ${width} = ${perimeter}`,
                        answerStatement: `The perimeter is ${perimeter} units.`,
                        explanation: `A rectangle has two lengths and two widths. Add ${length} + ${width} + ${length} + ${width} to get ${perimeter} units.`
                    }
                };
            }
            if (
                !config.operationFeatures?.includes(Area.Addition)
                || !config.operationFeatures.includes(Area.Equation)
            ) return null;
            const unknownDimension = random() < 0.5 ? 'length' : 'width';
            const knownDimension = unknownDimension === 'length' ? 'width' : 'length';
            const knownValue = knownDimension === 'length' ? length : width;
            const missingValue = unknownDimension === 'length' ? length : width;
            const knownSideTotal = knownValue * 2;
            const questionEquation = unknownDimension === 'length'
                ? `P = ? + ${width} + ? + ${width} = ${perimeter}`
                : `P = ${length} + ? + ${length} + ? = ${perimeter}`;
            return {
                data: {
                    ...common,
                    task: 'find-missing-perimeter-dimension',
                    unknownDimension,
                    knownDimension,
                    knownValue,
                    missingValue,
                    knownSideTotal,
                    prompt: `A rectangle has a perimeter of ${perimeter} units and a ${knownDimension} of ${knownValue} units. Find its ${unknownDimension}.`,
                    questionEquation,
                    inverseEquation: `(${perimeter} - ${knownSideTotal}) ÷ 2 = ?`,
                    solutionEquation: `(${perimeter} - ${knownSideTotal}) ÷ 2 = ${missingValue}`,
                    answerStatement: `The ${unknownDimension} is ${missingValue} units.`,
                    explanation: `The two known ${knownDimension} sides total ${knownSideTotal} units. Subtract them from ${perimeter}, then divide the remaining length equally between the two ${unknownDimension} sides to get ${missingValue} units.`
                }
            };
        }

        const template = POLYGONS.get(config.polygonShape!);
        if (!template) return null;

        const factor = Math.floor(random() * 3) + 1;
        const sideLengths = template.sideLengths.map(length => length * factor);
        const perimeter = sideLengths.reduce((sum, length) => sum + length, 0);
        const common = {
            shape: template.shape,
            vertices: template.vertices.map(vertex => scaleVertex(vertex, factor)),
            sideLengths,
            perimeter,
            unit: 'units' as const
        };
        if (config.taskAbility === Ability.ProcedureInversion) {
            const unknownSideIndex = Math.floor(random() * sideLengths.length);
            return {
                data: {
                    ...common,
                    task: 'find-missing-side',
                    unknownSideIndex,
                    knownSideTotal: perimeter - sideLengths[unknownSideIndex]
                }
            };
        }

        return {data: {...common, task: 'find-perimeter'}};
    }
}
