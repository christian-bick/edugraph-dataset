import {Area} from 'edugraph-ts';
import {
    PlaneShapeName,
    QuadrilateralSubtypeName,
    ShapeCategoryOption,
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

export const QUADRILATERAL_SUBTYPE_LABELS = [
    Area.Rhombus,
    Area.Rectangle,
    Area.Square
] as const;

const CATEGORY_NAMES: readonly ShapeCategoryOption['category'][] = [
    'triangle',
    'quadrilateral',
    'pentagon',
    'hexagon'
];

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
    shape: QuadrilateralSubtypeName,
    optionOffset: number
): ShapeSubsumptionProblem {
    const categories = CATEGORY_NAMES.map((_, index) =>
        CATEGORY_NAMES[(index + optionOffset) % CATEGORY_NAMES.length]
    );
    const options = categories.map((category, index) => ({
        id: ['A', 'B', 'C', 'D'][index] as ShapeCategoryOption['id'],
        category,
        satisfies: category === 'quadrilateral'
    }));

    return {
        task: 'classify-quadrilateral-subcategory',
        shape,
        attributes: getVisibleShapeAttributes(shape),
        category: 'quadrilateral',
        options,
        answer: options.find(option => option.satisfies)!.id
    };
}
