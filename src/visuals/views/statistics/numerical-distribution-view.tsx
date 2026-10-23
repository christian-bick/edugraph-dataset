import type {NumericalDataProblem} from '../../../types/problems.ts';
import {DistributionCriterion, DistributionDepartureMeaning, DistributionRecords, DistributionShapeMeaning, DistributionStudy, DistributionSummaryGivens, DistributionSummaryMeaning, DistributionVariability} from './numerical-distribution-format.tsx';
import {NumericalDistributionPlot} from './numerical-distribution-plot.tsx';

export type NumericalDistributionTask = 'description' | 'patterns';

export function NumericalDistributionBody({data, task, isSolutionView}: {data: NumericalDataProblem; task: NumericalDistributionTask; isSolutionView: boolean}) {
    const highlighted = isSolutionView && task === 'patterns' && data.departureFacts ? data.departureFacts.exceptionalRecordIds : [];
    return <main className="w-[800px] max-w-full space-y-5 rounded-2xl bg-white p-7 font-sans text-[17px] leading-relaxed text-slate-800 shadow-sm">
        <p className="text-xl font-semibold">{task === 'description' ? 'Interpret the center, spread and empirical shape of this recorded distribution.' : 'Interpret the overall pattern and any departures under the stated criterion.'}</p>
        <DistributionStudy data={data} />
        <DistributionRecords data={data} />
        <NumericalDistributionPlot data={data} highlightedRecordIds={highlighted} />
        {task === 'description' ? <DistributionSummaryGivens data={data} /> : <DistributionCriterion data={data} />}
        {isSolutionView ? <section className="space-y-5 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-800" data-role="distribution-interpretation-answer">
            {task === 'description' && <><DistributionSummaryMeaning data={data} /><DistributionVariability data={data} /></>}
            <DistributionShapeMeaning data={data} />
            {task === 'patterns' && <DistributionDepartureMeaning data={data} />}
        </section> : <div className="space-y-3 border-t border-slate-200 pt-4 text-slate-500" data-role="distribution-interpretation-blank"><p>Interpretation: __________________________________________________</p><p>Evidence from this collection: ______________________________________</p></div>}
    </main>;
}
