import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    MultiplicativeComparisonQuantityRole,
    presentMultiplicativeComparison,
    selectMultiplicativeComparisonUnknown,
    validateMultiplicativeComparison
} from '../multiplicative-comparison-presentation.ts';
import {
    OperationsMultiplicativeComparisonWordProblemViewConfig,
    OperationsMultiplicativeComparisonWordProblemViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-multiplicative-comparison-word-problem';

interface CoreProps {
    config: OperationsMultiplicativeComparisonWordProblemViewConfig;
    payload: ViewRenderPayload<'operations-multiplicative-comparison-word-problem'>;
}

type QuantityRole = MultiplicativeComparisonQuantityRole;

const roleLabels: Record<QuantityRole, string> = {
    reference: 'reference quantity',
    'scale-factor': 'scale factor',
    compared: 'compared quantity'
};

function QuantityCard({
    entity,
    role,
    value,
    isUnknown,
    isSolutionView
}: {
    entity: string;
    role: QuantityRole;
    value: number;
    isUnknown: boolean;
    isSolutionView: boolean;
}) {
    const hidden = isUnknown && !isSolutionView;
    const highlighted = isUnknown && isSolutionView;

    return (
        <div className={`flex min-h-[118px] w-[215px] flex-col justify-between rounded-2xl border-2 p-4 ${
            highlighted
                ? 'border-emerald-600 bg-emerald-50'
                : hidden
                    ? 'border-dashed border-sky-500 bg-sky-50'
                    : 'border-slate-200 bg-white'
        }`}>
            <div>
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {roleLabels[role]}
                </div>
                <div className="mt-1 text-lg font-bold text-slate-700">{entity}</div>
            </div>
            <div className={`font-mono text-[2rem] font-extrabold ${
                highlighted ? 'text-emerald-700' : hidden ? 'text-sky-700' : 'text-slate-800'
            }`}>
                {hidden ? '?' : value}
            </div>
        </div>
    );
}

function ScaleFactorCard({
    value,
    isUnknown,
    isSolutionView
}: {
    value: number;
    isUnknown: boolean;
    isSolutionView: boolean;
}) {
    const hidden = isUnknown && !isSolutionView;
    const highlighted = isUnknown && isSolutionView;

    return (
        <div className="flex w-[126px] shrink-0 flex-col items-center gap-2 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">scale factor</div>
            <div className={`flex h-[62px] w-[96px] items-center justify-center rounded-xl border-2 font-mono text-[1.65rem] font-extrabold ${
                highlighted
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : hidden
                        ? 'border-dashed border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-800'
            }`}>
                × {hidden ? '?' : value}
            </div>
            <div className="text-[0.78rem] font-semibold leading-tight text-slate-500">
                times the reference
            </div>
        </div>
    );
}

const OperationsMultiplicativeComparisonWordProblemCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'referenceQuantity',
        'scaleFactor',
        'comparedQuantity',
        'operation'
    ]);
    validateMultiplicativeComparison(VIEW_ID, data);
    const unknownRole = selectMultiplicativeComparisonUnknown(data.operation);
    const presentation = presentMultiplicativeComparison(data, unknownRole);

    return (
        <div className="w-[760px] rounded-3xl bg-white p-8 font-sans shadow-[0_12px_34px_rgba(15,23,42,0.1)]">
            <div className="rounded-2xl border-l-4 border-sky-500 bg-slate-50 px-6 py-5">
                <div className="text-[1.18rem] font-semibold leading-relaxed text-slate-700">{presentation.story}</div>
                <div className="mt-3 text-[1.24rem] font-extrabold leading-relaxed text-slate-900">
                    {presentation.question}
                </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="text-sm font-bold uppercase tracking-[0.14em] text-sky-700">
                        Reference → scaled comparison
                    </div>
                    <div className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-800">
                        Find the {roleLabels[unknownRole]}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                    <QuantityCard
                        entity={presentation.referenceEntity}
                        role="reference"
                        value={data.referenceQuantity}
                        isUnknown={unknownRole === 'reference'}
                        isSolutionView={isSolutionView}
                    />
                    <ScaleFactorCard
                        value={data.scaleFactor}
                        isUnknown={unknownRole === 'scale-factor'}
                        isSolutionView={isSolutionView}
                    />
                    <div className="text-[1.8rem] font-extrabold text-sky-600">→</div>
                    <QuantityCard
                        entity={presentation.comparedEntity}
                        role="compared"
                        value={data.comparedQuantity}
                        isUnknown={unknownRole === 'compared'}
                        isSolutionView={isSolutionView}
                    />
                </div>

                <div className="mt-4 min-h-[24px] text-center text-base font-semibold text-slate-600">
                    {isSolutionView
                        ? presentation.comparisonStatement
                        : 'Use the reference-to-compared direction to find the unknown.'}
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-5">
                <div className="flex items-center justify-between gap-5">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            Equation model
                        </div>
                        <div className="mt-2 font-mono text-[1.7rem] font-extrabold text-slate-800">
                            {presentation.givenEquation}
                        </div>
                    </div>
                    {isSolutionView && (
                        <div className="min-w-[270px] rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3">
                            <div className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                                Answer: {presentation.answer}
                            </div>
                            <div className="mt-1 font-mono text-[1.35rem] font-extrabold text-emerald-800">
                                {presentation.solutionEquation}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const OperationsMultiplicativeComparisonWordProblem = withConfig(
    OperationsMultiplicativeComparisonWordProblemViewSchema,
    OperationsMultiplicativeComparisonWordProblemCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-multiplicative-comparison-word-problem'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsMultiplicativeComparisonWordProblem payload={payload} />);
    }
};
