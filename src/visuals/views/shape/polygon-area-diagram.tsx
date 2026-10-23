import type {PolygonAreaDissectionProblem as Problem, PolygonAreaTriangle} from '../../../types/problems.ts';
import {areaCellName, areaPointName} from './polygon-area-format.tsx';

type XY = {x: number; y: number};
type Rect = {left: number; right: number; top: number; bottom: number};
export const areaScreenPoint = (data: Problem, id: string): XY => {
    const point = data.points.find(candidate => candidate.id === id)!;
    return {x: point.x.numerator / point.x.denominator, y: point.y.numerator / point.y.denominator};
};
export function areaBounds(points: readonly XY[]) {
    return {minX: Math.min(...points.map(point => point.x)), maxX: Math.max(...points.map(point => point.x)), minY: Math.min(...points.map(point => point.y)), maxY: Math.max(...points.map(point => point.y))};
}
const overlaps = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const leaderEnd = (from: XY, box: Rect): XY => {
    const center = {x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2};
    const dx = from.x - center.x, dy = from.y - center.y;
    const ratio = Math.max(Math.abs(dx) / ((box.right - box.left) / 2 + 3), Math.abs(dy) / ((box.bottom - box.top) / 2 + 3));
    return {x: center.x + dx / ratio, y: center.y + dy / ratio};
};
/** Screen-space segment/label collision; it never establishes geometric facts. */
function crosses(a: XY, b: XY, box: Rect) {
    let low = 0, high = 1;
    const dx = b.x - a.x, dy = b.y - a.y;
    for (const [p, q] of [[-dx, a.x - box.left], [dx, box.right - a.x], [-dy, a.y - box.top], [dy, box.bottom - a.y]]) {
        if (p === 0) {if (q < 0) return false;}
        else {const r = q / p; if (p < 0) low = Math.max(low, r); else high = Math.min(high, r); if (low > high) return false;}
    }
    return true;
}
const stroke = '#475569', green = '#047857';

/** Groups only the supplied parallel relations, so one edge receives one mark style. */
function parallelClasses(data: Problem): number[][] {
    const classes: Set<number>[] = [];
    for (const pair of data.source.shapeFacts.parallelEdgePairs) {
        const incident = classes.filter(group => group.has(pair.firstEdgeIndex) || group.has(pair.secondEdgeIndex));
        const merged = new Set([pair.firstEdgeIndex, pair.secondEdgeIndex, ...incident.flatMap(group => [...group])]);
        for (const group of incident) classes.splice(classes.indexOf(group), 1);
        classes.push(merged);
    }
    return classes.map(group => [...group].sort((a, b) => a - b)).sort((a, b) => a[0] - b[0]);
}

