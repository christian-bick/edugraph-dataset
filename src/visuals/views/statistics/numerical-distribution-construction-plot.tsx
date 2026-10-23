import type {NumericalDataProblem, NumericalDataScalar} from '../../../types/problems.ts';
import {distributionUnit, distributionValue} from './numerical-distribution-format.tsx';
import type {NumericalDisplay} from './numerical-distribution-construction-format.tsx';

const position = (value: NumericalDataScalar) => value.numerator / value.denominator;

/** Exact supplied interval coordinates become pixels; no frequency or quartile is derived. */
export function NumericalConstructionPlot({data, plot, isSolutionView}: {data: NumericalDataProblem; plot: NumericalDisplay; isSolutionView: boolean}) {
    const {valueAxis, countAxis} = data.plots, box = plot === 'box-plot';
    const valueLabels = valueAxis.ticks.map(distributionValue), countLabels = countAxis.ticks.map(distributionValue);
    const left = Math.max(64, valueLabels[0].length * 4 + 12,
        box ? 64 : countLabels.reduce((maximum, label) => Math.max(maximum, label.length * 8 + 20), 64));
    const right = Math.max(30, valueLabels.at(-1)!.length * 4 + 12), plotWidth = 610, tickSpace = plotWidth / (valueAxis.ticks.length - 1);
    const labelRows = Math.max(1, Math.ceil((valueLabels.reduce((maximum, label) => Math.max(maximum, label.length * 8), 0) + 10) / tickSpace));
    const top = 24, plotHeight = box ? 132 : Math.max(170, (countAxis.ticks.length - 1) * 22, Math.ceil(position(countAxis.maximum) * 14));
    const bottom = top + plotHeight, width = left + plotWidth + right, height = bottom + 32 + labelRows * 21 + 27;
    const x = (value: NumericalDataScalar) => left + position(value) * tickSpace;
    const y = (value: NumericalDataScalar) => bottom - position(value) * plotHeight / (countAxis.ticks.length - 1);
    const boxY = top + plotHeight / 2, halfBoxHeight = 25, color = '#047857';
    return <figure className="space-y-2" data-role="numerical-construction-plot"><svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        style={{maxWidth: '100%', height: 'auto'}} role="img" aria-label={isSolutionView ? 'Completed requested numerical display' : 'Empty scaled space for the requested numerical display'}>
        {!box && <><text x={left} y={14} fontSize={13} fill="#475569">Observation frequency</text>{countAxis.ticks.map((tick, index) => {
            const py = bottom - index * plotHeight / (countAxis.ticks.length - 1);
            return <g key={index}><line x1={left} x2={left + plotWidth} y1={py} y2={py} stroke="#e2e8f0" /><text x={left - 10} y={py + 4} textAnchor="end" fontSize={14} fill="#475569">{distributionValue(tick)}</text></g>;
        })}<line x1={left} x2={left} y1={top} y2={bottom} stroke="#64748b" /></>}
        <line x1={left} x2={left + plotWidth} y1={bottom} y2={bottom} stroke="#64748b" />
        {valueAxis.ticks.map((tick, index) => {
            const px = left + index * tickSpace, labelY = bottom + 23 + index % labelRows * 21;
            return <g key={index}><line x1={px} x2={px} y1={bottom} y2={bottom + 5} stroke="#64748b" />
                {labelRows > 1 && <line x1={px} x2={px} y1={bottom + 6} y2={labelY - 14} stroke="#e2e8f0" />}<text x={px} y={labelY} textAnchor="middle" fontSize={14} fill="#475569">{distributionValue(tick)}</text></g>;
        })}
        {isSolutionView && plot === 'line-plot' && data.plots.dots.map(dot => <circle key={dot.recordId} cx={x(dot.valueLocation.axisPosition)} cy={y(dot.stackLocation.axisPosition)} r={5.5} fill={color} stroke="white" strokeWidth={1} data-role="constructed-observation" />)}
        {isSolutionView && plot === 'histogram' && data.plots.histogram.bins.map(bin => <rect key={bin.id} x={x(bin.left.axisPosition)} y={y(bin.top.axisPosition)} width={x(bin.right.axisPosition) - x(bin.left.axisPosition)} height={bottom - y(bin.top.axisPosition)} fill="#a7f3d0" stroke={color} strokeWidth={2} data-role="constructed-bin" />)}
        {isSolutionView && box && <g stroke={color} strokeWidth={3} fill="none" data-role="constructed-box">
            <line x1={x(data.plots.box.minimum.axisPosition)} x2={x(data.plots.box.maximum.axisPosition)} y1={boxY} y2={boxY} />
            {[data.plots.box.minimum, data.plots.box.maximum].map((value, index) => <line key={index} x1={x(value.axisPosition)} x2={x(value.axisPosition)} y1={boxY - 14} y2={boxY + 14} />)}
            <rect x={x(data.plots.box.q1.axisPosition)} y={boxY - halfBoxHeight} width={x(data.plots.box.q3.axisPosition) - x(data.plots.box.q1.axisPosition)} height={2 * halfBoxHeight} fill="#d1fae5" />
            <line x1={x(data.plots.box.median.axisPosition)} x2={x(data.plots.box.median.axisPosition)} y1={boxY - halfBoxHeight} y2={boxY + halfBoxHeight} />
        </g>}
        <text x={left + plotWidth / 2} y={height - 9} textAnchor="middle" fontSize={14} fill="#475569">{data.study.attribute.name} ({distributionUnit(data.study)})</text>
    </svg><figcaption className="text-sm text-slate-600">Value step: {distributionValue(valueAxis.step)} {distributionUnit(data.study)}{!box && <>; frequency step: {distributionValue(countAxis.step)}</>}.</figcaption></figure>;
}
