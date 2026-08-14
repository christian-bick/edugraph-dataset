import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ArithmeticPairProblem, ArithmeticWordProblemTwoStep} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    getPairUnknown,
    getWordProblemStory,
    isTwoStepProblem,
    operationSymbol,
    WordProblemPart
} from './helpers.ts';
import {
    OperationsWordProblemWithin100ViewConfig,
    OperationsWordProblemWithin100ViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsWordProblemWithin100ViewConfig;
    payload: ViewRenderPayload<'operations-word-problem-within-100'>;
}

function ValueBox({
    part,
    value,
    hidden,
    highlighted,
    unit
}: {
    part: WordProblemPart;
    value: number;
    hidden: boolean;
    highlighted: boolean;
    unit: string;
}) {
    return (
        <div
            aria-label={`${part} value`}
            className={`flex h-[58px] min-w-[72px] items-center justify-center rounded-xl border-2 px-3 font-mono text-[1.75rem] font-bold ${
                highlighted
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : hidden
                        ? 'border-dashed border-slate-400 bg-white text-slate-400'
                        : 'border-slate-300 bg-white text-slate-800'
            }`}
        >
            {hidden ? '?' : `${value}${unit}`}
        </div>
    );
}

function EquationRow({
    left,
    right,
    operation,
    hiddenParts,
    isSolutionView,
    unit
}: {
    left: Array<{part: WordProblemPart; value: number}>;
    right: {part: WordProblemPart; value: number};
    operation: string;
    hiddenParts: WordProblemPart[];
    isSolutionView: boolean;
    unit: string;
}) {
    const renderBox = ({part, value}: {part: WordProblemPart; value: number}) => (
        <ValueBox
            key={part}
            part={part}
            value={value}
            hidden={!isSolutionView && hiddenParts.includes(part)}
            highlighted={isSolutionView && hiddenParts.includes(part)}
            unit={unit}
        />
    );

    return (
        <div className="flex items-center justify-center gap-3 text-[1.8rem] font-extrabold text-slate-500">
            {renderBox(left[0])}
            <span>{operationSymbol(operation)}</span>
            {renderBox(left[1])}
            <span>=</span>
            {renderBox(right)}
        </div>
    );
}

function CombinedEquationRow({
    data,
    isSolutionView,
    unit
}: {
    data: ArithmeticWordProblemTwoStep;
    isSolutionView: boolean;
    unit: string;
}) {
    return (
        <div className="flex items-center justify-center gap-3 border-b border-slate-200 pb-4 text-[1.8rem] font-extrabold text-slate-500">
            <ValueBox part="num1" value={data.num1} hidden={false} highlighted={false} unit={unit} />
            <span>{operationSymbol(data.operations[0])}</span>
            <ValueBox part="num2" value={data.num2} hidden={false} highlighted={false} unit={unit} />
            <span>{operationSymbol(data.operations[1])}</span>
            <ValueBox part="num3" value={data.num3} hidden={false} highlighted={false} unit={unit} />
            <span>=</span>
            <ValueBox
                part="answer"
                value={data.answer}
                hidden={!isSolutionView}
                highlighted={isSolutionView}
                unit={unit}
            />
        </div>
    );
}

function validatePair(data: ArithmeticPairProblem) {
    if (!['addition', 'subtraction', 'multiplication', 'division'].includes(data.operation)) {
        throw new ViewValidationError('operations-word-problem-within-100', `Unsupported operation: ${data.operation}`);
    }
    if (!['num1', 'num2', 'solution'].includes(data.blankPart)) {
        throw new ViewValidationError('operations-word-problem-within-100', `Unsupported unknown: ${data.blankPart}`);
    }

    const expected = data.operation === 'addition'
        ? data.num1 + data.num2
        : data.operation === 'subtraction'
            ? data.num1 - data.num2
            : data.operation === 'multiplication'
                ? data.num1 * data.num2
                : data.num1 / data.num2;
    if (!Number.isFinite(expected) || expected !== data.answer) {
        throw new ViewValidationError('operations-word-problem-within-100', 'The one-step equation is inconsistent.');
    }
}

