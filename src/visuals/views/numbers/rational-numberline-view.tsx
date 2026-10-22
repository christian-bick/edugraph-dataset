import type {RationalNumberlineValuesProblem} from '../../../types/problems.ts';
import {formatCoordinateNotation} from '../coordinate/rational-coordinate-helpers.ts';

type NumberlineProps = {data: RationalNumberlineValuesProblem; isSolutionView: boolean; seed: number};

/** Index-to-screen transforms only; all values and exact scale evidence come from the supplied model. */
function RationalNumberline({data, seed, showPoint, hidePointLabel, isSolutionView}: {
    data: RationalNumberlineValuesProblem; seed: number; showPoint: boolean; hidePointLabel: boolean; isSolutionView: boolean;
}) {
    const vertical = Math.abs(seed % 2) === 1;
    const labels = data.axis.tickNotations.map(formatCoordinateNotation);
    const labelWidth = Math.max(...labels.map(label => label.length)) * 8;
    const margin = Math.max(60, labelWidth / 2 + 20);
    const width = vertical ? Math.max(740, labelWidth * 2 + 180) : Math.max(740, (labels.length - 1) * Math.max(52, labelWidth + 18) + margin * 2);
    const height = vertical ? Math.max(620, (labels.length - 1) * 42 + 120) : 200;
    const center = width / 2, lineY = 92;
    const x = (index: number) => vertical ? center : margin + index * (width - margin * 2) / (labels.length - 1);
    const y = (index: number) => vertical ? height - 70 - index * (height - 130) / (labels.length - 1) : lineY;
    const color = isSolutionView ? '#047857' : '#3730a3';
    return <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <svg viewBox={`0 0 ${width} ${height}`} style={{display: 'block', width: '100%'}} aria-label="Scaled number line" data-role="rational-numberline" data-orientation={vertical ? 'vertical' : 'horizontal'}>
            <line x1={vertical ? center : margin - 15} x2={vertical ? center : width - margin + 15} y1={vertical ? height - 55 : lineY} y2={vertical ? 43 : lineY} stroke="#334155" strokeWidth="2" />
            {vertical ? <polygon points={`${center},34 ${center - 5},45 ${center + 5},45`} fill="#334155" /> : <polygon points={`${width - margin + 24},${lineY} ${width - margin + 13},${lineY - 5} ${width - margin + 13},${lineY + 5}`} fill="#334155" />}
            {labels.map((label, index) => <g key={index}>
                <line x1={x(index) - (vertical ? 6 : 0)} x2={x(index) + (vertical ? 6 : 0)} y1={y(index) - (vertical ? 0 : 6)} y2={y(index) + (vertical ? 0 : 6)} stroke="#334155" />
                {!(hidePointLabel && index === data.point.tickIndex) && <text x={x(index) - (vertical ? 17 : 0)} y={y(index) + (vertical ? 5 : 30)} textAnchor={vertical ? 'end' : 'middle'} fontSize="14" fill={isSolutionView && index === data.point.tickIndex ? '#047857' : '#334155'} data-role="numberline-tick-label" data-tick-index={index}>{label}</text>}
            </g>)}
            {showPoint && <g data-role="numberline-marker" aria-label="Point P">
                <circle cx={x(data.point.tickIndex)} cy={y(data.point.tickIndex)} r="6" fill={color} stroke="white" strokeWidth="1.5" />
                <text x={x(data.point.tickIndex) + (vertical ? 20 : 0)} y={y(data.point.tickIndex) + (vertical ? 5 : -20)} textAnchor={vertical ? 'start' : 'middle'} fontSize="17" fontWeight="700" fill={color}>P</text>
            </g>}
            <text x={center} y={height - 16} textAnchor="middle" fill="#475569" fontSize="14" data-role="numberline-step">Step: {formatCoordinateNotation(data.axis.stepNotation)}</text>
        </svg>
    </div>;
}

export function RationalLinePositioningBody({data, isSolutionView, seed}: NumberlineProps) {
    return <div className="bg-white p-6 text-slate-800" style={{width: 'min(800px, 100vw)'}}>
        <h2 className="text-2xl font-bold text-indigo-950">Mark the value on the number line</h2>
        <p className="mt-3 text-lg" data-role="given-numberline-value">Place P at {formatCoordinateNotation(data.point.notation)}.</p>
        <RationalNumberline data={data} seed={seed} showPoint={isSolutionView} hidePointLabel={false} isSolutionView={isSolutionView} />
        {isSolutionView && <p className="mt-4 rounded-lg border border-emerald-400 bg-emerald-50 p-4 text-lg font-semibold text-emerald-800" data-role="numberline-answer">P = {formatCoordinateNotation(data.point.notation)}</p>}
    </div>;
}

export function RationalLineReadingBody({data, isSolutionView, seed}: NumberlineProps) {
    return <div className="bg-white p-6 text-slate-800" style={{width: 'min(800px, 100vw)'}}>
        <h2 className="text-2xl font-bold text-indigo-950">Read the marked value</h2>
        <p className="mt-3 text-lg">What value is represented by P?</p>
        <RationalNumberline data={data} seed={seed} showPoint={true} hidePointLabel={!isSolutionView} isSolutionView={isSolutionView} />
        {isSolutionView ? <p className="mt-4 rounded-lg border border-emerald-400 bg-emerald-50 p-4 text-lg font-semibold text-emerald-800" data-role="numberline-answer">P = {formatCoordinateNotation(data.point.notation)}</p> :
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-lg" data-role="blank-numberline-answer">P = __________</p>}
    </div>;
}
