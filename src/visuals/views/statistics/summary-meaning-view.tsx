import type {NumericalDataProblem} from '../../../types/problems.ts';
import {DistributionRecords, DistributionStudy} from './numerical-distribution-format.tsx';
import {NumericalDistributionPlot} from './numerical-distribution-plot.tsx';
import {CenterSummaryGiven, CenterSummaryMeaning, VariationSummaryGiven, VariationSummaryMeaning} from './summary-meaning-format.tsx';

export function SummaryMeaningBody({data, task, isSolutionView}: {
    data: NumericalDataProblem; task: 'center' | 'variation'; isSolutionView: boolean;
}) {
    return <main className="w-[800px] max-w-full space-y-4 bg-white p-7 text-[17px] leading-relaxed text-slate-800">
        <p className="text-xl font-semibold">{task === 'center'
            ? 'Explain what the given center value says about this recorded collection. Distinguish its meaning from the number of observations and from spread.'
            : 'Explain what the given variation value says about the spread of this recorded collection, using the original units.'}</p>
        <DistributionStudy data={data} />
        <DistributionRecords data={data} />
        <NumericalDistributionPlot data={data} highlightedRecordIds={[]} />
        {task === 'center' ? <CenterSummaryGiven data={data} /> : <VariationSummaryGiven data={data} />}
        {isSolutionView ? <section className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800" data-role="summary-meaning-answer">
            {task === 'center' ? <CenterSummaryMeaning data={data} /> : <VariationSummaryMeaning data={data} />}
        </section> : <section className="space-y-3 rounded-lg border border-slate-300 p-4" data-role="summary-meaning-blank">
            <p>Meaning in this context:</p><div className="h-12 border-b border-slate-300" />
            <p>Support from the records:</p><div className="h-12 border-b border-slate-300" />
        </section>}
    </main>;
}
