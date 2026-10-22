import type {CoordinatePolygonEdge, RationalCoordinateAxes, RationalCoordinatePoint} from '../../../types/problems.ts';
import {formatCoordinateNotation} from './rational-coordinate-helpers.ts';

type Rect = {left: number; right: number; top: number; bottom: number};
const overlaps = (a: Rect, b: Rect) => a.left < b.right + 3 && a.right > b.left - 3 && a.top < b.bottom + 3 && a.bottom > b.top - 3;
/** Screen-space clipping against a padded label rectangle, independent of mathematical validation. */
function crossesLabel(segment: {x1: number; x2: number; y1: number; y2: number}, rect: Rect): boolean {
    let entry = 0, exit = 1;
    for (const [start, end, minimum, maximum] of [[segment.x1, segment.x2, rect.left - 3, rect.right + 3], [segment.y1, segment.y2, rect.top - 3, rect.bottom + 3]]) {
        const change = end! - start!;
        if (change === 0) {if (start! < minimum! || start! > maximum!) return false;}
        else {
            const first = (minimum! - start!) / change, second = (maximum! - start!) / change;
            entry = Math.max(entry, Math.min(first, second)); exit = Math.min(exit, Math.max(first, second));
            if (entry > exit) return false;
        }
    }
    return true;
}

