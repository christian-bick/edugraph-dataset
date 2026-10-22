import type {CoordinateReflectionStep, RationalCoordinateAxes, RationalCoordinatePoint} from '../../../types/problems.ts';
import {formatCoordinateNotation} from './rational-coordinate-helpers.ts';

type Rect = {left: number; top: number; right: number; bottom: number};
const overlaps = (a: Rect, b: Rect) => a.left < b.right + 3 && a.right > b.left - 3 && a.top < b.bottom + 3 && a.bottom > b.top - 3;

/** Pure screen-space layout. Supplied tick indices determine all mathematical positions. */
export function RationalCoordinatePlane({axes, points, solutionPoints, showQuadrants, reflectionSteps, seed}: {
    axes: RationalCoordinateAxes; points: readonly RationalCoordinatePoint[]; solutionPoints: boolean; showQuadrants: boolean;
    reflectionSteps: readonly CoordinateReflectionStep[]; seed: number;
}) {
    const left = 80, right = 670, top = 60, bottom = 490;
    const x = (index: number) => left + index * (right - left) / (axes.x.ticks.length - 1);
    const y = (index: number) => bottom - index * (bottom - top) / (axes.y.ticks.length - 1);
    const zeroX = x(axes.x.zeroIndex), zeroY = y(axes.y.zeroIndex);
    const occupied: Rect[] = [];
    axes.x.tickNotations.forEach((notation, index) => {
        const width = formatCoordinateNotation(notation).length * 7.5;
        const zeroLabel = index === axes.x.zeroIndex;
        occupied.push({left: zeroLabel ? zeroX + 10 : x(index) - width / 2,
            right: zeroLabel ? zeroX + 10 + width : x(index) + width / 2,
            top: zeroLabel ? zeroY - 27 : zeroY + 7, bottom: zeroLabel ? zeroY - 9 : zeroY + 27});
    });
    axes.y.tickNotations.forEach((notation, index) => {
        if (index === axes.y.zeroIndex) return;
        const width = formatCoordinateNotation(notation).length * 7.5;
        occupied.push({left: zeroX - 12 - width, right: zeroX - 8, top: y(index) - 10, bottom: y(index) + 9});
    });
    const positions = new Map<string, {point: RationalCoordinatePoint; ids: string[]}>();
    for (const point of points) {
        const key = `${point.x.tickIndex},${point.y.tickIndex}`;
        const existing = positions.get(key);
        if (existing) {if (!existing.ids.includes(point.id)) existing.ids.push(point.id);}
        else positions.set(key, {point, ids: [point.id]});
    }
    for (const {point} of positions.values()) occupied.push({left: x(point.x.tickIndex) - 7, right: x(point.x.tickIndex) + 7, top: y(point.y.tickIndex) - 7, bottom: y(point.y.tickIndex) + 7});
    const marks = [...positions.values()].map(({point, ids}) => {
        const label = ids.join(' / '), width = label.length * 8;
        const px = x(point.x.tickIndex), py = y(point.y.tickIndex);
        const offsets = Math.abs(seed % 2) === 0 ? [[12, -12], [12, 22], [-12, -12], [-12, 22], [0, -27], [0, 37]] : [[12, 22], [12, -12], [-12, 22], [-12, -12], [0, 37], [0, -27]];
        const choices = offsets.map(([dx, dy]) => {
            const anchor = dx! < 0 ? 'end' : dx === 0 ? 'middle' : 'start';
            const lx = Math.min(725 - (anchor === 'start' ? width : anchor === 'middle' ? width / 2 : 0), Math.max(15 + (anchor === 'end' ? width : anchor === 'middle' ? width / 2 : 0), px + dx!));
            const ly = Math.max(24, Math.min(548, py + dy!));
            return {x: lx, y: ly, anchor, rect: {left: lx - (anchor === 'end' ? width : anchor === 'middle' ? width / 2 : 0), right: lx + (anchor === 'start' ? width : anchor === 'middle' ? width / 2 : 0), top: ly - 15, bottom: ly + 3}};
        });
        const chosen = choices.find(choice => !occupied.some(rect => overlaps(choice.rect, rect))) ?? choices[0]!;
        occupied.push(chosen.rect);
        return {point, label, px, py, chosen};
    });
    const color = solutionPoints ? '#047857' : '#3730a3';
    const highlighted = new Set(reflectionSteps.map(step => step.axis));
    const regions = [
        {name: 'I', left: zeroX, right, top, bottom: zeroY}, {name: 'II', left, right: zeroX, top, bottom: zeroY},
        {name: 'III', left, right: zeroX, top: zeroY, bottom}, {name: 'IV', left: zeroX, right, top: zeroY, bottom}
    ].filter(region => region.right > region.left && region.bottom > region.top).map(region => {
        const choices = [0.22, 0.78, 0.5].flatMap(fx => [0.22, 0.78, 0.5].map(fy => ({x: region.left + (region.right - region.left) * fx, y: region.top + (region.bottom - region.top) * fy})));
        const width = region.name.length * 20;
        const position = choices.find(choice => !occupied.some(rect => overlaps({left: choice.x - width / 2, right: choice.x + width / 2, top: choice.y - 24, bottom: choice.y + 4}, rect))) ?? choices[0]!;
        return {...region, ...position};
    });
    return <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2">
        <svg viewBox="0 0 740 565" style={{width: '100%', display: 'block'}} aria-label="Scaled Cartesian coordinate plane" data-role="coordinate-plane">
            {showQuadrants && regions.map(region => <text key={region.name} x={region.x} y={region.y} textAnchor="middle" fill="#94a3b8" fontSize="26" fontWeight="700" data-quadrant={region.name}>{region.name}</text>)}
            {axes.x.ticks.map((_, index) => <line key={`x${index}`} x1={x(index)} x2={x(index)} y1={top} y2={bottom} stroke="#e2e8f0" />)}
            {axes.y.ticks.map((_, index) => <line key={`y${index}`} x1={left} x2={right} y1={y(index)} y2={y(index)} stroke="#e2e8f0" />)}
            <line x1={left - 12} x2={right + 18} y1={zeroY} y2={zeroY} stroke={highlighted.has('x') ? '#6366f1' : '#334155'} strokeWidth="2" />
            <polygon points={`${right + 24},${zeroY} ${right + 14},${zeroY - 5} ${right + 14},${zeroY + 5}`} fill="#334155" />
            <line x1={zeroX} x2={zeroX} y1={bottom + 12} y2={top - 18} stroke={highlighted.has('y') ? '#6366f1' : '#334155'} strokeWidth="2" data-role="y-axis" />
            <polygon points={`${zeroX},${top - 24} ${zeroX - 5},${top - 14} ${zeroX + 5},${top - 14}`} fill="#334155" />
            <text x={right + 34} y={zeroY + 5} fill="#0f172a" fontSize="18" fontStyle="italic">x</text>
            <text x={zeroX - 5} y={top - 33} fill="#0f172a" fontSize="18" fontStyle="italic">y</text>
            {axes.x.tickNotations.map((notation, index) => <g key={`xt${index}`}>
                <line x1={x(index)} x2={x(index)} y1={zeroY - 4} y2={zeroY + 4} stroke="#334155" />
                <text x={index === axes.x.zeroIndex ? zeroX + 10 : x(index)} y={index === axes.x.zeroIndex ? zeroY - 12 : zeroY + 23} textAnchor={index === axes.x.zeroIndex ? 'start' : 'middle'} fill="#334155" fontSize="14" data-role="x-tick-label" data-tick-index={index}>{formatCoordinateNotation(notation)}</text>
            </g>)}
            {axes.y.tickNotations.map((notation, index) => <g key={`yt${index}`}>
                <line x1={zeroX - 4} x2={zeroX + 4} y1={y(index)} y2={y(index)} stroke="#334155" />
                {index !== axes.y.zeroIndex && <text x={zeroX - 10} y={y(index) + 5} textAnchor="end" fill="#334155" fontSize="14">{formatCoordinateNotation(notation)}</text>}
            </g>)}
            {reflectionSteps.map((step, index) => <g key={index} data-role="mirror-guide">
                <line x1={x(step.before.x.tickIndex)} y1={y(step.before.y.tickIndex)} x2={x(step.mirror.foot.x.tickIndex)} y2={y(step.mirror.foot.y.tickIndex)} stroke="#94a3b8" strokeDasharray="5 4" strokeWidth="2" />
                <line x1={x(step.mirror.foot.x.tickIndex)} y1={y(step.mirror.foot.y.tickIndex)} x2={x(step.after.x.tickIndex)} y2={y(step.after.y.tickIndex)} stroke="#94a3b8" strokeDasharray="5 4" strokeWidth="2" />
            </g>)}
            {marks.map(mark => <g key={`${mark.point.x.tickIndex},${mark.point.y.tickIndex}`} data-role="coordinate-marker" data-x-index={mark.point.x.tickIndex} data-y-index={mark.point.y.tickIndex}>
                <circle cx={mark.px} cy={mark.py} r="5" fill={color} stroke="white" strokeWidth="1.5" />
                <text x={mark.chosen.x} y={mark.chosen.y} textAnchor={mark.chosen.anchor as 'start' | 'middle' | 'end'} fill={color} fontSize="16" fontWeight="700">{mark.label}</text>
            </g>)}
            <text x="370" y="550" textAnchor="middle" fill="#475569" fontSize="14">x step: {formatCoordinateNotation(axes.x.stepNotation)}; y step: {formatCoordinateNotation(axes.y.stepNotation)}</text>
        </svg>
    </div>;
}
