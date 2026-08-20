import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    MediatedRibbonId,
    ribbonWidthsForChain,
    validateMediatedComparisonProblem
} from './helpers.ts';
import {
    MeasureMediatedComparisonViewConfig,
    MeasureMediatedComparisonViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasureMediatedComparisonViewConfig;
    payload: ViewRenderPayload<'measure-mediated-comparison'>;
}

function RibbonStrip({id, width}: {id: MediatedRibbonId; width: number}) {
    const colorClass = id === 'A'
        ? 'bg-rose-500 text-white'
        : id === 'B'
            ? 'bg-sky-600 text-white ring-4 ring-sky-100'
            : 'bg-amber-500 text-white';

    return (
        <div className="flex h-[34px] items-center">
            <span className="w-[30px] text-sm font-extrabold text-slate-700">{id}</span>
            <div className="border-l-2 border-dashed border-slate-400 pl-1">
                <div
                    className={`flex h-[26px] items-center justify-center text-sm font-extrabold shadow-sm ${colorClass}`}
                    style={{
                        width: `${width}px`,
                        clipPath: 'polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%, 7px 50%)'
                    }}
                >
                    Ribbon {id}
                </div>
            </div>
        </div>
    );
}

function PremiseCard({
    number,
    subject,
    relation,
    reference,
    widths
}: {
    number: 1 | 2;
    subject: 'A' | 'B';
    relation: 'longer' | 'shorter';
    reference: 'B' | 'C';
    widths: Record<MediatedRibbonId, number>;
}) {
    return (
        <div className="flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3.5">
            <span className="w-[82px] whitespace-nowrap text-sm font-bold uppercase tracking-wide text-slate-500">
                Premise {number}
            </span>
            <div className="w-[226px] rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="mb-1 pl-[30px] text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Aligned start
                </div>
                <RibbonStrip id={subject} width={widths[subject]}/>
                <RibbonStrip id={reference} width={widths[reference]}/>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1 text-center">
                <span className="text-sm font-semibold text-slate-500">
                    Ribbon {subject} is
                </span>
                <span className="rounded-full bg-violet-100 px-4 py-1.5 text-lg font-extrabold text-violet-800">
                    {relation}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                    than Ribbon {reference}
                </span>
            </div>
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
    const widths = ribbonWidthsForChain(firstPremise.relation);
    const prompt = `Using Ribbon B as the length benchmark, which target ribbon is ${data.askedRelation}, A or C?`;

    return (
        <div className="flex w-fit items-center justify-center rounded-2xl bg-white p-[30px] font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex w-[650px] flex-col items-center gap-4">
                <div className="flex h-[48px] items-center justify-center text-center text-[1.25rem] font-bold leading-snug text-slate-700">
                    {isSolutionView ? '' : prompt}
                </div>

                <PremiseCard
                    number={1}
                    subject={firstPremise.subject}
                    relation={firstPremise.relation}
                    reference={firstPremise.reference}
                    widths={widths}
                />

                <div className="flex items-center gap-3 text-sm font-bold text-sky-800">
                    <span className="h-5 border-l-2 border-dashed border-sky-400"/>
                    <span className="rounded-full bg-sky-100 px-4 py-1">
                        Same length benchmark: Ribbon B
                    </span>
                    <span className="h-5 border-l-2 border-dashed border-sky-400"/>
                </div>

                <PremiseCard
                    number={2}
                    subject={secondPremise.subject}
                    relation={secondPremise.relation}
                    reference={secondPremise.reference}
                    widths={widths}
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
