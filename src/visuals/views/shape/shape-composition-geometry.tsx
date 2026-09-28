import {ShapeAssembly, ShapeAssemblyProblem, ShapeAssemblyRegion, ShapeCompositionNode} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

type Point3 = [number, number, number];
type Point2 = [number, number];
type Face = {points: Point3[]; outline: boolean; edges?: Point3[][]};
export type DrawingFrame = {width: number; height: number};
const COLORS = ['#93c5fd', '#fcd34d', '#86efac', '#c4b5fd', '#fda4af', '#67e8f9', '#fdba74', '#cbd5e1'];

const planar = (region: ShapeAssemblyRegion) => region.kind === 'polygon' || region.kind === 'sector';
const project = (p: Point3, flat: boolean): Point2 => flat
    ? [p[0], -p[1]] : [p[0] - 0.65 * p[1], 0.35 * (p[0] + p[1]) - p[2]];
const depth = (face: Face): number => face.points.reduce((sum, p) => sum + 0.65 * p[0] + p[1] + 0.5775 * p[2], 0) / face.points.length;

// Outward face normals face the camera along the null direction of the projection.
function visible(face: Face): boolean {
    const [a, b, c] = face.points;
    const u = b.map((value, axis) => value - a[axis]);
    const v = c.map((value, axis) => value - a[axis]);
    const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    return 0.65 * normal[0] + normal[1] + 0.5775 * normal[2] > 1e-10;
}

function arc(radius: number, start: number, end: number, height: number): Point3[] {
    const steps = Math.max(8, Math.ceil((end - start) / (2 * Math.PI) * 64));
    return Array.from({length: steps + 1}, (_, i) => {
        const angle = start + i * (end - start) / steps;
        return [radius * Math.cos(angle), radius * Math.sin(angle), height];
    });
}

/** Tessellation and projection only: all component regions come from the producer. */
function faces(region: ShapeAssemblyRegion): Face[] {
    if (region.kind === 'polygon') return [{points: region.points.map(([x, y]) => [x, y, 0]), outline: true}];
    if (region.kind === 'sector') return [{points: [[0, 0, 0], ...arc(region.radius, region.start, region.end, 0)], outline: true}];
    if (region.kind === 'box') {
        const [x, y, z] = region.min;
        const [X, Y, Z] = region.max;
        return [
            [[x, Y, z], [X, Y, z], [X, y, z], [x, y, z]],
            [[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]],
            [[x, y, z], [X, y, z], [X, y, Z], [x, y, Z]],
            [[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]],
            [[X, Y, z], [x, Y, z], [x, Y, Z], [X, Y, Z]],
            [[x, Y, z], [x, y, z], [x, y, Z], [x, Y, Z]]
        ].map(points => ({points: points as Point3[], outline: true}));
    }
    const lower = arc(region.radius, region.start, region.end, region.bottom);
    const upper = region.solid === 'cone'
        ? lower.map((): Point3 => [0, 0, region.top])
        : arc(region.radius, region.start, region.end, region.top);
    const partial = region.end - region.start < 2 * Math.PI - 1e-8;
    const result: Face[] = [{points: (partial ? [[0, 0, region.bottom] as Point3, ...lower] : [...lower]).reverse(), outline: true}];
    if (region.solid === 'cylinder') {
        result.push({points: partial ? [[0, 0, region.top], ...upper] : upper, outline: true});
    }
    const sides: Face[] = lower.slice(1).map((point, index) => ({
        points: region.solid === 'cone' ? [lower[index], point, upper[index]]
            : [lower[index], point, upper[index + 1], upper[index]], outline: false,
        edges: region.solid === 'cone' ? [[lower[index], point]]
            : [[lower[index], point], [upper[index], upper[index + 1]]]
    }));
    sides.forEach((face, index) => {
        if (partial && index === 0 || !visible(sides[(index + sides.length - 1) % sides.length])) {
            face.edges!.push([lower[index], upper[index]]);
        }
        if (partial && index === sides.length - 1 || !visible(sides[(index + 1) % sides.length])) {
            face.edges!.push([lower[index + 1], upper[index + 1]]);
        }
    });
    result.push(...sides);
    if (partial) for (const index of [0, lower.length - 1]) {
        const points: Point3[] = region.solid === 'cone'
            ? [[0, 0, region.bottom], lower[index], upper[index]]
            : [[0, 0, region.bottom], lower[index], upper[index], [0, 0, region.top]];
        result.push({points: index === 0 ? points : points.reverse(), outline: true});
    }
    return result;
}

