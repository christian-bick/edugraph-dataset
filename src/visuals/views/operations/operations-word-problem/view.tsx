import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { OperationsWordProblemViewConfig, OperationsWordProblemViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData, ViewValidationError } from '../../../helpers/validation.ts';
import '../../../tailwind.css';

interface CoreProps {
    config: OperationsWordProblemViewConfig;
    payload: ViewRenderPayload<'operations-word-problem'>;
}

const operatorSymbols: Record<string, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
};

const wordProblemTemplates: Record<string, (num1: number, num2: number) => string> = {
    addition: (num1, num2) => `If you have ${num1} apples and get ${num2} more, how many apples do you have in total?`,
    subtraction: (num1, num2) => `If you have ${num1} apples and give away ${num2}, how many apples do you have left?`,
    multiplication: (num1, num2) => `If you have ${num1} groups of apples with ${num2} apples in each group, how many apples do you have in total?`,
    division: (num1, num2) => `If you share ${num1} apples equally among ${num2} friends, how many apples does each friend get?`
};

const OperationsWordProblemCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('operations-word-problem', data, ['num1', 'num2', 'operation', 'answer', 'type']);

    const operation = data.operation;
    const symbol = operatorSymbols[operation];
    if (!symbol || !wordProblemTemplates[operation]) {
        throw new ViewValidationError('operations-word-problem', `Unsupported operation: ${operation}`);
    }

    const num1 = data.num1;
    const num2 = data.num2;
    const answer = data.answer;

    const textScenario = wordProblemTemplates[operation](num1, num2);

    const boxContent1 = isSolutionView ? num1 : '';
    const boxContent2 = isSolutionView ? num2 : '';
    const boxContentAnswer = isSolutionView ? answer : '';

    const getInputClass = (isFinal = false) => {
        let cls = "w-[60px] h-[60px] border-2 border-slate-500 rounded-lg flex justify-center items-center text-[2rem] font-mono bg-white ";
        if (isSolutionView) {
            cls += "text-green-600 border-green-600 bg-green-50 font-bold ";
        } else {
            cls += "text-slate-800 ";
        }
        if (isFinal) {
            cls += "border-[3px]";
        }
        return cls;
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-xl font-bold text-slate-700 mb-5 text-center leading-relaxed bg-slate-50 p-[15px] rounded-lg border-l-4 border-sky-500 w-full box-border">
                    {textScenario}
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <div className={getInputClass()}>{boxContent1}</div>
                    <div className="text-[2rem] font-extrabold text-slate-500">{symbol}</div>
                    <div className={getInputClass()}>{boxContent2}</div>
                    <div className="text-[2rem] font-extrabold text-slate-500">=</div>
                    <div className={getInputClass(true)}>{boxContentAnswer}</div>
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
