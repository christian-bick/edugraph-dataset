import type {AlgebraCovariationProblem as Problem, RationalCoordinatePoint} from '../../../types/problems.ts';
import {exactNumericNotation} from './numerical-power-expression-format.tsx';
import {covariationAxisLabel, covariationPointLabel} from './algebra-covariation-format.tsx';

type Rect = {left: number; right: number; top: number; bottom: number};
const overlaps = (first: Rect, second: Rect) => first.left < second.right + 3 && first.right > second.left - 3 && first.top < second.bottom + 3 && first.bottom > second.top - 3;
const positionKey = (point: RationalCoordinatePoint) => `${point.x.tickIndex},${point.y.tickIndex}`;
function crossesLabel(segment: {x1: number; y1: number; x2: number; y2: number}, rect: Rect): boolean {
    let entry = 0, exit = 1;
    for (const [start, end, minimum, maximum] of [[segment.x1, segment.x2, rect.left - 2, rect.right + 2], [segment.y1, segment.y2, rect.top - 2, rect.bottom + 2]]) {
        const change = end! - start!;
        if (change === 0) {if (start! < minimum! || start! > maximum!) return false;}
        else {const first = (minimum! - start!) / change, second = (maximum! - start!) / change; entry = Math.max(entry, Math.min(first, second)); exit = Math.min(exit, Math.max(first, second)); if (entry > exit) return false;}
    }
    return true;
}

