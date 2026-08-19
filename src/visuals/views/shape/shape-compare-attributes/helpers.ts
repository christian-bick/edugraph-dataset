import {
    ShapeCompareAttributesProblem,
    ShapeComparisonAttribute,
    ShapeComparisonName
} from '../../../../types/problems.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';

const TWO_DIMENSIONAL = new Set<ShapeComparisonName>([
    'triangle', 'square', 'rectangle', 'hexagon', 'circle'
]);
const THREE_DIMENSIONAL = new Set<ShapeComparisonName>([
    'cube', 'cone', 'cylinder', 'sphere'
]);
const ATTRIBUTES = new Set<ShapeComparisonAttribute>(['sides', 'vertices', 'faces', 'edges']);

export type ComparisonAppearance = {
    rotation: number;
    scale: number;
    color: string;
};

export function comparisonAppearances(seed: number): readonly [ComparisonAppearance, ComparisonAppearance] {
    const normalizedSeed = Math.abs(seed);
    const colors = ['#2563eb', '#db2777', '#059669', '#d97706'] as const;
    return [
        {
            rotation: -28 + normalizedSeed % 13,
            scale: 0.78 + (normalizedSeed % 3) * 0.04,
            color: colors[normalizedSeed % colors.length]
        },
        {
            rotation: 18 + Math.floor(normalizedSeed / 13) % 15,
            scale: 1.08 + (Math.floor(normalizedSeed / 3) % 3) * 0.04,
            color: colors[(normalizedSeed + 1) % colors.length]
        }
    ];
}

function isShapeForDimension(shape: ShapeComparisonName, dimension: ShapeCompareAttributesProblem['dimension']): boolean {
    return dimension === '2d' ? TWO_DIMENSIONAL.has(shape) : THREE_DIMENSIONAL.has(shape);
}

function attributePhrase(attribute: ShapeComparisonAttribute): string {
    return attribute === 'faces' ? 'flat faces' : attribute;
}

export function validateShapeComparison(data: ShapeCompareAttributesProblem): void {
    const fail = (message: string): never => {
        throw new ViewValidationError('shape-compare-attributes', message);
    };
    if (data.dimension !== '2d' && data.dimension !== '3d') fail('The dimension must be 2d or 3d.');
    if (!ATTRIBUTES.has(data.attribute)) fail('The compared attribute is unsupported.');
    if (data.dimension === '2d' && !['sides', 'vertices'].includes(data.attribute)) {
        fail('A two-dimensional comparison must use sides or vertices.');
    }
    if (data.dimension === '3d' && !['faces', 'vertices', 'edges'].includes(data.attribute)) {
        fail('A three-dimensional comparison must use faces, vertices, or edges.');
    }
    if (!Array.isArray(data.shapes) || data.shapes.length !== 2) fail('Exactly two comparison shapes are required.');
    const [first, second] = data.shapes;
    if (!first || !second) fail('Exactly two comparison shapes are required.');
    if (!isShapeForDimension(first.shape, data.dimension) || !isShapeForDimension(second.shape, data.dimension)) {
        fail('Both shapes must match the supplied dimension.');
    }
    if (first.shape === second.shape) fail('The comparison shapes must be different.');
    if (![first.count, second.count].every(count => Number.isInteger(count) && count >= 0)) {
        fail('Attribute counts must be non-negative integers.');
    }
    if (first.count === second.count) fail('A more-than comparison requires different counts.');
    if (data.relation !== 'more') fail('The comparison relation must be more.');
    const expectedAnswer = first.count > second.count ? first.shape : second.shape;
    if (data.answer !== expectedAnswer) fail('The answer must identify the shape with the greater count.');
    if (typeof data.prompt !== 'string' || data.prompt.trim().length === 0) fail('A comparison prompt is required.');
    if (!data.prompt.toLowerCase().includes(`more ${attributePhrase(data.attribute)}`)) {
        fail('The prompt must name the authored more-than attribute comparison.');
    }
    if (!Array.isArray(data.evidence) || data.evidence.length !== 3
        || data.evidence.some(statement => typeof statement !== 'string' || statement.trim().length === 0)) {
        fail('Exactly three authored evidence statements are required.');
    }
    if (!data.evidence[0].toLowerCase().includes(first.shape) || !data.evidence[0].includes(String(first.count))
        || !data.evidence[1].toLowerCase().includes(second.shape) || !data.evidence[1].includes(String(second.count))) {
        fail('The evidence must state both authored attribute counts.');
    }
    if (!data.evidence[2].includes('>') || !data.evidence[2].toLowerCase().includes(data.answer)) {
        fail('The concluding evidence must state the comparison and winning shape.');
    }
}
