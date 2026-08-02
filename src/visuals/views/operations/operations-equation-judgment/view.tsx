import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsEquationJudgmentViewConfig, OperationsEquationJudgmentViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsEquationJudgmentViewConfig;
    payload: ViewRenderPayload<'operations-equation-judgment'>;
}

const OperationsEquationJudgmentCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-equation-judgment', data, ['num1', 'num2', 'operation', 'claimedAnswer', 'isTrue']);
    if (!['addition', 'subtraction'].includes(data.operation) || typeof data.isTrue !== 'boolean') {
        throw new ViewValidationError('operations-equation-judgment', 'Unsupported equation judgment payload.');
    }

    const symbol = data.operation === 'addition' ? '+' : '−';
    const choiceClass = (value: boolean) => {
        const base = 'w-[130px] h-[58px] border-2 rounded-xl flex items-center justify-center text-xl font-bold';
        return isSolutionView && data.isTrue === value
            ? `${base} text-emerald-700 border-emerald-700 bg-emerald-50`
            : `${base} text-slate-600 border-slate-400 bg-white`;
    };

    return (
        <div className="flex justify-center items-center p-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[500px]">
                {!isSolutionView && (
                    <div className="text-[1.35rem] font-bold text-slate-700 mb-6 text-center font-sans">
                        Is this equation true or false?
                    </div>
                )}
                <div className="px-8 py-6 bg-slate-50 border-2 border-slate-200 rounded-xl text-[2.4rem] font-mono font-bold text-slate-800">
                    {data.num1} {symbol} {data.num2} = {data.claimedAnswer}
                </div>
                <div className="flex gap-5 mt-7">
                    <div className={choiceClass(true)}>True</div>
                    <div className={choiceClass(false)}>False</div>
                </div>
            </div>
        </div>
    );
};

export const OperationsEquationJudgment = withConfig(OperationsEquationJudgmentViewSchema, OperationsEquationJudgmentCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-equation-judgment'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsEquationJudgment payload={payload} />);
    }
};
