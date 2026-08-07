import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateMediatedComparisonProblem} from './helpers.ts';
import {
    MeasureMediatedComparisonViewConfig,
    MeasureMediatedComparisonViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasureMediatedComparisonViewConfig;
    payload: ViewRenderPayload<'measure-mediated-comparison'>;
}

function ObjectBadge({id}: {id: 'A' | 'B' | 'C'}) {
    const colorClass = id === 'A'
        ? 'border-rose-500 bg-rose-50 text-rose-800'
        : id === 'B'
            ? 'border-sky-600 bg-sky-100 text-sky-900 ring-4 ring-sky-100'
            : 'border-amber-500 bg-amber-50 text-amber-800';

    return (
        <div className={`flex h-[66px] min-w-[120px] flex-col items-center justify-center rounded-xl border-2 ${colorClass}`}>
            <span className="text-xs font-bold uppercase tracking-wide">
                {id === 'B' ? 'Intermediary' : 'Target'}
            </span>
            <span className="text-2xl font-extrabold">Ribbon {id}</span>
        </div>
    );
}

function PremiseCard({
    number,
    subject,
    relation,
    reference
}: {
    number: 1 | 2;
    subject: 'A' | 'B';
    relation: 'longer' | 'shorter';
    reference: 'B' | 'C';
}) {
    return (
        <div className="flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
            <span className="w-[82px] text-sm font-bold uppercase tracking-wide text-slate-500">
                Premise {number}
            </span>
            <ObjectBadge id={subject}/>
            <div className="flex flex-1 flex-col items-center gap-1 text-center">
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">is</span>
                <span className="rounded-full bg-violet-100 px-4 py-2 text-lg font-extrabold text-violet-800">
                    {relation} than
                </span>
            </div>
            <ObjectBadge id={reference}/>
        </div>
    );
}

const MeasureMediatedComparisonCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('measure-mediated-comparison', data, [
        'objects',
        'intermediary',
        'premises',
        'askedRelation',
        'answer'
    ]);
    validateMediatedComparisonProblem(data);

    const [firstPremise, secondPremise] = data.premises;
    const prompt = `Which target ribbon is ${data.askedRelation}, A or C?`;

    return (
        <div className="flex w-fit items-center justify-center rounded-2xl bg-white p-[30px] font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex w-[650px] flex-col items-center gap-4">
                <div className="flex h-[38px] items-center justify-center text-[1.35rem] font-bold text-slate-700">
                    {isSolutionView ? '' : prompt}
                </div>

                <PremiseCard
                    number={1}
                    subject={firstPremise.subject}
                    relation={firstPremise.relation}
                    reference={firstPremise.reference}
                />

                <div className="flex items-center gap-3 text-sm font-bold text-sky-800">
                    <span className="h-5 border-l-2 border-dashed border-sky-400"/>
                    <span className="rounded-full bg-sky-100 px-4 py-1">Same intermediary: Ribbon B</span>
                    <span className="h-5 border-l-2 border-dashed border-sky-400"/>
                </div>

                <PremiseCard
                    number={2}
                    subject={secondPremise.subject}
                    relation={secondPremise.relation}
                    reference={secondPremise.reference}
                />

                <div className="mt-2 flex w-[360px] gap-4">
                    {(['A', 'C'] as const).map(option => {
                        const isAnswer = data.answer === option;
                        const optionClass = isSolutionView && isAnswer
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                            : 'border-slate-300 bg-white text-slate-700';
                        return (
                            <div
                                key={option}
                                className={`flex h-[62px] flex-1 items-center justify-center rounded-xl border-2 text-xl ${optionClass}`}
                            >
                                Ribbon {option}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const MeasureMediatedComparison = withConfig(
    MeasureMediatedComparisonViewSchema,
    MeasureMediatedComparisonCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'measure-mediated-comparison'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<MeasureMediatedComparison payload={payload}/>);
    }
};
