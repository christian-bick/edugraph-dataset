import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {IntegerAddSubtractStrategy} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    formatOperationRelationship,
    isValidIntegerAddSubtractStrategyProblem,
    maskEquationResult,
    validateCountingRelationStrategy
} from './helpers.ts';
import {
    OperationsAddSubtractStrategyViewConfig,
    OperationsAddSubtractStrategyViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsAddSubtractStrategyViewConfig;
    payload: ViewRenderPayload<'operations-add-subtract-strategy'>;
}

const strategyTitles: Record<IntegerAddSubtractStrategy, string> = {
    'addition-counting-on': 'Count on for addition',
    'subtraction-counting-back': 'Count back for subtraction',
    'addition-make-ten': 'Make ten for addition',
    'addition-near-doubles': 'Use a near double',
    'addition-compensation': 'Addition compensation',
    'subtraction-compensation': 'Subtraction compensation',
    'subtraction-make-ten': 'Make ten for subtraction',
    'subtraction-think-addition': 'Think addition for subtraction'
};

const strategyDirections: Record<IntegerAddSubtractStrategy, string> = {
    'addition-counting-on': 'Start at one addend and count forward by the other addend.',
    'subtraction-counting-back': 'Start at the minuend and count backward by the subtrahend.',
    'addition-make-ten': 'Decompose one addend so part of it completes ten, then add the remainder.',
    'addition-near-doubles': 'Use the known double, then adjust by the difference between the addends.',
    'addition-compensation': 'Move the adjustment from one addend to the other so the sum stays equal.',
    'subtraction-compensation': 'Add the same adjustment to both numbers so the difference stays equal.',
    'subtraction-make-ten': 'Decompose the subtrahend so the first subtraction reaches 10, then subtract the remainder.',
    'subtraction-think-addition': 'Count up through the next multiple of ten, then combine both increases.'
};

const countingTitles = {
    'addition-counting-on': 'Count on',
    'subtraction-counting-back': 'Count back'
} as const;

const OperationsAddSubtractStrategyCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-add-subtract-strategy', data, [
        'task',
        'strategy',
        'operation',
        'leftOperand',
        'rightOperand',
        'answer',
        'adjustment',
        'prompt',
        'questionEquation',
        'solutionEquation',
        'transformedEquation',
        'steps',
        'explanation'
    ]);
    if (!isValidIntegerAddSubtractStrategyProblem(data)) {
        throw new ViewValidationError(
            'operations-add-subtract-strategy',
            'The strategy rewrite, adjustment, operation, result, and step equations must agree.'
        );
    }

    const isConceptDerivation = config.abilityMode === 'concept-derivation';
    const stepGridClass = data.steps.length === 1
        ? 'mx-auto max-w-[280px] grid-cols-1'
        : data.steps.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-3';

    if (isConceptDerivation) {
        const countingStrategy = validateCountingRelationStrategy(data.strategy);

        return (
            <div className="w-[860px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
                <div className="text-center">
                    <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                        {countingTitles[countingStrategy]}
                    </div>
                    <div className="mt-1 text-xl font-bold text-slate-800">
                        Use the steps to complete the related operation.
                    </div>
                </div>

                <div className={`mt-6 grid gap-4 ${stepGridClass}`}>
                    {data.steps.map((step, index) => (
                        <div key={index} className="rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-4 text-center">
                            <div className="text-xs font-bold uppercase tracking-[0.13em] text-indigo-700">
                                Step {index + 1}
                            </div>
                            <div className="mt-3 min-h-[42px] font-mono text-lg font-bold text-indigo-950">
                                {step}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-center">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                        Related equation
                    </div>
                    <div className={`mx-auto mt-2 w-fit rounded-xl border-2 px-8 py-3 font-mono text-3xl font-bold ${isSolutionView ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 bg-white text-slate-800'}`}>
                        {formatOperationRelationship(data, isSolutionView)}
                    </div>
                </div>

                {isSolutionView && (
                    <div className="mt-5 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-5 py-4 text-center text-sm font-semibold leading-relaxed text-emerald-950">
                        {data.explanation}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-[860px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                    {strategyTitles[data.strategy]}
                </div>
                <div className="mt-1 text-xl font-bold text-slate-800">{data.prompt}</div>
                <div className={`mx-auto mt-4 w-fit rounded-xl border-2 px-8 py-3 font-mono text-3xl font-bold ${isSolutionView ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 bg-white text-slate-800'}`}>
                    {isSolutionView ? data.solutionEquation : data.questionEquation}
                </div>
            </div>

            <div className="mt-5 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-5 py-4 text-center">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">Strategy rewrite</div>
                <div className="mt-1 font-mono text-2xl font-bold text-indigo-950">{data.transformedEquation}</div>
                <div className="mt-2 text-sm font-semibold text-indigo-900">{strategyDirections[data.strategy]}</div>
            </div>

            <div className={`mt-5 grid gap-4 ${stepGridClass}`}>
                {data.steps.map((step, index) => (
                    <div key={index} className={`rounded-xl border-2 px-4 py-4 text-center ${isSolutionView ? 'border-sky-300 bg-sky-50' : 'border-dashed border-slate-300 bg-white'}`}>
                        <div className="text-xs font-bold uppercase tracking-[0.13em] text-slate-600">
                            Step {index + 1}
                        </div>
                        <div className={`mt-3 min-h-[42px] font-mono text-lg font-bold ${isSolutionView ? 'text-sky-950' : 'text-slate-700'}`}>
                            {isSolutionView ? step : maskEquationResult(step)}
                        </div>
                    </div>
                ))}
            </div>

            {isSolutionView ? (
                <div className="mt-5 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-5 py-4 text-center text-sm font-semibold leading-relaxed text-emerald-950">
                    {data.explanation}
                </div>
            ) : (
                <div className="mt-5 rounded-xl border-2 border-dashed border-slate-300 px-5 py-4 text-center text-sm font-semibold text-slate-600">
                    Complete each equation in order. Use the strategy steps to find the missing result.
                </div>
            )}
        </div>
    );
};

export const OperationsAddSubtractStrategy = withConfig(
    OperationsAddSubtractStrategyViewSchema,
    OperationsAddSubtractStrategyCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-add-subtract-strategy'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsAddSubtractStrategy payload={payload} />);
    }
};
