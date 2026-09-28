import {
    ShapeAssembly, ShapeAssemblyRegion, ShapeCompositionNode, ShapeCompositionRoot,
    ShapeCompositionTargetId
} from '../../../types/problems.ts';

type Point = [number, number];
type Polygon = Extract<ShapeAssemblyRegion, {kind: 'polygon'}>;
type Box = Extract<ShapeAssemblyRegion, {kind: 'box'}>;

const polygon = (points: Point[]): Polygon => ({kind: 'polygon', points});
const midpoint = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const HEXAGON: Point[] = [
    [-1, 0], [-0.5, -Math.sqrt(3) / 2], [0.5, -Math.sqrt(3) / 2],
    [1, 0], [0.5, Math.sqrt(3) / 2], [-0.5, Math.sqrt(3) / 2]
];

function wholeRegion(shape: ShapeCompositionTargetId): ShapeAssemblyRegion {
    switch (shape) {
        case 'rectangle': return polygon([[0, 0], [2, 0], [2, 1], [0, 1]]);
        case 'square': return polygon([[0, 0], [2, 0], [2, 2], [0, 2]]);
        case 'triangle': return polygon([[0, 0], [2, 0], [1, 2]]);
        case 'hexagon': return polygon(HEXAGON.map(point => [...point]));
        case 'trapezoid': return polygon([HEXAGON[0], HEXAGON[3], HEXAGON[4], HEXAGON[5]].map(p => [...p]));
        case 'half-circle': return {kind: 'sector', radius: 1, start: 0, end: Math.PI};
        case 'quarter-circle': return {kind: 'sector', radius: 1, start: 0, end: Math.PI / 2};
        case 'cube': return {kind: 'box', min: [0, 0, 0], max: [2, 2, 2]};
        case 'rectangular-prism': return {kind: 'box', min: [0, 0, 0], max: [4, 2, 2]};
        case 'cone':
        case 'cylinder': return {kind: 'radial-solid', solid: shape, radius: 1,
            start: 0, end: 2 * Math.PI, bottom: 0, top: 2};
    }
}

function polygonParts(region: Polygon, node: ShapeCompositionNode): Polygon[] {
    if (node.kind !== 'composite') return [];
    const p = region.points;
    const count = node.inputs.length;
    if (p.length === 6) {
        return count === 6
            ? p.map((point, i) => polygon([[0, 0], [...point], [...p[(i + 1) % 6]]]))
            : [polygon([p[0], p[3], p[4], p[5]]), polygon([p[3], p[0], p[1], p[2]])];
    }
    if (p.length === 3) {
        const middle = midpoint(p[0], p[1]);
        return [polygon([p[0], middle, p[2]]), polygon([middle, p[1], p[2]])];
    }
    if (count === 3) {
        const middle = midpoint(p[0], p[1]);
        return [polygon([p[0], middle, p[3]]), polygon([middle, p[2], p[3]]),
            polygon([middle, p[1], p[2]])];
    }
    if (node.inputs[0].shape === 'triangle') {
        return [polygon([p[0], p[1], p[2]]), polygon([p[0], p[2], p[3]])];
    }
    const lower = midpoint(p[0], p[1]);
    const upper = midpoint(p[3], p[2]);
    return [polygon([p[0], lower, upper, p[3]]), polygon([lower, p[1], p[2], upper])];
}

function boxParts(region: Box, count: number): Box[] {
    // Two pieces split the longest first-axis extent. Four/eight equal cubes fill the
    // intermediate prism/cube; their side is fixed by its volume and component count.
    const lengths = region.max.map((value, axis) => value - region.min[axis]);
    const side = Math.cbrt(lengths.reduce((volume, length) => volume * length, 1) / count);
    const divisions = count === 2 ? [2, 1, 1] : lengths.map(length => Math.round(length / side));
    const parts: Box[] = [];
    for (let x = 0; x < divisions[0]; x++) {
        for (let y = 0; y < divisions[1]; y++) {
            for (let z = 0; z < divisions[2]; z++) {
                const indices = [x, y, z];
                const min = region.min.map((value, axis) =>
                    value + indices[axis] * lengths[axis] / divisions[axis]) as Box['min'];
                const max = min.map((value, axis) => value + lengths[axis] / divisions[axis]) as Box['max'];
                parts.push({kind: 'box', min, max});
            }
        }
    }
    return parts;
}

function partition(region: ShapeAssemblyRegion, node: ShapeCompositionNode): ShapeAssemblyRegion[] {
    if (node.kind !== 'composite') return [];
    const count = node.inputs.length;
    switch (region.kind) {
        case 'polygon': return polygonParts(region, node);
        case 'box': return boxParts(region, count);
        case 'sector': return node.inputs.map((_, index) => ({...region,
            start: region.start + index * (region.end - region.start) / count,
            end: region.start + (index + 1) * (region.end - region.start) / count}));
        case 'radial-solid': return node.inputs.map((_, index) => region.solid === 'cone'
            ? {...region, start: region.start + index * (region.end - region.start) / count,
                end: region.start + (index + 1) * (region.end - region.start) / count}
            : {...region, bottom: region.bottom + index * (region.top - region.bottom) / count,
                top: region.bottom + (index + 1) * (region.top - region.bottom) / count});
    }
}

function assemble(node: ShapeCompositionNode, region: ShapeAssemblyRegion): ShapeAssembly {
    const regions = partition(region, node);
    if (node.kind === 'primitive') return {region, parts: []};
    if (regions.length !== node.inputs.length) throw new Error('Composition region count does not match its inputs.');
    return {region, parts: node.inputs.map((child, index) => assemble(child, regions[index]))};
}

/** A concrete partition witnessing every relation in the semantic composition tree. */
export const createShapeAssembly = (tree: ShapeCompositionRoot): ShapeAssembly =>
    assemble(tree, wholeRegion(tree.shape));
