import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import { OperationsVerticalViewConfig, OperationsVerticalViewSchema } from './spec.ts';
import { withConfig } from '../withConfig.tsx';
import { validateProblemData } from '../../helpers/validation.ts';
import '../../../tailwind.css';

const operatorSymbols: Record<string, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
};

interface CoreProps {
    config: OperationsVerticalViewConfig;
    payload: ViewRenderPayload<'operations-vertical'>;
}

const OperationsVerticalCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('operations-vertical', data, ['num1', 'num2', 'operation', 'answer']);
    const symbol = operatorSymbols[data.operation];

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit">
            <div className="flex flex-col items-end text-[2rem] font-mono tracking-wider whitespace-nowrap">
                <span className="flex items-center justify-end w-full">{data.num1}</span>
                <span className="flex items-center justify-end w-full">
                    <span className="mr-[10px]">{symbol}</span>
                    {data.num2}
                </span>
                <div className="w-full h-[2px] bg-neutral-800 my-1"></div>
                <div className={`min-h-[2.5rem] flex items-center justify-end w-full ${isSolutionView ? 'text-emerald-700 font-bold' : ''}`}>
                    {isSolutionView ? data.answer : ''}
                </div>
            </div>
        </div>
    );
};

export const OperationsVertical = withConfig(OperationsVerticalViewSchema, OperationsVerticalCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-vertical'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<OperationsVertical payload={payload} />);
    }
};
