import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { OperationsWordProblemViewConfig, OperationsWordProblemViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData, ViewValidationError } from '../../../helpers/validation.ts';
import {getAppleGroups, getUnknownPart, getWordProblemText, UnknownPart} from './helpers.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsWordProblemViewConfig;
    payload: ViewRenderPayload<'operations-word-problem'>;
}

function AppleGroup({
    label,
    value,
    hidden,
    highlighted
}: {
    label: string;
    value: number;
    hidden: boolean;
    highlighted: boolean;
}) {
    return (
        <div className={`flex h-[82px] w-[128px] flex-col items-center justify-center rounded-xl border-2 bg-white px-2 py-1 ${
            highlighted ? 'border-emerald-600 bg-emerald-50' : hidden ? 'border-dashed border-slate-400' : 'border-slate-300'
        }`}>
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Group {label}</div>
            {hidden ? (
                <div className="text-3xl font-bold text-slate-400">?</div>
            ) : (
                <div className="grid grid-cols-6 gap-[2px]" aria-label={`${value} apples`}>
                    {Array.from({length: value}, (_, index) => (
                        <span key={index} className="text-[0.9rem] leading-none">🍎</span>
                    ))}
                </div>
            )}
        </div>
    );
}

const operatorSymbols: Record<string, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
};

const OperationsWordProblemCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('operations-word-problem', data, ['num1', 'num2', 'operation', 'answer']);

    const operation = data.operation;
    const symbol = operatorSymbols[operation];
    if (!symbol) {
        throw new ViewValidationError('operations-word-problem', `Unsupported operation: ${operation}`);
    }

    const hasThirdOperand = data.num3 !== undefined;
    if (hasThirdOperand) {
        validateProblemData('operations-word-problem', data, ['num3']);
    } else {
        validateProblemData('operations-word-problem', data, ['blankPart']);
        if (!['num1', 'num2', 'solution'].includes(data.blankPart)) {
            throw new ViewValidationError(
                'operations-word-problem',
                `Unsupported binary unknown: ${data.blankPart}`
            );
        }
    }

    const num1 = data.num1;
    const num2 = data.num2;
    const num3 = data.num3;
    const answer = data.answer;
    const appleGroups = getAppleGroups(data);
    if (appleGroups.some(group =>
        !Number.isInteger(group.value) || group.value < 0 || group.value > 20
    )) {
        throw new ViewValidationError(
            'operations-word-problem',
            'Apple groups require whole-number quantities from 0 through 20.'
        );
    }
    const unknownPart = getUnknownPart(data, payload.seed);
    const textScenario = getWordProblemText(data, unknownPart);

    const getInputClass = (part: UnknownPart, isFinal = false) => {
        let cls = "w-[60px] h-[60px] border-2 border-slate-500 rounded-lg flex justify-center items-center text-[2rem] font-mono bg-white ";
        if (isSolutionView && part === unknownPart) {
            cls += "text-green-600 border-green-600 bg-green-50 font-bold ";
        } else {
            cls += "text-slate-800 ";
        }
        if (isFinal) {
            cls += "border-[3px]";
        }
        return cls;
    };

    const boxContent = (part: UnknownPart, value: number) => {
        return !isSolutionView && part === unknownPart ? '' : value;
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="flex h-[128px] w-full items-center justify-center box-border">
                    <div className="flex h-full w-full items-center justify-center rounded-lg border-l-4 border-sky-500 bg-slate-50 p-[15px] text-center text-xl font-bold leading-relaxed text-slate-700">
                        {textScenario}
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                    {appleGroups.map(({label, part, value}) => (
                        <AppleGroup
                            key={part}
                            label={label}
                            value={value}
                            hidden={!isSolutionView && part === unknownPart}
                            highlighted={isSolutionView && part === unknownPart}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <div className={getInputClass('num1')}>{boxContent('num1', num1)}</div>
                    <div className="text-[2rem] font-extrabold text-slate-500">{symbol}</div>
                    <div className={getInputClass('num2')}>{boxContent('num2', num2)}</div>
                    {num3 !== undefined && (
                        <>
                            <div className="text-[2rem] font-extrabold text-slate-500">{symbol}</div>
                            <div className={getInputClass('num3')}>{boxContent('num3', num3)}</div>
                        </>
                    )}
                    <div className="text-[2rem] font-extrabold text-slate-500">=</div>
                    <div className={getInputClass('answer', true)}>{boxContent('answer', answer)}</div>
                </div>
            </div>
        </div>
    );
};

export const OperationsWordProblem = withConfig(OperationsWordProblemViewSchema, OperationsWordProblemCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-word-problem'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<OperationsWordProblem payload={payload} />);
    }
};
