import type {NumericalDataProblem, NumericalDataScalar} from '../../../types/problems.ts';
import {distributionUnit, distributionValue} from './numerical-distribution-format.tsx';

const position = (value: NumericalDataScalar): number => value.numerator / value.denominator;

/** Only supplied interval positions are projected; frequencies/statistics are never reconstructed. */
export function NumericalDistributionPlot({data, highlightedRecordIds}: {data: NumericalDataProblem; highlightedRecordIds: readonly string[]}) {
    const {valueAxis, countAxis, dots} = data.plots;
    const horizontalLabels = valueAxis.ticks.map(distributionValue), verticalLabels = countAxis.ticks.map(distributionValue);
    const longestHorizontal = horizontalLabels.reduce((length, value) => Math.max(length, value.length), 0) * 7.5;
    const left = Math.max(64, verticalLabels.reduce((length, value) => Math.max(length, value.length), 0) * 7.5 + 20, horizontalLabels[0].length * 4 + 12);
    const right = Math.max(26, horizontalLabels.at(-1)!.length * 4 + 12), plotWidth = 610;
    const tickSpace = plotWidth / (valueAxis.ticks.length - 1), labelRows = Math.max(1, Math.ceil((longestHorizontal + 9) / tickSpace));
    // The supplied frequency range also determines physical spacing: a sparse
    // scale may still contain a tall unit-spaced observation stack.
    const top = 24, plotHeight = Math.max(170, (countAxis.ticks.length - 1) * 22, Math.ceil(position(countAxis.maximum) * 14)), bottom = top + plotHeight;
    const width = left + plotWidth + right, height = bottom + 29 + labelRows * 20 + 28;
    const x = (value: NumericalDataScalar) => left + position(value) * tickSpace;
    const y = (value: NumericalDataScalar) => bottom - position(value) * plotHeight / (countAxis.ticks.length - 1);
    const selected = new Set(highlightedRecordIds);
    return <figure className="space-y-1" data-role="distribution-observed-plot">
        <p className="text-sm font-semibold">Recorded-value distribution</p>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{maxWidth: '100%', height: 'auto'}} role="img" aria-label="Recorded values with one dot per observation and complete value and frequency scales">
            <text x={left} y={14} fontSize={13} fill="#475569">Observation frequency</text>
            {countAxis.ticks.map((tick, index) => {
                const py = bottom - index * plotHeight / (countAxis.ticks.length - 1);
                return <g key={index}><line x1={left} y1={py} x2={left + plotWidth} y2={py} stroke="#e2e8f0" /><text x={left - 10} y={py + 4} textAnchor="end" fontSize={14} fill="#475569">{distributionValue(tick)}</text></g>;
            })}
            <line x1={left} y1={top} x2={left} y2={bottom} stroke="#64748b" />
            <line x1={left} y1={bottom} x2={left + plotWidth} y2={bottom} stroke="#64748b" />
            {valueAxis.ticks.map((tick, index) => {
                const px = left + index * tickSpace, labelY = bottom + 23 + index % labelRows * 20;
                return <g key={index}><line x1={px} y1={bottom} x2={px} y2={bottom + 5} stroke="#64748b" />{labelRows > 1 && <line x1={px} y1={bottom + 6} x2={px} y2={labelY - 14} stroke="#e2e8f0" />}<text x={px} y={labelY} textAnchor="middle" fontSize={14} fill="#475569">{distributionValue(tick)}</text></g>;
            })}
            {dots.map(dot => <circle key={dot.recordId} cx={x(dot.valueLocation.axisPosition)} cy={y(dot.stackLocation.axisPosition)} r={5.5} fill={selected.has(dot.recordId) ? '#047857' : '#334155'} stroke="white" strokeWidth={1} data-role={selected.has(dot.recordId) ? 'distribution-departure-dot' : 'distribution-observation-dot'} />)}
            <text x={left + plotWidth / 2} y={height - 9} textAnchor="middle" fontSize={14} fill="#475569">{data.study.attribute.name} ({distributionUnit(data.study)})</text>
        </svg>
        <figcaption className="text-sm text-slate-600">One dot represents one recorded observation. Value step: {distributionValue(valueAxis.step)} {distributionUnit(data.study)}; frequency step: {distributionValue(countAxis.step)}.</figcaption>
    </figure>;
}
