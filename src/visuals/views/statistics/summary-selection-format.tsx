import type {NumericalDataProblem, NumericalDataSummaryCore, NumericalSensitivityProof} from '../../../types/problems.ts';
import {distributionArithmetic, distributionUnit, distributionValue, observationName} from './numerical-distribution-format.tsx';

export const summaryReplacement = (data: NumericalDataProblem) => data.relations.find(row => row.kind === 'single-record-replacement');
const names = {mean: 'Arithmetic mean', median: 'Median', mad: 'Mean absolute deviation (MAD)', iqr: 'Interquartile range (IQR)'} as const;
const candidates = (summary: NumericalDataSummaryCore) => [
    ['mean', summary.mean], ['median', summary.median.value], ['mad', summary.mad], ['iqr', summary.iqr]
] as const;

export function SelectionPurpose({data}: {data: NumericalDataProblem}) {
    const goal = data.study.goal.kind;
    return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" data-role="summary-selection-purpose"><p className="font-semibold">Investigation purpose</p>
        <p>{goal === 'equally-allocated-total' ? 'Describe a per-observation average that retains the recorded additive total, together with a useful description of spread.'
            : goal === 'routine-member' ? 'Describe a routine member of this recorded collection and the spread of the observations.'
                : 'Describe the recorded collection with a useful center and spread, explaining which aspect of the values each summary emphasizes.'}</p>
    </div>;
}

export function SelectionRecords({data, replacement}: {data: NumericalDataProblem; replacement: NumericalSensitivityProof | undefined}) {
    return <div className="space-y-2" data-role="summary-selection-records">
        {replacement && <p className="text-sm" data-role="summary-replacement-given">Documented counterfactual: replace {observationName(data, replacement.recordId)}={distributionValue(replacement.originalValue)} with {distributionValue(replacement.replacementValue)} {distributionUnit(data.study)}. All other observations keep their original values.</p>}
        <table className="w-full table-fixed border-collapse text-sm" style={{overflowWrap: 'anywhere'}}>
            <colgroup><col style={{width: '10%'}} /><col style={{width: '10%'}} /><col style={{width: '12%'}} /><col style={{width: replacement ? '34%' : '68%'}} />{replacement && <col style={{width: '34%'}} />}</colgroup>
            <thead><tr>{['Record', 'Unit', 'Occasion', `Original (${distributionUnit(data.study)})`, ...(replacement ? ['Counterfactual'] : [])].map(label => <th key={label} className="border border-slate-200 bg-slate-50 px-2 py-1.5 text-left">{label}</th>)}</tr></thead>
            <tbody>{data.records.map((record, index) => <tr key={record.id}>
                <td className="border border-slate-200 px-2 py-1">R{index + 1}</td><td className="border border-slate-200 px-2 py-1">U{data.study.units.findIndex(unit => unit.id === record.unitId) + 1}</td>
                <td className="border border-slate-200 px-2 py-1">O{data.study.occasions.findIndex(occasion => occasion.id === record.occasionId) + 1}</td>
                <td className="border border-slate-200 px-2 py-1 font-mono">{distributionValue(record.value)}</td>
                {replacement && <td className="border border-slate-200 px-2 py-1 font-mono">{distributionValue(record.id === replacement.recordId ? replacement.replacementValue : record.value)}</td>}
            </tr>)}</tbody></table>
    </div>;
}

