import {Area} from 'edugraph-ts';
import {PlaneShapeName, ShapeDefinition} from '../../types/problems.ts';

export const PLANE_SHAPE_LABELS = [
    Area.Circle,
    Area.Triangle,
    Area.Square,
    Area.Rectangle,
    Area.Hexagon
] as const;

const SHAPES_BY_LABEL: Readonly<Record<string, PlaneShapeName>> = {
    [Area.Circle]: 'circle',
    [Area.Triangle]: 'triangle',
    [Area.Square]: 'square',
    [Area.Rectangle]: 'rectangle',
    [Area.Hexagon]: 'hexagon'
};

const DEFINITIONS: Readonly<Record<PlaneShapeName, ShapeDefinition>> = {
    circle: {sideCount: 0, vertexCount: 0, closed: true, boundary: 'curved'},
    triangle: {sideCount: 3, vertexCount: 3, closed: true, boundary: 'straight'},
    square: {
        sideCount: 4,
        vertexCount: 4,
        closed: true,
        boundary: 'straight',
        equalSides: true,
        rightAngleCount: 4
    },
    rectangle: {
        sideCount: 4,
        vertexCount: 4,
        closed: true,
        boundary: 'straight',
        rightAngleCount: 4
    },
    hexagon: {sideCount: 6, vertexCount: 6, closed: true, boundary: 'straight'}
};

export function shapeNameFromLabel(label: string): PlaneShapeName | null {
    return SHAPES_BY_LABEL[label] ?? null;
}

export function getShapeDefinition(shape: PlaneShapeName): ShapeDefinition {
    return {...DEFINITIONS[shape]};
}

export function getDefiningAttributeStatements(shape: PlaneShapeName): string[] {
    const definition = DEFINITIONS[shape];
    const statements = [
        'is closed',
        definition.boundary === 'curved'
            ? 'has one curved boundary'
            : `has ${definition.sideCount} straight sides`,
        `has ${definition.vertexCount} vertices`
    ];

    if (definition.equalSides) statements.push('has 4 equal sides');
    if (definition.rightAngleCount) statements.push('has 4 right angles');
    return statements;
}

export const NON_DEFINING_ATTRIBUTE_STATEMENTS = [
    'is blue',
    'points upward',
    'is large'
] as const;
