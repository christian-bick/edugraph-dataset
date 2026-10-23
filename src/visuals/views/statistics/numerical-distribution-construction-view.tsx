import type {NumericalDataProblem} from '../../../types/problems.ts';
import {DistributionRecords, DistributionStudy} from './numerical-distribution-format.tsx';
import {displayName, NumericalDisplayConvention, NumericalDisplayEvidence, type NumericalDisplay} from './numerical-distribution-construction-format.tsx';
import {NumericalConstructionPlot} from './numerical-distribution-construction-plot.tsx';

export function NumericalDistributionConstruction({data, plot, isSolutionView}: {data: NumericalDataProblem; plot: NumericalDisplay; isSolutionView: boolean}) {
    return <main className="w-[800px] max-w-full space-y-5 rounded-2xl bg-white p-7 font-sans text-[17px] leading-relaxed text-slate-800 shadow-sm">
        <p className="text-xl font-semibold">{isSolutionView ? `Completed ${displayName(plot)}` : `Construct a ${displayName(plot)} from the recorded observations.`}</p>
        <DistributionStudy data={data} /><DistributionRecords data={data} /><NumericalDisplayConvention data={data} plot={plot} />
        <NumericalConstructionPlot data={data} plot={plot} isSolutionView={isSolutionView} />
        {isSolutionView && <section className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800" data-role="numerical-construction-work"><NumericalDisplayEvidence data={data} plot={plot} /></section>}
    </main>;
}