/** Supplied indices/geometry determine all mathematics; these are screen-space transforms only. */
export function CovariationGraph({data, visible, solutionGeometry, highlightedRowId, seed}: {data: Problem; visible: boolean; solutionGeometry: boolean; highlightedRowId: string | null; seed: number}) {
    const {axes, geometry} = data.graph;
    const xLabels = axes.x.tickNotations.map(exactNumericNotation), yLabels = axes.y.tickNotations.map(exactNumericNotation);
    const xExtent = Math.max(...xLabels.map(label => label.length)) * 7.5, yExtent = Math.max(...yLabels.map(label => label.length)) * 7.5;
    const zeroExtent = xLabels[axes.x.zeroIndex]!.length * 7.5;
    const left = Math.max(75, yExtent + zeroExtent + 34), plotWidth = Math.max(540, (xLabels.length - 1) * (xExtent + 14));
    const top = 55, plotHeight = Math.max(350, (yLabels.length - 1) * 29), bottom = top + plotHeight, right = left + plotWidth;
    const width = right + 55, x = (index: number) => left + index * plotWidth / (xLabels.length - 1), y = (index: number) => bottom - index * plotHeight / (yLabels.length - 1);
    const zeroX = x(axes.x.zeroIndex), zeroY = y(axes.y.zeroIndex);
    const yRects: Rect[] = yLabels.flatMap((label, index) => index === axes.y.zeroIndex ? [] : [{left: zeroX - 10 - label.length * 7.5, right: zeroX - 8, top: y(index) - 11, bottom: y(index) + 8}]);
    const occupied = [...yRects], xBaselines: number[] = [], xTextPositions: number[] = [];
    const xRects = xLabels.map((label, index) => {
        const zero = index === axes.x.zeroIndex, extent = label.length * 7.5;
        let baseline = zero ? zeroY - 12 : zeroY + 23;
        let textX = zero ? zeroX - 10 : x(index);
        const rectangle = () => ({left: zero ? textX - extent : textX - extent / 2, right: zero ? textX : textX + extent / 2, top: baseline - 15, bottom: baseline + 4});
        if (zero) {
            // Physical function values are nonnegative. Keep the zero label left of the
            // vertical axis, choosing above/below or farther left to clear signed-frame ticks.
            const candidates = [[zeroX - 10, zeroY - 12], [zeroX - 10, zeroY + 23], [zeroX - yExtent - 20, zeroY - 12], [zeroX - yExtent - 20, zeroY + 23]];
            for (const [candidateX, candidateY] of candidates) {textX = candidateX!; baseline = candidateY!; if (!occupied.some(rect => overlaps(rectangle(), rect))) break;}
        }
        while (!zero && occupied.some(rect => overlaps(rectangle(), rect))) baseline += 22;
        const rect = rectangle(); occupied.push(rect); xBaselines.push(baseline); xTextPositions.push(textX); return rect;
    });
    const legendY = Math.max(bottom + 63, ...xBaselines.map(value => value + 38)), height = legendY + 42;
    const points = new Map<string, {point: RationalCoordinatePoint; labels: string[]; highlighted: boolean; domainEnd: boolean}>();
    const add = (point: RationalCoordinatePoint, label: string | null, highlighted: boolean, domainEnd: boolean) => {
        const key = positionKey(point), previous = points.get(key);
        if (previous) {if (label !== null) previous.labels.push(label); previous.highlighted ||= highlighted; previous.domainEnd ||= domainEnd;}
        else points.set(key, {point, labels: label === null ? [] : [label], highlighted, domainEnd});
    };
    if (visible) {
        if (geometry.kind === 'discrete-points') geometry.visibleValues.forEach(value => add(value.point, null, false, false));
        else {if (geometry.firstBoundary === 'domain-endpoint') add(geometry.first.point, null, false, true); if (geometry.lastBoundary === 'domain-endpoint') add(geometry.last.point, null, false, true);}
        data.graph.tablePoints.forEach(row => add(row.point, covariationPointLabel(data, row.rowId), row.rowId === highlightedRowId, false));
    }
    const segment = visible && geometry.kind === 'continuous-affine-segment' ? {x1: x(geometry.first.point.x.tickIndex), y1: y(geometry.first.point.y.tickIndex), x2: x(geometry.last.point.x.tickIndex), y2: y(geometry.last.point.y.tickIndex)} : null;
    const cutArrows: {points: string; shaft: {x1: number; y1: number; x2: number; y2: number}; rect: Rect}[] = [];
    if (segment && geometry.kind === 'continuous-affine-segment') {
        for (const atFirst of [true, false]) {
            if ((atFirst ? geometry.firstBoundary : geometry.lastBoundary) !== 'window-cut') continue;
            const direction = atFirst ? -1 : 1, length = Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1);
            const dx = direction * (segment.x2 - segment.x1) / length, dy = direction * (segment.y2 - segment.y1) / length;
            const px = atFirst ? segment.x1 : segment.x2, py = atFirst ? segment.y1 : segment.y2;
            // A table point may coincide with this frame cut. Keep the whole head beyond
            // that point's outer radius (4.5 + white stroke0.75), with a visible connecting shaft.
            const head = [{x: px + dx * 18, y: py + dy * 18}, {x: px + dx * 8 - dy * 5, y: py + dy * 8 + dx * 5}, {x: px + dx * 8 + dy * 5, y: py + dy * 8 - dx * 5}];
            const arrow = {points: head.map(point => `${point.x},${point.y}`).join(' '), shaft: {x1: px, y1: py, x2: px + dx * 8, y2: py + dy * 8},
                rect: {left: Math.min(...head.map(point => point.x)), right: Math.max(...head.map(point => point.x)), top: Math.min(...head.map(point => point.y)), bottom: Math.max(...head.map(point => point.y))}};
            cutArrows.push(arrow); occupied.push(arrow.rect);
        }
    }
    for (const {point} of points.values()) occupied.push({left: x(point.x.tickIndex) - 7, right: x(point.x.tickIndex) + 7, top: y(point.y.tickIndex) - 7, bottom: y(point.y.tickIndex) + 7});
    const marks = [...points.values()].map(mark => {
        const label = mark.labels.join(' / '), extent = label.length * 8, px = x(mark.point.x.tickIndex), py = y(mark.point.y.tickIndex);
        const offsets = Math.abs(seed % 2) === 0 ? [[12, -16], [-12, -16], [12, 30], [-12, 30], [0, -40], [0, 48]] : [[12, 30], [-12, 30], [12, -16], [-12, -16], [0, 48], [0, -40]];
        const choices = offsets.map(([dx, dy]) => {
            const anchor = dx! < 0 ? 'end' : dx === 0 ? 'middle' : 'start';
            const lx = Math.max(15 + (anchor === 'end' ? extent : anchor === 'middle' ? extent / 2 : 0), Math.min(width - 15 - (anchor === 'start' ? extent : anchor === 'middle' ? extent / 2 : 0), px + dx!));
            const ly = Math.max(25, Math.min(legendY - 20, py + dy!)), start = lx - (anchor === 'end' ? extent : anchor === 'middle' ? extent / 2 : 0);
            return {x: lx, y: ly, anchor, rect: {left: start - 2, right: start + extent + 2, top: ly - 16, bottom: ly + 4}};
        });
        const chosen = choices.find(choice => !occupied.some(rect => overlaps(choice.rect, rect)) && (!segment || !crossesLabel(segment, choice.rect)))
            ?? choices.find(choice => !occupied.some(rect => overlaps(choice.rect, rect))) ?? choices[0]!;
        if (label) occupied.push(chosen.rect);
        return {...mark, label, chosen};
    });
    const color = solutionGeometry ? '#047857' : '#3730a3';
    return <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2"><p className="px-2 text-sm">Horizontal: {covariationAxisLabel(data.input)}. Vertical: {covariationAxisLabel(data.output)}.</p>
        <svg viewBox={`0 0 ${width} ${height}`} style={{width: '100%', display: 'block'}} aria-label="Scaled Cartesian graph of the two quantities" data-role="covariation-graph">
            {xLabels.map((_, index) => <line key={`x${index}`} x1={x(index)} x2={x(index)} y1={top} y2={bottom} stroke="#e2e8f0" />)}
            {yLabels.map((_, index) => <line key={`y${index}`} x1={left} x2={right} y1={y(index)} y2={y(index)} stroke="#e2e8f0" />)}
            <line x1={left - 10} x2={right + 17} y1={zeroY} y2={zeroY} stroke="#334155" strokeWidth="2" />
            <polygon points={`${right + 22},${zeroY} ${right + 12},${zeroY - 5} ${right + 12},${zeroY + 5}`} fill="#334155" />
            <line x1={zeroX} x2={zeroX} y1={bottom + 10} y2={top - 17} stroke="#334155" strokeWidth="2" />
            <polygon points={`${zeroX},${top - 22} ${zeroX - 5},${top - 12} ${zeroX + 5},${top - 12}`} fill="#334155" />
            <text x={right + 27} y={zeroY + 5} fill="#0f172a" fontSize="16" fontStyle="italic">{data.input.symbol}</text>
            <text x={zeroX + 12} y={top - 22} fill="#0f172a" fontSize="16" fontStyle="italic">{data.output.symbol}</text>
            {segment && <line {...segment} stroke={color} strokeWidth="3" data-role="covariation-continuous-segment" />}
            {cutArrows.map((arrow, index) => <g key={index} data-role="covariation-window-cut"><line {...arrow.shaft} stroke={color} strokeWidth="3" data-role="covariation-cut-shaft" /><polygon points={arrow.points} fill={color} data-role="covariation-cut-head" /></g>)}
            {xLabels.map((label, index) => <g key={`xt${index}`}><line x1={x(index)} x2={x(index)} y1={zeroY - 4} y2={zeroY + 4} stroke="#334155" />
                <rect x={xRects[index]!.left - 2} y={xRects[index]!.top - 1} width={xRects[index]!.right - xRects[index]!.left + 4} height="21" fill="white" data-role={index === axes.x.zeroIndex ? 'covariation-zero-backing' : undefined} />
                <text x={xTextPositions[index]} y={xBaselines[index]} textAnchor={index === axes.x.zeroIndex ? 'end' : 'middle'} fill="#334155" fontSize="14" data-role="covariation-x-tick">{label}</text></g>)}
            {yLabels.map((label, index) => <g key={`yt${index}`}><line x1={zeroX - 4} x2={zeroX + 4} y1={y(index)} y2={y(index)} stroke="#334155" />
                {index !== axes.y.zeroIndex && <text x={zeroX - 10} y={y(index) + 5} textAnchor="end" fill="#334155" fontSize="14" stroke="white" strokeWidth="4" paintOrder="stroke">{label}</text>}</g>)}
            {marks.map(mark => <g key={positionKey(mark.point)} data-role="covariation-point" data-x-index={mark.point.x.tickIndex} data-y-index={mark.point.y.tickIndex}>
                <circle cx={x(mark.point.x.tickIndex)} cy={y(mark.point.y.tickIndex)} r={mark.domainEnd ? 5 : 4.5} fill={mark.highlighted ? '#047857' : color} stroke="white" strokeWidth="1.5" />
                {mark.label && <text x={mark.chosen.x} y={mark.chosen.y} textAnchor={mark.chosen.anchor as 'start' | 'end' | 'middle'} fill={mark.highlighted ? '#047857' : color} fontSize="15" fontWeight="700" stroke="white" strokeWidth="5" paintOrder="stroke">{mark.label}</text>}
            </g>)}
            <text x={width / 2} y={legendY} textAnchor="middle" fill="#475569" fontSize="14">Horizontal step: {exactNumericNotation(axes.x.stepNotation)}; vertical step: {exactNumericNotation(axes.y.stepNotation)}</text>
        </svg>
        {visible && <p className="px-2 pb-2 text-sm text-slate-600">{geometry.kind === 'discrete-points' ? 'Only integer counts are admitted; the graph consists of isolated points.' : 'Real inputs give a continuous segment. An arrow at a window cut indicates continuation within the stated domain.'}</p>}
    </div>;
}
