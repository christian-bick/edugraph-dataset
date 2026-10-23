import type {NumericalDataProblem} from '../../../types/problems.ts';
import {DistributionRecords, DistributionStudy} from './numerical-distribution-format.tsx';
import {NumericalDistributionPlot} from './numerical-distribution-plot.tsx';
import {centerSummaryKind, variationSummaryKind} from './summary-meaning-format.tsx';
import {ContextualCenterSolution, ContextualVariationSolution} from './contextual-summary-format.tsx';

export function ContextualSummaryBody({data, task, isSolutionView}: {
    data: NumericalDataProblem; task: 'center' | 'variation'; isSolutionView: boolean;
}) {
    const name = task === 'center' ? centerSummaryKind(data) === 'mean' ? 'arithmetic mean' : 'median'
        : variationSummaryKind(data) === 'mad' ? 'mean absolute deviation (MAD)' : 'interquartile range (IQR)';
    return <main className="w-[800px] max-w-full space-y-4 bg-white p-7 text-[17px] leading-relaxed text-slate-800">
        <p className="text-xl font-semibold">Calculate the {name} of this recorded collection. Show the work and explain the result in the context of the recorded characteristic and its units.</p>
        <DistributionStudy data={data} />
        <DistributionRecords data={data} />
        <NumericalDistributionPlot data={data} highlightedRecordIds={[]} />
        {task === 'variation' && variationSummaryKind(data) === 'iqr' && <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">Quartiles use medians of the lower and upper halves, excluding the central observation when the record count is odd.</p>}
        {isSolutionView ? <section className="space-y-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800" data-role="contextual-summary-answer">
            {task === 'center' ? <ContextualCenterSolution data={data} /> : <ContextualVariationSolution data={data} />}
        </section> : <section className="space-y-3 rounded-lg border border-slate-300 p-4" data-role="contextual-summary-blank">
            <p>Calculation:</p><div className="h-20 border-b border-slate-300" />
            <p>Meaning in this context:</p><div className="h-12 border-b border-slate-300" />
        </section>}
    </main>;
}
