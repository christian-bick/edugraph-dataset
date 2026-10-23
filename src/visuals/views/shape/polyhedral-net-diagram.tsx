import type {NetPlanarFace, NetPoint2, NetScalar, PolyhedralNetProblem as Problem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {netBaseNames, netDimensionName, netFaceName, netNumber, netVertexName} from './polyhedral-net-format.tsx';

type Point = Readonly<{x: number; y: number}>;
type Box = Readonly<{left: number; right: number; top: number; bottom: number}>;
type Segment = readonly [Point, Point];
type Label = Readonly<{id: string; text: string; x: number; y: number; box: Box; from: Point; leader: boolean}>;
const intersects = (a: Box, b: Box): boolean => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const labelBox = (text: string, x: number, y: number): Box => ({left: x - text.length * 4.4 - 4, right: x + text.length * 4.4 + 4, top: y - 11, bottom: y + 7});

/** Screen geometry only: keep text away from exact supplied edges and other labels. */
function crosses(segment: Segment, box: Box): boolean {
    let low = 0, high = 1;
    const [a, b] = segment, dx = b.x - a.x, dy = b.y - a.y;
    for (const [p, q] of [[-dx, a.x - box.left], [dx, box.right - a.x], [-dy, a.y - box.top], [dy, box.bottom - a.y]]) {
        if (p === 0) { if (q < 0) return false; }
        else { const t = q / p; if (p < 0) low = Math.max(low, t); else high = Math.min(high, t); if (low > high) return false; }
    }
    return true;
}
function placeLabels(requests: readonly Readonly<{id: string; text: string; point: Point}>[], markers: readonly Point[], segments: readonly Segment[], width: number, height: number): Label[] {
    const occupied: Box[] = markers.map(point => ({left: point.x - 6, right: point.x + 6, top: point.y - 6, bottom: point.y + 6}));
    const leaders: Segment[] = [], labels: Label[] = [];
    for (const request of requests) {
        const offsets: Point[] = [{x: 0, y: 0}];
        for (const radius of [20, 34, 50, 68, 90, 116, 146]) for (const [x, y] of [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [-1, -1], [1, 1], [-1, 1]]) offsets.push({x: x * radius, y: y * radius});
        const candidates = offsets.map(offset => ({x: request.point.x + offset.x, y: request.point.y + offset.y})).map(point => ({...point, box: labelBox(request.text, point.x, point.y)}));
        const inside = (box: Box) => box.left >= 8 && box.right <= width - 8 && box.top >= 8 && box.bottom <= height - 8;
        const clear = (box: Box) => inside(box) && !occupied.some(other => intersects(box, other)) && ![...segments, ...leaders].some(segment => crosses(segment, box));
        // The finite face grammar needs few labels. A full screen scan handles skinny nets.
        const chosen = candidates.find(candidate => clear(candidate.box)) ?? (() => {
            for (let y = 20; y <= height - 16; y += 22) for (let x = 28; x <= width - 28; x += 28) { const box = labelBox(request.text, x, y); if (clear(box)) return {x, y, box}; }
            return undefined;
        })();
        if (!chosen) throw new ViewValidationError('polyhedral-net-diagram', 'A face or vertex label cannot be placed without colliding with the diagram.');
        const leader = Math.hypot(chosen.x - request.point.x, chosen.y - request.point.y) > 24;
        const label = {id: request.id, text: request.text, ...chosen, from: request.point, leader};
        if (leader) {
            const dx = chosen.x - request.point.x, dy = chosen.y - request.point.y;
            const distance = Math.hypot(dx, dy), edge = Math.max((chosen.box.right - chosen.box.left) / 2 / Math.abs(dx / distance), 1);
            const vertical = (chosen.box.bottom - chosen.box.top) / 2 / Math.abs(dy / distance);
            const stop = Math.min(edge, vertical) + 3;
            leaders.push([request.point, {x: chosen.x - dx / distance * stop, y: chosen.y - dy / distance * stop}]);
        }
        occupied.push(chosen.box); labels.push(label);
    }
    return labels;
}
const pointKey = (point: NetPoint2): string => `${point.x.numerator}/${point.x.denominator},${point.y.numerator}/${point.y.denominator}`;
const pairs = (points: readonly Point[]): Segment[] => points.map((point, index) => [point, points[(index + 1) % points.length]]);
function transform(points: readonly Point[], width: number, height: number, margin: number) {
    const minX = Math.min(...points.map(point => point.x)), maxX = Math.max(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y)), maxY = Math.max(...points.map(point => point.y));
    const scale = Math.min((width - 2 * margin) / (maxX - minX), (height - 2 * margin) / (maxY - minY));
    const left = (width - (maxX - minX) * scale) / 2, top = (height - (maxY - minY) * scale) / 2;
    return {scale, point: (value: Point): Point => ({x: left + (value.x - minX) * scale, y: height - top - (value.y - minY) * scale})};
}
/** Subtract the exact screen origin before conversion, preserving translated tiny faces. */
const relativeNumber = (value: NetScalar, origin: NetScalar): number => Number(BigInt(value.numerator) * BigInt(origin.denominator) - BigInt(origin.numerator) * BigInt(value.denominator)) / Number(BigInt(value.denominator) * BigInt(origin.denominator));