export function SelectionCandidates({data, replacement}: {data: NumericalDataProblem; replacement: NumericalSensitivityProof | undefined}) {
    const modified = replacement && candidates(replacement.modified);
    return <section className="space-y-2" data-role="summary-selection-candidates"><p className="font-semibold">Candidate summary values</p>
        <table className="w-full table-fixed border-collapse text-sm" style={{overflowWrap: 'anywhere'}}>
            <colgroup><col style={{width: '36%'}} /><col style={{width: modified ? '32%' : '64%'}} />{modified && <col style={{width: '32%'}} />}</colgroup>
            <thead><tr><th className="border border-slate-200 p-2 text-left">Summary</th><th className="border border-slate-200 p-2 text-left">Original ({distributionUnit(data.study)})</th>{modified && <th className="border border-slate-200 p-2 text-left">Counterfactual ({distributionUnit(data.study)})</th>}</tr></thead>
            <tbody>{candidates(data.summary).map(([kind, value], index) => <tr key={kind}><td className="border border-slate-200 p-2">{names[kind]}</td><td className="border border-slate-200 p-2 font-mono">{distributionValue(value)}</td>{modified && <td className="border border-slate-200 p-2 font-mono">{distributionValue(modified[index][1])}</td>}</tr>)}</tbody></table>
        <p className="text-sm text-slate-600">Quartiles are the medians of the lower and upper halves, excluding the central observation when the count is odd. These values are premises for the suitability choice.</p>
    </section>;
}

export function SummarySuitability({data}: {data: NumericalDataProblem}) {
    const unit = distributionUnit(data.study), summary = data.summary, goal = data.study.goal.kind;
    return <div className="space-y-2" data-role="summary-suitability-answer"><p className="font-semibold">One suitable choice and its purpose</p>
        {goal === 'equally-allocated-total' ? <>
            <p>Choose the arithmetic mean {distributionValue(summary.mean)} {unit} for the center. Dividing the recorded total {distributionValue(summary.sum)} {unit} by {summary.count} records gives the per-record numerical average required by this purpose.</p>
            <p>Choose MAD {distributionValue(summary.mad)} {unit} to describe the average absolute departure from that mean. IQR {distributionValue(summary.iqr)} {unit} is also useful when the spread question concerns the middle half. This purpose does not require one unique spread summary.</p>
            {data.study.attribute.kind === 'count' && <p>A fractional item count here describes a per-record average; a physical distribution of whole items needs its own feasibility conditions.</p>}
        </> : goal === 'routine-member' ? <>
            <p>One suitable pair is median {distributionValue(summary.median.value)} {unit} and IQR {distributionValue(summary.iqr)} {unit}. The median locates the ordered middle, and IQR describes the middle-half span under the stated convention, fitting this emphasis on a routine member.</p>
            <p>Mean {distributionValue(summary.mean)} {unit} and MAD {distributionValue(summary.mad)} {unit} instead describe the numerical average and average distance from it, retaining every recorded magnitude. The actual pattern and any replacement comparison below show the tradeoff for this collection.</p>
        </> : <>
            <p>One suitable pair is arithmetic mean {distributionValue(summary.mean)} {unit} and MAD {distributionValue(summary.mad)} {unit}: together they describe the numerical average of all recorded magnitudes and the average absolute distance from it.</p>
            <p>Median {distributionValue(summary.median.value)} {unit} and IQR {distributionValue(summary.iqr)} {unit} provide a defensible alternative when the emphasis is the ordered middle and middle-half span. Center and spread can also be chosen separately when their meanings answer the stated question.</p>
        </>}
        <p>The purpose determines which aspect each summary addresses; the recorded pattern supplies context.</p>
    </div>;
}

const comparison = {less: 'less than', equal: 'equal to', greater: 'greater than'} as const;
export function SelectionSensitivity({data, replacement}: {data: NumericalDataProblem; replacement: NumericalSensitivityProof}) {
    return <div className="space-y-2" data-role="summary-selection-sensitivity"><p className="font-semibold">Actual change for this documented replacement</p>
        <p>Each signed difference is counterfactual minus original; absolute changes are in {distributionUnit(data.study)}.</p>
        {replacement.changes.map(row => <p key={row.measure} className="font-mono">{names[row.measure]}: {distributionArithmetic(row.difference)}; absolute change {distributionValue(row.absoluteDifference)}.</p>)}
        <p>The absolute change in the mean is {comparison[replacement.centerChangeRelation]} the absolute change in the median. The absolute change in MAD is {comparison[replacement.spreadChangeRelation]} the absolute change in IQR.</p>
        <p>These compare this replacement only. Other replacements or other collections can produce different changes.</p>
    </div>;
}
