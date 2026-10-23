import type {StatisticalQuestionsProblem} from '../../../types/problems.ts';
import {orderStatisticalInvestigations, StatisticalClassificationExplanation, StatisticalInvestigationPremises} from './statistical-question-format.tsx';

export function StatisticalQuestionBody({data, isSolutionView, seed}: {data: StatisticalQuestionsProblem; isSolutionView: boolean; seed: number}) {
    const ordered = orderStatisticalInvestigations(data, seed);
    return <main className="w-[780px] max-w-full space-y-5 rounded-2xl bg-white p-7 font-sans text-[17px] leading-relaxed text-slate-800 shadow-sm">
        <p className="text-xl font-semibold">Classify each investigation as statistical or not statistical.</p>
        <p>Give a brief reason about whether variability is anticipated among its observations.</p>
        {ordered.map((value, index) => <section key={value.id} className="space-y-4 rounded-xl border border-slate-200 p-5" data-role="statistical-investigation-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Investigation {index + 1}</p>
            <StatisticalInvestigationPremises value={value} />
            {isSolutionView ? <StatisticalClassificationExplanation value={value} />
                : <div className="space-y-3 border-t border-slate-200 pt-3 text-slate-500" data-role="statistical-classification-blank"><p>Classification: ____________________</p><p>Reason: __________________________________________________</p></div>}
        </section>)}
    </main>;
}