function validateTwoStep(data: ArithmeticWordProblemTwoStep) {
    if (data.operations.length !== 2 || data.operations.some(operation =>
        !['addition', 'subtraction', 'multiplication', 'division'].includes(operation)
    )) {
        throw new ViewValidationError('operations-word-problem-within-100', 'Unsupported two-step operation sequence.');
    }

    const apply = (left: number, right: number, operation: string) => {
        if (operation === 'addition') return left + right;
        if (operation === 'subtraction') return left - right;
        if (operation === 'multiplication') return left * right;
        return left / right;
    };
    const intermediate = apply(data.num1, data.num2, data.operations[0]);
    const answer = apply(intermediate, data.num3, data.operations[1]);
    if (intermediate !== data.intermediate || answer !== data.answer) {
        throw new ViewValidationError('operations-word-problem-within-100', 'The connected two-step equations are inconsistent.');
    }
}

const OperationsWordProblemWithin100Core = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-word-problem-within-100', data, ['num1', 'num2', 'answer', 'blankPart']);

    const twoStep = isTwoStepProblem(data);
    if (twoStep) {
        validateProblemData('operations-word-problem-within-100', data, ['num3', 'operations', 'intermediate']);
        validateTwoStep(data);
    } else {
        validateProblemData('operations-word-problem-within-100', data, ['operation']);
        validatePair(data);
    }

    const values = twoStep
        ? [data.num1, data.num2, data.num3, data.intermediate, data.answer]
        : [data.num1, data.num2, data.answer];
    if (values.some(value => !Number.isInteger(value) || Math.abs(value) > 100)) {
        throw new ViewValidationError('operations-word-problem-within-100', 'This layout supports whole-number magnitudes through 100.');
    }

    const unit = config.useLengthContext ? ' cm' : '';
    const story = getWordProblemStory(data, config.useLengthContext!);
    const pairUnknown = twoStep ? 'answer' : getPairUnknown(data);

    return (
        <div className="w-[700px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">
                        {twoStep ? 'Two-step story' : 'Story problem'}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-700">
                        {isSolutionView
                            ? twoStep ? 'Check the connected equations.' : 'Check the equation.'
                            : 'Use the story to find the unknown.'}
                    </div>
                </div>
                {config.useLengthContext && (
                    <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700">centimeters</div>
                )}
            </div>

            <div className="rounded-xl border-l-4 border-sky-500 bg-slate-50 px-6 py-5 text-[1.25rem] font-semibold leading-relaxed text-slate-700">
                {story}
            </div>

            <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                {twoStep ? (
                    <>
                        <CombinedEquationRow data={data} isSolutionView={isSolutionView} unit={unit} />
                        <div className="flex items-center gap-3">
                            <div className="w-16 text-sm font-bold uppercase tracking-wide text-slate-500">Step 1</div>
                            <EquationRow
                                left={[
                                    {part: 'num1', value: data.num1},
                                    {part: 'num2', value: data.num2}
                                ]}
                                right={{part: 'intermediate', value: data.intermediate}}
                                operation={data.operations[0]}
                                hiddenParts={['intermediate']}
                                isSolutionView={isSolutionView}
                                unit={unit}
                            />
                        </div>
                        <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                            <div className="w-16 text-sm font-bold uppercase tracking-wide text-slate-500">Step 2</div>
                            <EquationRow
                                left={[
                                    {part: 'intermediate', value: data.intermediate},
                                    {part: 'num3', value: data.num3}
                                ]}
                                right={{part: 'answer', value: data.answer}}
                                operation={data.operations[1]}
                                hiddenParts={['intermediate', 'answer']}
                                isSolutionView={isSolutionView}
                                unit={unit}
                            />
                        </div>
                    </>
                ) : (
                    <EquationRow
                        left={[
                            {part: 'num1', value: data.num1},
                            {part: 'num2', value: data.num2}
                        ]}
                        right={{part: 'answer', value: data.answer}}
                        operation={data.operation}
                        hiddenParts={[pairUnknown]}
                        isSolutionView={isSolutionView}
                        unit={unit}
                    />
                )}
            </div>
        </div>
    );
};

export const OperationsWordProblemWithin100 = withConfig(
    OperationsWordProblemWithin100ViewSchema,
    OperationsWordProblemWithin100Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-word-problem-within-100'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsWordProblemWithin100 payload={payload} />);
    }
};
