import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MeasurementWordProblemGrade4} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidMeasurementWordProblemGrade4} from './helpers.ts';
import {
    MeasurementWordProblemGrade4ViewConfig,
    MeasurementWordProblemGrade4ViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasurementWordProblemGrade4ViewConfig;
    payload: ViewRenderPayload<'measurement-word-problem-grade4'>;
}

const titleCase = (value: string): string => value
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const operandText = (
    operand: MeasurementWordProblemGrade4['operands'][number]
): string => operand.role === 'measured'
    ? operand.value.quantityText
    : operand.display;

const MeasurementWordProblemGrade4Core = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('measurement-word-problem-grade4', data, [
        'task',
        'measurementKind',
        'numberKind',
        'unit',
        'operation',
        'operands',
        'story',
        'question',
        'questionEquation',
        'solutionEquation',
        'answer',
        'answerStatement',
        'explanation'
    ]);
    if (!isValidMeasurementWordProblemGrade4(data)) {
        throw new ViewValidationError(
            'measurement-word-problem-grade4',
            'Expected a coherent same-unit Grade 4 measurement word problem.'
        );
    }

    return (
        <div className="w-[860px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                    Measurement story
                </div>
                <div className="flex flex-wrap justify-end gap-2 text-xs font-bold uppercase tracking-[0.1em]">
                    <span className="rounded-full bg-indigo-50 px-3 py-2 text-indigo-800">
                        {titleCase(data.measurementKind)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">
                        {titleCase(data.numberKind)}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-800">
                        {titleCase(data.operation)}
                    </span>
                </div>
            </div>

            <div className="mt-4 rounded-xl border-l-4 border-indigo-500 bg-slate-50 px-6 py-5 text-xl font-semibold leading-relaxed text-slate-800">
                {data.story}
            </div>
            <div className="mt-4 text-center text-xl font-extrabold leading-relaxed text-slate-900">
                {data.question}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
                {data.operands.map((operand, index) => (
                    <div key={`${operand.label}-${index}`} className="min-w-0 rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-center">
                        <div className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
                            {operand.label}
                        </div>
                        <div className="mt-2 break-words text-[1.65rem] font-extrabold leading-tight text-slate-900">
                            {operandText(operand)}
                        </div>
                        <div className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                            {operand.role === 'measured' ? 'Measured quantity' : 'Whole-number group count'}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 rounded-xl bg-slate-900 px-6 py-5 text-center text-white">
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
                    One-step equation
                </div>
                <div className="mt-2 break-words font-mono text-[1.85rem] font-extrabold leading-snug text-amber-300">
                    {data.questionEquation}
                </div>
                {isSolutionView && (
                    <div className="mt-4 border-t border-slate-600 pt-4">
                        <div className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-300">
                            Solved equation
                        </div>
                        <div className="mt-2 break-words font-mono text-[1.85rem] font-extrabold leading-snug text-emerald-300">
                            {data.solutionEquation}
                        </div>
                    </div>
                )}
            </div>

            {isSolutionView ? (
                <>
                    <div className="mt-5 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-center">
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Answer</div>
                        <div className="mt-1 text-[1.7rem] font-extrabold text-emerald-950">{data.answer.quantityText}</div>
                        <div className="mt-1 text-base font-semibold leading-relaxed text-emerald-900">{data.answerStatement}</div>
                    </div>
                    <div className="mt-4 rounded-xl bg-indigo-50 px-5 py-4 text-base font-semibold leading-relaxed text-indigo-950">
                        {data.explanation}
                    </div>
                </>
            ) : (
                <div className="mt-5 rounded-xl border-2 border-dashed border-slate-300 px-5 py-4 text-center text-[1.55rem] font-extrabold text-slate-400">
                    Answer: ?
                </div>
            )}
        </div>
    );
};

export const MeasurementWordProblemGrade4View = withConfig(
    MeasurementWordProblemGrade4ViewSchema,
    MeasurementWordProblemGrade4Core
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measurement-word-problem-grade4'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasurementWordProblemGrade4View payload={payload} />);
};
