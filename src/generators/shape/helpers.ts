import {Area} from 'edugraph-ts';
import {
    PlaneShapeName,
    QuadrilateralSubtypeName,
    ShapeDefiningAttribute,
    ShapeDefinition,
    ShapeSubsumptionProblem
} from '../../types/problems.ts';

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
    [Area.Rhombus]: 'rhombus',
    [Area.Square]: 'square',
    [Area.Rectangle]: 'rectangle',
    [Area.Quadrilateral]: 'quadrilateral',
    [Area.Pentagon]: 'pentagon',
    [Area.Hexagon]: 'hexagon'
};

const DEFINITIONS: Readonly<Record<PlaneShapeName, ShapeDefinition>> = {
    circle: {sideCount: 0, vertexCount: 0, closed: true, boundary: 'curved'},
    triangle: {sideCount: 3, vertexCount: 3, closed: true, boundary: 'straight'},
    rhombus: {
        sideCount: 4,
        vertexCount: 4,
        closed: true,
        boundary: 'straight',
        equalSides: true
    },
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
    quadrilateral: {sideCount: 4, vertexCount: 4, closed: true, boundary: 'straight'},
    pentagon: {sideCount: 5, vertexCount: 5, closed: true, boundary: 'straight'},
    hexagon: {sideCount: 6, vertexCount: 6, closed: true, boundary: 'straight'}
};

export function shapeNameFromLabel(label: string): PlaneShapeName | null {
    return SHAPES_BY_LABEL[label] ?? null;
}

export function getShapeDefinition(shape: PlaneShapeName): ShapeDefinition {
    return {...DEFINITIONS[shape]};
}

export function getDefiningAttributes(shape: PlaneShapeName): ShapeDefiningAttribute[] {
    const definition = DEFINITIONS[shape];
    const attributes: ShapeDefiningAttribute[] = [
        {kind: 'closed'},
        {kind: 'boundary', value: definition.boundary},
        {kind: 'side-count', value: definition.sideCount},
        {kind: 'vertex-count', value: definition.vertexCount}
    ];

    if (definition.equalSides) attributes.push({kind: 'equal-sides', value: true});
    if (definition.rightAngleCount) {
        attributes.push({kind: 'right-angle-count', value: definition.rightAngleCount});
    }
    return attributes;
}

export const QUADRILATERAL_SUBTYPE_LABELS = [
    Area.Rhombus,
    Area.Rectangle,
    Area.Square
] as const;

export function getVisibleShapeAttributes(shape: PlaneShapeName): string[] {
    const definition = DEFINITIONS[shape];
    const attributes = definition.boundary === 'curved'
        ? ['one curved boundary', '0 vertices']
        : [`${definition.sideCount} straight sides`, `${definition.vertexCount} vertices`];

    if (definition.equalSides) attributes.push('4 equal sides');
    if (definition.rightAngleCount) attributes.push('4 right angles');
    return attributes;
}

export function createQuadrilateralSubsumptionProblem(
    shape: QuadrilateralSubtypeName
): ShapeSubsumptionProblem {
    return {
        task: 'classify-quadrilateral-subcategory',
        shape,
        definition: getShapeDefinition(shape),
        category: 'quadrilateral'
    };
}
