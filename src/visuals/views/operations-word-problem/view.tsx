import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../types/ml-engine.ts';
import { OperationsWordProblemViewConfig, OperationsWordProblemViewSchema } from './spec.ts';
import { withConfig } from '../withConfig.tsx';
import '../../../tailwind.css';

interface CoreProps {
    config: OperationsWordProblemViewConfig;
    payload: ViewRenderPayload<'operations-word-problem'>;
}

const operatorSymbols: { [key: string]: string } = {
    add: '+',
    addition: '+',
    subtract: '−',
    subtraction: '−',
    multiply: '×',
    multiplication: '×',
    divide: '÷',
    division: '÷'
};

const OperationsWordProblemCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    const operation = data.operation || (data as any).operator || 'addition';
    const symbol = operatorSymbols[operation] || '+';

    const num1 = data.num1 !== undefined ? data.num1 : 5;
    const num2 = data.num2 !== undefined ? data.num2 : 3;
    const answer = data.answer !== undefined ? data.answer : (operation === 'addition' ? num1 + num2 : num1 - num2);
    const textScenario = data.textScenario || '';

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
