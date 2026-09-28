import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {ShapeAssembly, ShapeAssemblyRegion, ShapeCompositionNode} from '../../../types/problems.ts';
import {ShapeComposeShapesGenerator} from './generator.ts';

const cases = [
    [Area.Rectangle, 2], [Area.Square, 4], [Area.Triangle, 2],
    [Area.Hexagon, 3 * Math.sqrt(3) / 2], [Area.Trapezoid, 3 * Math.sqrt(3) / 4],
    [Area.HalfCircle, Math.PI / 2], [Area.QuarterCircle, Math.PI / 4],
    [Area.Cube, 8], [Area.RectangularPrism, 16], [Area.Cone, 2 * Math.PI / 3], [Area.Cylinder, 2 * Math.PI]
] as const;

function measure(r: ShapeAssemblyRegion): number {
    if (r.kind === 'polygon') return Math.abs(r.points.reduce((sum, p, i) => {
        const q = r.points[(i + 1) % r.points.length];
        return sum + p[0] * q[1] - p[1] * q[0];
    }, 0)) / 2;
    if (r.kind === 'box') return r.max.reduce((volume, value, i) => volume * (value - r.min[i]), 1);
    const area = r.radius ** 2 * (r.end - r.start) / 2;
    return r.kind === 'sector' ? area : area * (r.top - r.bottom) / (r.solid === 'cone' ? 3 : 1);
}

function contains(r: ShapeAssemblyRegion, x: number, y: number, z: number): boolean {
    if (r.kind === 'polygon') {
        const cross = r.points.map((p, i) => {
            const q = r.points[(i + 1) % r.points.length];
            return (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
        });
        return cross.every(value => value > 1e-9) || cross.every(value => value < -1e-9);
    }
    if (r.kind === 'box') return [x, y, z].every((value, i) => value > r.min[i] && value < r.max[i]);
    let angle = Math.atan2(y, x);
    if (angle < 0) angle += 2 * Math.PI;
    if (angle <= r.start || angle >= r.end) return false;
    if (r.kind === 'radial-solid' && (z <= r.bottom || z >= r.top)) return false;
    const radius = r.kind === 'radial-solid' && r.solid === 'cone'
        ? r.radius * (r.top - z) / (r.top - r.bottom) : r.radius;
    return x * x + y * y < radius * radius;
}

function verify(assembly: ShapeAssembly, node: ShapeCompositionNode): void {
    expect(measure(assembly.region)).toBeGreaterThan(0);
    if (node.shape === 'cube' || node.shape === 'small-cube') {
        expect(assembly.region.kind).toBe('box');
        if (assembly.region.kind === 'box') {
            const region = assembly.region;
            const lengths = region.max.map((value, i) => value - region.min[i]);
            expect(lengths[0]).toBeCloseTo(lengths[1]);
            expect(lengths[1]).toBeCloseTo(lengths[2]);
        }
    }
    if (node.kind === 'primitive') {
        expect(assembly.parts).toHaveLength(0);
        return;
    }
    expect(assembly.parts).toHaveLength(node.inputs.length);
    expect(assembly.parts.reduce((sum, part) => sum + measure(part.region), 0)).toBeCloseTo(measure(assembly.region), 10);
    // Independent occupancy sampling checks both uncovered space and overlapping interiors.
    const solid = assembly.region.kind === 'box' || assembly.region.kind === 'radial-solid';
    for (let i = 0; i < 19; i++) for (let j = 0; j < 17; j++) for (let k = 0; k < (solid ? 11 : 1); k++) {
        const x = -1.1 + (i + 0.271) * 5.2 / 19;
        const y = -1.1 + (j + 0.413) * 3.2 / 17;
        const z = -0.1 + (k + 0.619) * 2.2 / 11;
        const parts = assembly.parts.filter(part => contains(part.region, x, y, z)).length;
        expect(parts).toBe(contains(assembly.region, x, y, z) ? 1 : 0);
    }
    assembly.parts.forEach((part, i) => verify(part, node.inputs[i]));
}

describe('shape assembly geometry', () => {
    it.each(cases.flatMap(([shape, size]) => [Scope.SingleLevelComposition, Scope.MultiLevelComposition]
        .map(structure => ({shape, size, structure}))))('partitions $shape / $structure without gaps or overlap', ({shape, size, structure}) => {
        const generator = new ShapeComposeShapesGenerator();
        const data = generator.generate({classify: shape, compositionStructure: structure})!.data;
        expect(measure(data.assembly.region)).toBeCloseTo(size, 10);
        verify(data.assembly, data.compositionTree);
        expect(generator.generate({classify: shape, compositionStructure: structure})!.data).toEqual(data);
    });
});
