import type {NumericalDataProblem} from '../../../types/problems.ts';
import {DistributionShapeMeaning, DistributionStudy} from './numerical-distribution-format.tsx';
import {NumericalDistributionPlot} from './numerical-distribution-plot.tsx';
import {SelectionCandidates, SelectionPurpose, SelectionRecords, SelectionSensitivity, SummarySuitability, summaryReplacement} from './summary-selection-format.tsx';
import {SelectionMethodWork} from './summary-selection-work.tsx';

export function SummarySelectionBody({data, isSolutionView}: {data: NumericalDataProblem; isSolutionView: boolean}) {
    const replacement = summaryReplacement(data);
    return <main className="w-[850px] max-w-full space-y-4 rounded-2xl bg-white p-7 font-sans text-[17px] leading-relaxed text-slate-800 shadow-sm">
        <p className="text-xl font-semibold">Choose suitable center and spread summaries for the stated purpose. Justify the choice using the recorded pattern and available comparison evidence.</p>
        <DistributionStudy data={data} /><SelectionPurpose data={data} /><SelectionRecords data={data} replacement={replacement} />
        <section className="space-y-1"><p className="font-semibold">Original recorded distribution</p><NumericalDistributionPlot data={data} highlightedRecordIds={[]} /></section>
        <SelectionCandidates data={data} replacement={replacement} />
        {isSolutionView ? <section className="space-y-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800" data-role="summary-selection-answer">
            <SummarySuitability data={data} /><DistributionShapeMeaning data={data} />
            <SelectionMethodWork data={data} summary={data.summary} proofs={data.relations} replacement={undefined} heading="Original summary evidence" />
            {replacement && <><SelectionSensitivity data={data} replacement={replacement} />
                <SelectionMethodWork data={data} summary={replacement.modified} proofs={replacement.modifiedProofs} replacement={replacement} heading="Counterfactual summary evidence" /></>}
        </section> : <section className="space-y-3 rounded-lg border border-slate-300 p-4" data-role="summary-selection-response">
            <p>Suitable center and reason:</p><div className="h-10 border-b border-slate-300" />
            <p>Suitable spread and reason:</p><div className="h-10 border-b border-slate-300" />
            <p>How do the observed pattern and available comparison support your choice?</p><div className="h-10 border-b border-slate-300" />
        </section>}
    </main>;
}