function DiagramLabels({labels, color}: {labels: readonly Label[]; color: string}) {
    return <g>{labels.map(label => {
        const dx = label.x - label.from.x, dy = label.y - label.from.y, distance = Math.hypot(dx, dy);
        const stop = label.leader ? Math.min((label.box.right - label.box.left) / 2 / Math.abs(dx / distance), (label.box.bottom - label.box.top) / 2 / Math.abs(dy / distance)) + 3 : 0;
        return <g key={label.id} data-role="net-diagram-label" data-label-id={label.id} data-label-box={`${label.box.left},${label.box.top},${label.box.right},${label.box.bottom}`}>
            {label.leader && <line x1={label.from.x} y1={label.from.y} x2={label.x - dx / distance * stop} y2={label.y - dy / distance * stop} stroke={color} strokeWidth="1" data-role="net-label-leader" />}
            <rect x={label.box.left} y={label.box.top} width={label.box.right - label.box.left} height={label.box.bottom - label.box.top} fill="white" fillOpacity="0.95" rx="3" />
            <text x={label.x} y={label.y + 3} textAnchor="middle" fill={color} fontSize="14" fontWeight="600">{label.text}</text>
        </g>;
    })}</g>;
}

export function NetSolidDiagram({data, seed}: {data: Problem; seed: number}) {
    const width = 660, height = 290, side = seed % 2 === 0 ? 1 : -1;
    const origin = data.solid.vertices[0].point;
    const projected = data.solid.vertices.map(vertex => { const {x, y, z} = vertex.point; return {id: vertex.vertexId, x: relativeNumber(x, origin.x) - side * relativeNumber(y, origin.y) * 0.55, y: relativeNumber(z, origin.z) + relativeNumber(y, origin.y) * 0.35}; });
    const screen = transform(projected, width, height, 46), locations = new Map(projected.map(point => [point.id, screen.point(point)]));
    const segments: Segment[] = data.solid.edges.map(edge => [locations.get(edge.vertexIds[0])!, locations.get(edge.vertexIds[1])!]);
    const markers = [...locations.values()];
    const labels = placeLabels(data.solid.vertices.map(vertex => ({id: vertex.vertexId, text: netVertexName(data, vertex.vertexId), point: locations.get(vertex.vertexId)!})), markers, segments, width, height);
    return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{maxWidth: '100%'}} data-role="net-given-solid" aria-label="Depicted closed solid with named vertices">
        {data.solid.faces.map(face => <polygon key={face.faceId} points={face.vertexIds.map(id => { const p = locations.get(id)!; return `${p.x},${p.y}`; }).join(' ')} fill="#cbd5e1" fillOpacity="0.16" />)}
        {segments.map(([a, b], index) => <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#475569" strokeWidth="2" />)}
        {markers.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3" fill="#334155" />)}
        <DiagramLabels labels={labels} color="#334155" />
    </svg>;
}

export function NetPlanarDiagram({data, solved}: {data: Problem; solved: boolean}) {
    const width = 700, height = 420, color = solved ? '#047857' : '#475569';
    const origin = data.net.faces[0].vertices[0].point;
    const xy = (point: NetPoint2): Point => ({x: relativeNumber(point.x, origin.x), y: relativeNumber(point.y, origin.y)});
    const all = data.net.faces.flatMap(face => face.vertices.map(vertex => xy(vertex.point)));
    const feet = data.net.faces.flatMap(face => face.measure.kind === 'triangle' ? [xy(face.measure.altitudeFoot)] : []);
    const screen = transform([...all, ...feet], width, height, 72);
    const byFace = new Map(data.net.faces.map(face => [face.faceId, face.vertices.map(vertex => screen.point(xy(vertex.point)))]));
    const geometry: Segment[] = [...byFace.values()].flatMap(pairs), heightSegments: Segment[] = [];
    const requests: {id: string; text: string; point: Point}[] = data.net.faces.map(face => { const vertices = byFace.get(face.faceId)!; return {id: `face-${face.faceId}`, text: netFaceName(data, face.faceId), point: {x: vertices.reduce((total, p) => total + p.x, 0) / vertices.length, y: vertices.reduce((total, p) => total + p.y, 0) / vertices.length}}; });
    const marks = new Map<string, {point: Point; names: Set<string>}>();
    for (const face of data.net.faces) for (const vertex of face.vertices) {
        const key = pointKey(vertex.point), found = marks.get(key);
        if (found) found.names.add(netVertexName(data, vertex.solidVertexId)); else marks.set(key, {point: screen.point(xy(vertex.point)), names: new Set([netVertexName(data, vertex.solidVertexId)])});
    }
    const altitudes = data.net.faces.flatMap(face => {
        if (face.measure.kind !== 'triangle') return [];
        const foot = screen.point(xy(face.measure.altitudeFoot)), apex = byFace.get(face.faceId)![face.measure.apexVertexIndex];
        heightSegments.push([foot, apex]);
        requests.push({id: `height-${face.faceId}`, text: netDimensionName(data, face, 'H'), point: {x: (foot.x + apex.x) / 2, y: (foot.y + apex.y) / 2}});
        const a = byFace.get(face.faceId)![face.measure.baseEdgeIndex], b = byFace.get(face.faceId)![(face.measure.baseEdgeIndex + 1) % face.vertices.length];
        heightSegments.push([a, foot], [b, foot]);
        const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
        const hx = (apex.x - foot.x) / Math.hypot(apex.x - foot.x, apex.y - foot.y), hy = (apex.y - foot.y) / Math.hypot(apex.x - foot.x, apex.y - foot.y);
        return [{id: face.faceId, foot, apex, a, b, mark: `${foot.x + ux * 7},${foot.y + uy * 7} ${foot.x + ux * 7 + hx * 7},${foot.y + uy * 7 + hy * 7} ${foot.x + hx * 7},${foot.y + hy * 7}`}];
    });
    requests.push(...[...marks].map(([key, value]) => ({id: `vertex-${key}`, text: [...value.names].join('/'), point: value.point})));
    const labels = placeLabels(requests, [...marks.values()].map(value => value.point).concat(altitudes.map(value => value.foot)), [...geometry, ...heightSegments], width, height);
    return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{maxWidth: '100%'}} data-role="net-planar-diagram" data-scale={screen.scale} aria-label={solved ? 'Completed connected net' : 'Given connected net'}>
        {data.net.faces.map(face => <polygon key={face.faceId} points={byFace.get(face.faceId)!.map(p => `${p.x},${p.y}`).join(' ')} fill={solved ? '#d1fae5' : '#f1f5f9'} stroke={color} strokeWidth="1.6" data-role="net-planar-face" data-face-id={face.faceId} />)}
        {data.net.hinges.map(hinge => {
            const sourceEdge = data.solid.edges.find(edge => edge.edgeId === hinge.solidEdgeId)!;
            const face = data.net.faces.find(value => value.faceId === hinge.incidences[0].faceId)!, vertices = byFace.get(face.faceId)!;
            const [a, b] = sourceEdge.vertexIds.map(id => vertices[face.vertices.findIndex(vertex => vertex.solidVertexId === id)]);
            return <line key={hinge.solidEdgeId} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeDasharray="6 4" strokeWidth="2.2" data-role="net-hinge" data-solid-edge-id={sourceEdge.edgeId} />;
        })}
        {altitudes.map(value => <g key={value.id} data-role="net-face-altitude"><line x1={value.a.x} y1={value.a.y} x2={value.foot.x} y2={value.foot.y} stroke={color} strokeDasharray="2 4" /><line x1={value.b.x} y1={value.b.y} x2={value.foot.x} y2={value.foot.y} stroke={color} strokeDasharray="2 4" /><line x1={value.foot.x} y1={value.foot.y} x2={value.apex.x} y2={value.apex.y} stroke={color} strokeDasharray="3 3" /><polyline points={value.mark} fill="none" stroke={color} strokeWidth="1.4" /></g>)}
        <DiagramLabels labels={labels} color={color} />
    </svg>;
}

/** Each card has an independent frame, so the given congruence key reveals no unfolding. */
export function NetFaceCard({data, face, construction}: {data: Problem; face: NetPlanarFace; construction: boolean}) {
    const width = 212, height = 190, measure = face.measure, b = netNumber(measure.base), h = netNumber(measure.height);
    const baseIndex = measure.baseEdgeIndex, ids = face.vertices.map((_, index) => face.vertices[(baseIndex + index) % face.vertices.length].solidVertexId);
    const offset = measure.kind === 'triangle' ? netNumber(measure.baseOffset) : 0;
    const raw = measure.kind === 'rectangle' ? [{x: 0, y: 0}, {x: b, y: 0}, {x: b, y: h}, {x: 0, y: h}] : [{x: 0, y: 0}, {x: b, y: 0}, {x: offset, y: h}];
    const screen = transform([...raw, {x: offset, y: 0}], width, height, 43), vertices = raw.map(screen.point), foot = screen.point({x: offset, y: 0});
    const segments = pairs(vertices), requests = vertices.map((point, index) => ({id: `point-${index}`, text: netVertexName(data, ids[index]), point}));
    const start = vertices[0], end = vertices[1];
    requests.push({id: 'base-code', text: netDimensionName(data, face, 'B'), point: {x: (start.x + end.x) / 2, y: start.y + 20}});
    if (measure.kind === 'rectangle') {
        const index = (measure.adjacentEdgeIndex - baseIndex + vertices.length) % vertices.length, a = vertices[index], b = vertices[(index + 1) % vertices.length];
        requests.push({id: 'height-code', text: netDimensionName(data, face, 'H'), point: {x: (a.x + b.x) / 2 + 20, y: (a.y + b.y) / 2}});
    }
    else {
        segments.push([foot, vertices[2]], [start, foot], [end, foot]);
        if (construction) segments.push([{x: start.x, y: start.y + 30}, {x: foot.x, y: foot.y + 30}]);
        requests.push({id: 'height-code', text: netDimensionName(data, face, 'H'), point: {x: foot.x + 20, y: (foot.y + vertices[2].y) / 2}});
        if (construction) requests.push({id: 'offset-code', text: netDimensionName(data, face, 'O'), point: {x: (start.x + foot.x) / 2, y: start.y + 40}});
    }
    const labels = placeLabels(requests, vertices.concat(measure.kind === 'triangle' ? [foot] : []), segments, width, height);
    const [baseStart, baseEnd] = netBaseNames(data, face);
    return <div className="rounded-lg border border-slate-200 bg-white p-2" data-role="net-detached-face" data-face-id={face.faceId}>
        <p className="text-center font-semibold">{netFaceName(data, face.faceId)}</p>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={`Detached ${measure.kind} face ${netFaceName(data, face.faceId)}`}>
            <polygon points={vertices.map(point => `${point.x},${point.y}`).join(' ')} fill="#f1f5f9" stroke="#475569" strokeWidth="1.6" />
            {measure.kind === 'triangle' && <g data-role="net-card-altitude"><line x1={Math.min(start.x, foot.x)} y1={foot.y} x2={Math.max(end.x, foot.x)} y2={foot.y} stroke="#64748b" strokeDasharray="2 4" /><line x1={foot.x} y1={foot.y} x2={vertices[2].x} y2={vertices[2].y} stroke="#64748b" strokeDasharray="3 3" /><polyline points={`${foot.x + 6},${foot.y} ${foot.x + 6},${foot.y - 6} ${foot.x},${foot.y - 6}`} fill="none" stroke="#64748b" />{construction && <line x1={start.x} y1={start.y + 30} x2={foot.x} y2={foot.y + 30} stroke="#94a3b8" data-role="net-card-offset" />}</g>}
            <DiagramLabels labels={labels} color="#334155" />
        </svg>
        <p className="text-center text-xs text-slate-500">Base {baseStart}{baseEnd}{measure.kind === 'triangle' ? '; dashed perpendicular face height' : '; perpendicular rectangle sides'}</p>
    </div>;
}