/** One pixel-per-unit transform for BOTH axes. Indices and supplied steps determine all positions. */
export function CoordinateMetricPlane({axes, points, edges, solutionGeometry, highlightedEdge, seed}: {
    axes: RationalCoordinateAxes; points: readonly RationalCoordinatePoint[]; edges: readonly CoordinatePolygonEdge[];
    solutionGeometry: boolean; highlightedEdge: CoordinatePolygonEdge | null; seed: number;
}) {
    const labelWidth = Math.max(...axes.x.tickNotations.map(value => formatCoordinateNotation(value).length), ...axes.y.tickNotations.map(value => formatCoordinateNotation(value).length)) * 7.5;
    const margin = Math.max(80, labelWidth + 25), width = 600 + margin * 2;
    const stepX = axes.x.step.numerator / axes.x.step.denominator, stepY = axes.y.step.numerator / axes.y.step.denominator;
    const spanX = stepX * (axes.x.ticks.length - 1), spanY = stepY * (axes.y.ticks.length - 1);
    const pixelsPerUnit = Math.min(600 / spanX, 440 / spanY);
    const plotWidth = spanX * pixelsPerUnit, plotHeight = spanY * pixelsPerUnit;
    const left = margin + (600 - plotWidth) / 2, right = left + plotWidth, top = 60 + (440 - plotHeight) / 2, bottom = top + plotHeight;
    const x = (index: number) => left + index * stepX * pixelsPerUnit;
    const y = (index: number) => bottom - index * stepY * pixelsPerUnit;
    const zeroX = x(axes.x.zeroIndex), zeroY = y(axes.y.zeroIndex);
    const labelRows = Math.max(1, Math.min(axes.x.ticks.length, Math.ceil((labelWidth + 8) / (stepX * pixelsPerUnit))));
    const yTickRects: Rect[] = [];
    axes.y.tickNotations.forEach((notation, index) => {
        if (index === axes.y.zeroIndex) return;
        yTickRects.push({left: zeroX - 10 - formatCoordinateNotation(notation).length * 7.5, right: zeroX - 8, top: y(index) - 11, bottom: y(index) + 8});
    });
    const xTickRects: Rect[] = [], tickBaselines: number[] = [];
    axes.x.tickNotations.forEach((notation, index) => {
        const extent = formatCoordinateNotation(notation).length * 7.5, zero = index === axes.x.zeroIndex;
        let baseline = zero ? zeroY - 12 : zeroY + 23 + index % labelRows * 22;
        const rectangle = (): Rect => ({left: zero ? zeroX + 10 : x(index) - extent / 2, right: zero ? zeroX + 10 + extent : x(index) + extent / 2,
            top: zero ? zeroY - 27 : baseline - 16, bottom: zero ? zeroY - 9 : baseline + 4});
        // Unequal metric steps can place a staggered x label beside a y label. Move only its
        // screen-space response row, retaining the tick position and a guide to that label.
        while (!zero && [...yTickRects, ...xTickRects].some(rect => overlaps(rectangle(), rect))) baseline += 22;
        tickBaselines.push(baseline); xTickRects.push(rectangle());
    });
    const tickY = (index: number) => tickBaselines[index]!;
    const legendY = Math.max(580, ...tickBaselines.map(baseline => baseline + 36)), height = legendY + 30;
    const occupied: Rect[] = [...xTickRects, ...yTickRects];
    const lookup = new Map(points.map(point => [point.id, point]));
    const segments = edges.map(edge => {
        const from = lookup.get(edge.fromId)!, to = lookup.get(edge.toId)!;
        return {edge, x1: x(from.x.tickIndex), x2: x(to.x.tickIndex), y1: y(from.y.tickIndex), y2: y(to.y.tickIndex)};
    });
    const grouped = new Map<string, {point: RationalCoordinatePoint; ids: string[]}>();
    for (const point of points) {
        const key = `${point.x.tickIndex},${point.y.tickIndex}`, previous = grouped.get(key);
        if (previous) previous.ids.push(point.id);
        else grouped.set(key, {point, ids: [point.id]});
    }
    for (const {point} of grouped.values()) occupied.push({left: x(point.x.tickIndex) - 7, right: x(point.x.tickIndex) + 7, top: y(point.y.tickIndex) - 7, bottom: y(point.y.tickIndex) + 7});
    const labels = [...grouped.values()].map(({point, ids}) => {
        const label = ids.join(' / '), extent = label.length * 8;
        const offsets = Math.abs(seed % 2) === 0 ? [[12, -14], [12, 24], [-12, -14], [-12, 24], [0, -30], [0, 39]] : [[12, 24], [12, -14], [-12, 24], [-12, -14], [0, 39], [0, -30]];
        const choices = offsets.map(([dx, dy]) => {
            const anchor = dx! < 0 ? 'end' : dx === 0 ? 'middle' : 'start';
            const lx = Math.max(15 + (anchor === 'end' ? extent : anchor === 'middle' ? extent / 2 : 0), Math.min(width - 15 - (anchor === 'start' ? extent : anchor === 'middle' ? extent / 2 : 0), x(point.x.tickIndex) + dx!));
            const ly = Math.max(25, Math.min(548, y(point.y.tickIndex) + dy!));
            const start = lx - (anchor === 'end' ? extent : anchor === 'middle' ? extent / 2 : 0);
            return {x: lx, y: ly, anchor, rect: {left: start, right: start + extent, top: ly - 15, bottom: ly + 3}};
        });
        const chosen = choices.find(choice => !occupied.some(rect => overlaps(choice.rect, rect)) && !segments.some(segment => crossesLabel(segment, choice.rect))) ??
            choices.find(choice => !occupied.some(rect => overlaps(choice.rect, rect))) ?? choices[0]!;
        occupied.push(chosen.rect);
        return {point, label, chosen};
    });
    const color = solutionGeometry ? '#047857' : '#3730a3';
    return <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2"><svg viewBox={`0 0 ${width} ${height}`} style={{width: '100%', display: 'block'}} aria-label="Metric Cartesian coordinate plane" data-role="coordinate-metric-plane">
        {axes.x.ticks.map((_, index) => <line key={`x${index}`} x1={x(index)} x2={x(index)} y1={top} y2={bottom} stroke="#e2e8f0" />)}
        {axes.y.ticks.map((_, index) => <line key={`y${index}`} x1={left} x2={right} y1={y(index)} y2={y(index)} stroke="#e2e8f0" />)}
        <line x1={left - 12} x2={right + 18} y1={zeroY} y2={zeroY} stroke="#334155" strokeWidth="2" />
        <polygon points={`${right + 24},${zeroY} ${right + 14},${zeroY - 5} ${right + 14},${zeroY + 5}`} fill="#334155" />
        <line x1={zeroX} x2={zeroX} y1={bottom + 12} y2={top - 18} stroke="#334155" strokeWidth="2" data-role="metric-y-axis" />
        <polygon points={`${zeroX},${top - 24} ${zeroX - 5},${top - 14} ${zeroX + 5},${top - 14}`} fill="#334155" />
        <text x={right + 34} y={zeroY + 5} fill="#0f172a" fontSize="18" fontStyle="italic">x</text><text x={zeroX - 5} y={top - 33} fill="#0f172a" fontSize="18" fontStyle="italic">y</text>
        {segments.map((segment, index) => {
            const highlight = highlightedEdge && segment.edge.fromId === highlightedEdge.fromId && segment.edge.toId === highlightedEdge.toId;
            return <line key={index} x1={segment.x1} x2={segment.x2} y1={segment.y1} y2={segment.y2} stroke={highlight ? '#047857' : color} strokeWidth={highlight ? 4 : 3} data-role="metric-edge" />;
        })}
        {axes.x.tickNotations.map((notation, index) => <g key={`xt${index}`}><line x1={x(index)} x2={x(index)} y1={zeroY - 4} y2={zeroY + 4} stroke="#334155" />
            {index !== axes.x.zeroIndex && tickY(index) > zeroY + 23 && <line x1={x(index)} x2={x(index)} y1={zeroY + 5} y2={tickY(index) - 16} stroke="#cbd5e1" />}
            <rect x={occupied[index]!.left - 3} y={occupied[index]!.top - 2} width={occupied[index]!.right - occupied[index]!.left + 6} height={occupied[index]!.bottom - occupied[index]!.top + 4} fill="white" data-role="metric-tick-background" />
            <text x={index === axes.x.zeroIndex ? zeroX + 10 : x(index)} y={tickY(index)} textAnchor={index === axes.x.zeroIndex ? 'start' : 'middle'} fontSize="14" fill="#334155" data-role="metric-x-tick">{formatCoordinateNotation(notation)}</text></g>)}
        {axes.y.tickNotations.map((notation, index) => <g key={`yt${index}`}><line x1={zeroX - 4} x2={zeroX + 4} y1={y(index)} y2={y(index)} stroke="#334155" />
            {index !== axes.y.zeroIndex && <rect x={zeroX - 13 - formatCoordinateNotation(notation).length * 7.5} y={y(index) - 13} width={formatCoordinateNotation(notation).length * 7.5 + 6} height="23" fill="white" data-role="metric-tick-background" />}
            {index !== axes.y.zeroIndex && <text x={zeroX - 10} y={y(index) + 5} textAnchor="end" fontSize="14" fill="#334155" data-role="metric-y-tick">{formatCoordinateNotation(notation)}</text>}</g>)}
        {labels.map(({point, label, chosen}) => <g key={label} data-role="metric-marker" data-point-ids={label}><circle cx={x(point.x.tickIndex)} cy={y(point.y.tickIndex)} r="5" fill={color} stroke="white" strokeWidth="1.5" />
            <text x={chosen.x} y={chosen.y} textAnchor={chosen.anchor as 'start' | 'middle' | 'end'} fill={color} stroke="white" strokeWidth="4" paintOrder="stroke" fontSize="16" fontWeight="700">{label}</text></g>)}
        <text x={width / 2} y={legendY} textAnchor="middle" fill="#475569" fontSize="14">x step: {formatCoordinateNotation(axes.x.stepNotation)}; y step: {formatCoordinateNotation(axes.y.stepNotation)}</text>
    </svg></div>;
}