/** Geometry is projected with ONE scale in both directions. Supplied point IDs choose all edges. */
export function PolygonAreaDiagram({data, boundary, cells, sourceCuts, showDimensions, shapeMarks, solution, scale, heightCell}: {
    data: Problem; boundary: readonly string[]; cells: readonly {id: string; vertices: readonly string[]; label: string}[];
    sourceCuts: boolean; showDimensions: boolean; shapeMarks: boolean; solution: boolean; scale?: number; heightCell?: PolygonAreaTriangle;
}) {
    const references = showDimensions ? data.context.dimensions.flatMap(dimension => {
        const measure = data.measures.find(item => item.measureId === dimension.measureId)!;
        return [measure.segment.fromId, measure.segment.toId];
    }) : [];
    const ids = [...new Set([...boundary, ...cells.flatMap(cell => cell.vertices), ...references, ...(heightCell ? [heightCell.height.footId, heightCell.height.apexId] : [])])];
    const bounds = areaBounds(ids.map(id => areaScreenPoint(data, id)));
    const complex = ids.length > 8;
    const ppu = scale ?? Math.min((complex ? 620 : 520) / (bounds.maxX - bounds.minX), (complex ? 420 : 280) / (bounds.maxY - bounds.minY));
    const labelWidth = (text: string) => text.length * 8 + 4;
    const margin = Math.max(50, ...cells.map(cell => labelWidth(cell.label) + 14), ...ids.map(id => labelWidth(areaPointName(data, id)) + 14));
    const width = Math.max(180, (bounds.maxX - bounds.minX) * ppu + margin * 2), height = Math.max(150, (bounds.maxY - bounds.minY) * ppu + margin * 2);
    const at = (id: string): XY => {const point = areaScreenPoint(data, id); return {x: margin + (point.x - bounds.minX) * ppu, y: margin + (bounds.maxY - point.y) * ppu};};
    const polygon = (vertices: readonly string[]) => vertices.map(id => {const point = at(id); return `${point.x},${point.y}`;}).join(' ');
    const edges = boundary.map((id, index) => [at(id), at(boundary[(index + 1) % boundary.length])] as const);
    const cutEdges = sourceCuts ? data.source.cuts.map(cut => [at(cut.fromId), at(cut.toId)] as const) : [];
    const allEdges = [...edges, ...cutEdges, ...cells.flatMap(cell => cell.vertices.map((id, index) => [at(id), at(cell.vertices[(index + 1) % cell.vertices.length])] as const))];
    const occupied: Rect[] = [];
    const markers = ids.map(id => {const point = at(id); return {left: point.x - 4, right: point.x + 4, top: point.y - 4, bottom: point.y + 4};});
    const inPanel = (box: Rect) => box.left >= 2 && box.right < width - 2 && box.top >= 2 && box.bottom < height - 2;
    const free = (box: Rect) => inPanel(box) && !occupied.some(other => overlaps(other, box)) && !markers.some(other => overlaps(other, box));
    const centered = (x: number, y: number, text: string) => ({x, y, box: {left: x - labelWidth(text) / 2, right: x + labelWidth(text) / 2, top: y - 14, bottom: y + 4}});
    const framePlacement = (text: string, point: XY) => {
        const options: ReturnType<typeof centered>[] = [];
        for (let y = 24; y <= height - 8; y += 24) for (const x of [5 + labelWidth(text) / 2, width - 5 - labelWidth(text) / 2]) options.push(centered(x, y, text));
        for (let x = labelWidth(text) / 2 + 8; x < width - labelWidth(text) / 2 - 4; x += labelWidth(text) + 12) for (const y of [24, height - 12]) options.push(centered(x, y, text));
        options.sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y));
        return options.find(option => free(option.box) && !occupied.some(box => crosses(point, {x: option.x, y: option.y - 5}, box))) ?? options.find(option => free(option.box)) ?? options[0];
    };
    // Cell labels are reserved FIRST. Thin cells use an explicit leader instead of text crossing an edge.
    const cellLabels = cells.map(cell => {
        const vertices = cell.vertices.map(at), center = {x: vertices.reduce((sum, point) => sum + point.x, 0) / 3, y: vertices.reduce((sum, point) => sum + point.y, 0) / 3};
        const options = [centered(center.x, center.y + 5, cell.label)];
        for (let i = 1; i < 7; i++) for (let j = 1; j < 8 - i; j++) options.push(centered((vertices[0].x * i + vertices[1].x * j + vertices[2].x * (8 - i - j)) / 8, (vertices[0].y * i + vertices[1].y * j + vertices[2].y * (8 - i - j)) / 8 + 5, cell.label));
        const inside = options.find(option => free(option.box) && !allEdges.some(([a, b]) => crosses(a, b, {left: option.box.left - 2, right: option.box.right + 2, top: option.box.top - 2, bottom: option.box.bottom + 2})));
        const placed = inside ?? framePlacement(cell.label, center);
        occupied.push(placed.box);
        const end = inside ? center : leaderEnd(center, placed.box);
        if (!inside) allEdges.push([center, end]);
        return {...cell, center, ...placed, end, leader: !inside};
    });
    const labels = ids.map(id => {
        const point = at(id), text = areaPointName(data, id), textWidth = labelWidth(text);
        const candidates = [[10, -12], [10, 22], [-textWidth - 10, -12], [-textWidth - 10, 22], [-textWidth / 2, -24], [-textWidth / 2, 34], [22, -24], [22, 34], [-textWidth - 22, -24], [-textWidth - 22, 34], [-textWidth / 2, -38], [-textWidth / 2, 48]];
        const options = candidates.map(([dx, dy]) => ({x: point.x + dx, y: point.y + dy, box: {left: point.x + dx - 2, right: point.x + dx + textWidth, top: point.y + dy - 14, bottom: point.y + dy + 4}}));
        const near = options.find(option => free(option.box) && !allEdges.some(([a, b]) => crosses(a, b, option.box)));
        const frame = near ? null : framePlacement(text, point);
        const placed = near ?? {...frame!, x: frame!.x - textWidth / 2};
        occupied.push(placed.box);
        return {id, point, text, ...placed, end: leaderEnd(point, placed.box), leader: !near};
    });
    return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{maxWidth: '100%', height: 'auto'}} role="img" aria-label="Polygon geometry" data-role="polygon-area-diagram" data-pixels-per-unit={ppu}>
        {cells.map(cell => <polygon key={cell.id} points={polygon(cell.vertices)} fill={solution ? '#d1fae5' : '#e0e7ff'} stroke={solution ? green : '#4338ca'} strokeWidth="1.5" data-role="polygon-area-cell" />)}
        <polygon points={polygon(boundary)} fill={cells.length ? 'none' : '#f8fafc'} stroke={stroke} strokeWidth="2" data-role="polygon-area-boundary" />
        {sourceCuts && data.source.cuts.map(cut => {const a = at(cut.fromId), b = at(cut.toId); return <line key={cut.cutId} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={green} strokeWidth="2.5" data-role="polygon-area-cut" />;})}
        {shapeMarks && data.source.shapeFacts.equalLengthEdgeGroups.flatMap((group, groupIndex) => group.flatMap(edgeIndex => {
            const [a, b] = edges[edgeIndex], dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
            return Array.from({length: groupIndex + 1}, (_, tick) => {const offset = (tick - groupIndex / 2) * 6, x = (a.x + b.x) / 2 + dx / length * offset, y = (a.y + b.y) / 2 + dy / length * offset;
                return <line key={`${edgeIndex}-${tick}`} x1={x - dy / length * 5} y1={y + dx / length * 5} x2={x + dy / length * 5} y2={y - dx / length * 5} stroke={stroke} strokeWidth="1.5" data-role="polygon-area-equal-mark" />;});
        }))}
        {shapeMarks && parallelClasses(data).flatMap((group, groupIndex) => group.map(edgeIndex => {
            const [a, b] = edges[edgeIndex], dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy), x = a.x * .68 + b.x * .32, y = a.y * .68 + b.y * .32;
            return <g key={edgeIndex} data-role="polygon-area-parallel-mark" data-parallel-edge-index={edgeIndex} data-parallel-class={groupIndex}>{Array.from({length: groupIndex + 1}, (_, tick) => {const cx = x + dx / length * tick * 6, cy = y + dy / length * tick * 6;
                return <polyline key={tick} points={`${cx - dx / length * 4 - dy / length * 4},${cy - dy / length * 4 + dx / length * 4} ${cx + dx / length * 2},${cy + dy / length * 2} ${cx - dx / length * 4 + dy / length * 4},${cy - dy / length * 4 - dx / length * 4}`} fill="none" stroke={stroke} strokeWidth="1.5" />;})}</g>;
        }))}
        {shapeMarks && data.source.shapeFacts.angles.filter(angle => angle.kind === 'right').map(angle => {
            const p = at(angle.vertexId), previous = at(angle.previousId), next = at(angle.nextId);
            const l = Math.hypot(previous.x - p.x, previous.y - p.y), r = Math.hypot(next.x - p.x, next.y - p.y);
            const u = {x: (previous.x - p.x) / l * 10, y: (previous.y - p.y) / l * 10}, v = {x: (next.x - p.x) / r * 10, y: (next.y - p.y) / r * 10};
            return <polyline key={angle.vertexId} points={`${p.x + u.x},${p.y + u.y} ${p.x + u.x + v.x},${p.y + u.y + v.y} ${p.x + v.x},${p.y + v.y}`} fill="none" stroke={stroke} strokeWidth="1.5" data-role="polygon-area-right-mark" />;
        })}
        {heightCell && (() => {const apex = at(heightCell.height.apexId), foot = at(heightCell.height.footId), base = at(heightCell.base.firstId);
            return <g data-role="polygon-area-altitude"><line x1={apex.x} y1={apex.y} x2={foot.x} y2={foot.y} stroke={green} strokeWidth="2" strokeDasharray="5 4" />{heightCell.height.footLocation === 'base-line-extension' && <line x1={base.x} y1={base.y} x2={foot.x} y2={foot.y} stroke="#64748b" strokeDasharray="3 4" />}</g>;})()}
        {cellLabels.map(label => <g key={label.id}>{label.leader && <line x1={label.center.x} y1={label.center.y} x2={label.end.x} y2={label.end.y} stroke={solution ? green : stroke} strokeWidth="1" strokeDasharray="3 3" data-role="polygon-area-cell-leader" />}<text x={label.x} y={label.y} textAnchor="middle" fontSize="14" fontWeight="600" fill={solution ? green : '#3730a3'} data-role="polygon-area-cell-label" data-label-box={`${label.box.left},${label.box.top},${label.box.right},${label.box.bottom}`}>{label.label}</text></g>)}
        {labels.map(label => <g key={label.id}>{label.leader && <line x1={label.point.x} y1={label.point.y} x2={label.end.x} y2={label.end.y} stroke={stroke} strokeWidth="1" strokeDasharray="2 3" />}<circle cx={label.point.x} cy={label.point.y} r="2.5" fill={stroke} data-role="polygon-area-point-marker" /><text x={label.x} y={label.y} fontSize="14" fontWeight="600" fill={stroke} data-role="polygon-area-point-label" data-label-box={`${label.box.left},${label.box.top},${label.box.right},${label.box.bottom}`}>{label.text}</text></g>)}
    </svg>;
}

/** Detached cells keep a common metric scale; reflection/rotation is presentation-only. */
export function PolygonAreaTray({data, seed, scale}: {data: Problem; seed: number; scale: number}) {
    const pieces = data.assembly.placements.map((placement, index) => ({placement, cell: data.source.cells.find(cell => cell.cellId === placement.sourceCellId)!, order: (index + Math.abs(seed)) % data.assembly.placements.length})).sort((a, b) => a.order - b.order);
    return <div className="flex flex-wrap items-start justify-center gap-3" data-role="polygon-area-tray">{pieces.map(({placement, cell}) => <div key={placement.placementId} className="rounded-lg border border-slate-200 p-2 text-center"><p className="text-sm">{areaCellName(data, cell.cellId)}, copy {placement.copyIndex + 1}</p><PolygonAreaDiagram data={data} boundary={cell.vertices} cells={[]} sourceCuts={false} showDimensions={false} shapeMarks={false} solution={false} scale={scale} /></div>)}</div>;
}