function bounds(region: ShapeAssemblyRegion) {
    const points = faces(region).flatMap(face => face.points.map(p => project(p, planar(region))));
    const x = points.map(p => p[0]);
    const y = points.map(p => p[1]);
    const left = Math.min(...x), right = Math.max(...x), top = Math.min(...y), bottom = Math.max(...y);
    return {width: right - left, height: bottom - top, x: (left + right) / 2, y: (top + bottom) / 2};
}

export const assemblyPieceFrame = (parts: ShapeAssembly[]): DrawingFrame => {
    const boxes = parts.map(part => bounds(part.region));
    return {width: Math.max(...boxes.map(box => box.width)), height: Math.max(...boxes.map(box => box.height))};
};

export function ShapeAssemblyDrawing({assembly, showParts = false, neutral = false, frame, label}: {
    assembly: ShapeAssembly; showParts?: boolean; neutral?: boolean; frame?: DrawingFrame; label: string;
}) {
    const box = bounds(assembly.region);
    const scale = Math.min(184 / (frame?.width ?? box.width), 144 / (frame?.height ?? box.height));
    const selected = showParts && assembly.parts.length ? assembly.parts : [assembly];
    const flat = planar(assembly.region);
    const projected = selected.flatMap((part, index) => faces(part.region).filter(face => flat || visible(face)).map(face => ({
        face, fill: neutral ? '#e2e8f0' : COLORS[index % COLORS.length]
    }))).sort((a, b) => depth(a.face) - depth(b.face));
    const points = (vertices: Point3[]) => vertices.map(point => {
        const [x, y] = project(point, flat);
        return `${105 + (x - box.x) * scale},${85 + (y - box.y) * scale}`;
    }).join(' ');
    return <svg viewBox="0 0 210 170" className="w-full h-full" role="img" aria-label={label}>
        {projected.map(({face, fill}, index) => <g key={index}>
            <polygon points={points(face.points)} fill={fill} stroke={face.outline ? '#334155' : fill}
                strokeWidth={face.outline ? 1.8 : 0.5} strokeLinejoin="round" />
            {face.edges?.map((edge, i) => <polyline key={i} points={points(edge)} fill="none"
                stroke="#334155" strokeWidth="1.8" strokeLinejoin="round" />)}
        </g>)}
    </svg>;
}

function validRegion(region: ShapeAssemblyRegion): boolean {
    if (!region || typeof region !== 'object') return false;
    if (region.kind === 'polygon') return Array.isArray(region.points) && region.points.length >= 3
        && region.points.length <= 6 && region.points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
    if (region.kind === 'box') return [region.min, region.max].every(p =>
        Array.isArray(p) && p.length === 3 && p.every(Number.isFinite))
        && region.max.every((value, axis) => value > region.min[axis]);
    if (region.kind !== 'sector' && region.kind !== 'radial-solid') return false;
    if (![region.radius, region.start, region.end].every(Number.isFinite)
        || region.radius <= 0 || region.end <= region.start || region.end - region.start > 2 * Math.PI + 1e-8) return false;
    return region.kind === 'sector' || (['cone', 'cylinder'].includes(region.solid)
        && [region.bottom, region.top].every(Number.isFinite) && region.top > region.bottom);
}

export function validateShapeAssembly(data: ShapeAssemblyProblem): void {
    const visit = (assembly: ShapeAssembly, node: ShapeCompositionNode): boolean => {
        if (!assembly || !validRegion(assembly.region) || !Array.isArray(assembly.parts)) return false;
        const inputs = node.kind === 'composite' ? node.inputs : [];
        return assembly.parts.length === inputs.length && inputs.every((input, i) => visit(assembly.parts[i], input));
    };
    if (!visit(data.assembly, data.compositionTree)) {
        throw new ViewValidationError('shape-compose-shapes-construction', 'Assembly regions must be finite and correspond to the composition tree.');
    }
}
