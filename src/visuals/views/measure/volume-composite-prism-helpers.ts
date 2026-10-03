import type {CompositePrismVolumeProblem, UnitCubeCell} from '../../../types/problems.ts';
import type {Point, PrismBounds} from './volume-unit-cube-helpers.ts';
import {projectCubeCorner} from './volume-unit-cube-helpers.ts';

export type CompositePartId = 'left' | 'right';
export type CompositeCell = {cell: Readonly<UnitCubeCell>; partId: CompositePartId};
export type CompositeFace = {
    cell: Readonly<UnitCubeCell>;
    partId: CompositePartId;
    surface: 'top' | 'front' | 'right';
    points: readonly Point[];
    depth: number;
};

const key = (cell: Readonly<UnitCubeCell>): string => `${cell.column},${cell.row},${cell.layer}`;

export const compositeBounds = (data: CompositePrismVolumeProblem): PrismBounds => ({
    columns: data.parts[0].dimensions.length + data.parts[1].dimensions.length,
    rows: data.parts[0].dimensions.depth,
    layers: Math.max(data.parts[0].dimensions.height, data.parts[1].dimensions.height)
});

export const compositeCells = (data: CompositePrismVolumeProblem): CompositeCell[] =>
    data.parts.flatMap(part => {
        const cells: CompositeCell[] = [];
        for (let layer = 0; layer < part.dimensions.height; layer++) {
            for (let row = 0; row < part.dimensions.depth; row++) {
                for (let column = 0; column < part.dimensions.length; column++) {
                    cells.push({
                        partId: part.id,
                        cell: {
                            column: part.origin.column + column,
                            row: part.origin.row + row,
                            layer: part.origin.layer + layer
                        }
                    });
                }
            }
        }
        return cells;
    });

/** The shared face has area but is not an occupied 3D cell or an exposed surface. */
export const isValidCompositePrism = (data: CompositePrismVolumeProblem): boolean => {
    if (
        data?.kind !== 'composite-prism-volume'
        || data.unitId !== 'generic'
        || !Array.isArray(data.parts)
        || data.parts.length !== 2
        || !data.sharedFace
        || !data.volumeSum
    ) return false;

    const [left, right] = data.parts;
    if (!left || !right || !left.dimensions || !right.dimensions || !left.origin || !right.origin) return false;
    const ld = left.dimensions;
    const rd = right.dimensions;
    if (
        left.id !== 'left' || right.id !== 'right'
        || ![2, 3, 4].includes(ld.length) || ![2, 3, 4].includes(rd.length)
        || ![2, 3].includes(ld.depth) || rd.depth !== ld.depth
        || ![2, 3, 4].includes(ld.height) || ![2, 3, 4].includes(rd.height)
        || ld.height === rd.height
        || left.origin.column !== 0 || left.origin.row !== 0 || left.origin.layer !== 0
        || right.origin.column !== ld.length || right.origin.row !== 0 || right.origin.layer !== 0
    ) return false;

    const leftVolume = ld.length * ld.depth * ld.height;
    const rightVolume = rd.length * rd.depth * rd.height;
    const total = leftVolume + rightVolume;
    const sharedHeight = Math.min(ld.height, rd.height);
    const face = data.sharedFace;
    const sum = data.volumeSum;
    if (
        left.volumeCubicUnits !== leftVolume || right.volumeCubicUnits !== rightVolume
        || face.planeColumn !== ld.length
        || !Array.isArray(face.rowSpan) || face.rowSpan.length !== 2
        || face.rowSpan[0] !== 0 || face.rowSpan[1] !== ld.depth
        || !Array.isArray(face.layerSpan) || face.layerSpan.length !== 2
        || face.layerSpan[0] !== 0 || face.layerSpan[1] !== sharedHeight
        || face.areaSquareUnits !== ld.depth * sharedHeight
        || face.volumeCubicUnits !== 0
        || !Array.isArray(sum.addendsCubicUnits) || sum.addendsCubicUnits.length !== 2
        || sum.addendsCubicUnits[0] !== leftVolume
        || sum.addendsCubicUnits[1] !== rightVolume
        || sum.totalCubicUnits !== total
    ) return false;

    const cells = compositeCells(data);
    if (cells.length !== total || new Set(cells.map(({cell}) => key(cell))).size !== total) return false;

    if (data.calculationEvidence !== undefined) {
        const evidence = data.calculationEvidence;
        if (!evidence || !Array.isArray(evidence.partProducts) || evidence.partProducts.length !== 2
            || !evidence.sumEquation || !Array.isArray(evidence.sumEquation.addendsCubicUnits)
            || evidence.sumEquation.addendsCubicUnits.length !== 2) return false;
        const products = evidence.partProducts;
        const expected = [
            {partId: 'left', factors: [ld.length, ld.depth, ld.height], product: leftVolume},
            {partId: 'right', factors: [rd.length, rd.depth, rd.height], product: rightVolume}
        ] as const;
        for (let index = 0; index < 2; index++) {
            const product = products[index];
            const desired = expected[index]!;
            if (
                !product || product.partId !== desired.partId
                || !Array.isArray(product.factors) || product.factors.length !== 3
                || product.factors.some((factor: number, factorIndex: number) => factor !== desired.factors[factorIndex])
                || product.productCubicUnits !== desired.product
            ) return false;
        }
        if (
            evidence.sumEquation.addendsCubicUnits[0] !== leftVolume
            || evidence.sumEquation.addendsCubicUnits[1] !== rightVolume
            || evidence.sumEquation.resultCubicUnits !== total
        ) return false;
    }
    return true;
};

export const exposedCompositeFaces = (data: CompositePrismVolumeProblem): CompositeFace[] => {
    const bounds = compositeBounds(data);
    const cells = compositeCells(data);
    const occupied = new Set(cells.map(({cell}) => key(cell)));
    const p = (column: number, row: number, layer: number) =>
        projectCubeCorner(bounds, column, row, layer);
    const faces: CompositeFace[] = [];
    for (const {cell, partId} of cells) {
        const {column: x, row: y, layer: z} = cell;
        if (!occupied.has(key({column: x, row: y, layer: z + 1}))) {
            faces.push({cell, partId, surface: 'top', depth: x + y + z + 1,
                points: [p(x, y, z + 1), p(x + 1, y, z + 1), p(x + 1, y + 1, z + 1), p(x, y + 1, z + 1)]});
        }
        if (!occupied.has(key({column: x, row: y + 1, layer: z}))) {
            faces.push({cell, partId, surface: 'front', depth: x + y + z + 1,
                points: [p(x, y + 1, z), p(x + 1, y + 1, z), p(x + 1, y + 1, z + 1), p(x, y + 1, z + 1)]});
        }
        if (!occupied.has(key({column: x + 1, row: y, layer: z}))) {
            faces.push({cell, partId, surface: 'right', depth: x + y + z + 1,
                points: [p(x + 1, y, z), p(x + 1, y + 1, z), p(x + 1, y + 1, z + 1), p(x + 1, y, z + 1)]});
        }
    }
    return faces.sort((a, b) => a.depth - b.depth);
};
