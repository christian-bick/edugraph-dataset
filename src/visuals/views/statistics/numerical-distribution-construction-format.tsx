import type {NumericalDataProblem, NumericalMiddle} from '../../../types/problems.ts';
import {distributionUnit, distributionValue, observationName} from './numerical-distribution-format.tsx';

export type NumericalDisplay = 'line-plot' | 'histogram' | 'box-plot';
export const displayName = (plot: NumericalDisplay) => plot === 'line-plot' ? 'line plot' : plot === 'histogram' ? 'histogram' : 'box plot';
const middleWork = (middle: NumericalMiddle) => middle.centralValues.length === 1 ? distributionValue(middle.value)
    : `(${middle.centralValues.map(distributionValue).join(' + ')}) ÷ 2 = ${distributionValue(middle.value)}`;

export function NumericalDisplayConvention({data, plot}: {data: NumericalDataProblem; plot: NumericalDisplay}) {
    return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm" data-role="numerical-display-convention">
        {plot === 'line-plot' ? <p>Place one dot for each observation. Repeated equal values form a vertical stack.</p>
            : plot === 'histogram' ? <><p>Use these equal-width bins. Each includes its lower endpoint; only the final bin includes its upper endpoint.</p>
                <p>{data.plots.histogram.bins.map(bin => `[${distributionValue(bin.lower)}, ${distributionValue(bin.upper)}${bin.upperClosed ? ']' : ')'}`).join('; ')} {distributionUnit(data.study)}.</p></>
                : <p>Quartiles are the medians of the lower and upper halves, excluding the central observation when the count is odd. Whiskers end at the observed minimum and maximum.</p>}
    </div>;
}

export function NumericalDisplayEvidence({data, plot}: {data: NumericalDataProblem; plot: NumericalDisplay}) {
    if (plot === 'box-plot') return <div className="space-y-2" data-role="numerical-box-work">
        <p>Ordered records: {data.summary.orderedRecordIds.map(id => observationName(data, id)).join(', ')}.</p>
        <p>Median: {middleWork(data.summary.median)}. Lower-half middle: {middleWork(data.summary.quartiles.lowerHalf)}. Upper-half middle: {middleWork(data.summary.quartiles.upperHalf)}.</p>
        <p>Minimum {distributionValue(data.plots.box.minimum.value)}; Q1 {distributionValue(data.plots.box.q1.value)}; median {distributionValue(data.plots.box.median.value)}; Q3 {distributionValue(data.plots.box.q3.value)}; maximum {distributionValue(data.plots.box.maximum.value)} {distributionUnit(data.study)}.</p>
    </div>;
    const rows = plot === 'line-plot'
        ? data.frequencies.map(row => ({id: row.id, label: distributionValue(row.value), members: row.recordIds, count: row.count}))
        : data.plots.histogram.bins.map(row => ({id: row.id, label: `[${distributionValue(row.lower)}, ${distributionValue(row.upper)}${row.upperClosed ? ']' : ')'}`, members: row.recordIds, count: row.count}));
    return <table className="w-full border-collapse text-sm" data-role="numerical-frequency-work"><thead><tr>
        <th className="border border-emerald-200 p-2 text-left">{plot === 'line-plot' ? 'Recorded value' : 'Bin'} ({distributionUnit(data.study)})</th>
        <th className="border border-emerald-200 p-2 text-left">Observations</th><th className="border border-emerald-200 p-2 text-left">Frequency</th>
    </tr></thead><tbody>{rows.map(row => <tr key={row.id}><td className="border border-emerald-200 p-2">{row.label}</td>
        <td className="border border-emerald-200 p-2">{row.members.length === 0 ? 'none' : row.members.map(id => observationName(data, id)).join(', ')}</td>
        <td className="border border-emerald-200 p-2">{row.count}</td></tr>)}</tbody></table>;
}
