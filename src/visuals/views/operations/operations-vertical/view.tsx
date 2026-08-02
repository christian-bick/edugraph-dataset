import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {OperationsVerticalViewConfig, OperationsVerticalViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

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

const OperationsVerticalCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-vertical', data, ['num1', 'num2', 'operation', 'answer']);
    const isTriple = data.num3 !== undefined;
    if (isTriple) {
        validateProblemData('operations-vertical', data, ['num3']);
    } else {
        validateProblemData('operations-vertical', data, ['blankPart']);
    }

    const symbol = operatorSymbols[data.operation];
    if (!symbol) {
        throw new ViewValidationError('operations-vertical', `Unsupported operation: ${data.operation}`);
    }
    const blankPart = isTriple ? 'solution' : data.blankPart;
    const operands = isTriple
        ? ([['num1', data.num1], ['num2', data.num2], ['num3', data.num3]] as const)
        : ([['num1', data.num1], ['num2', data.num2]] as const);

    const valueClass = (part: string) => isSolutionView && blankPart === part
        ? 'text-emerald-700 font-bold'
        : '';
    const showValue = (part: string) => isSolutionView || blankPart !== part;

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit">
            <div className="flex flex-col items-end text-[2rem] font-mono tracking-wider whitespace-nowrap">
                {operands.map(([part, operand], index) => (
                    <span key={part} className={`flex min-h-[2.5rem] items-center justify-end w-full ${valueClass(part)}`}>
                        {index > 0 && <span className="mr-[10px]">{symbol}</span>}
                        {showValue(part) ? operand : ''}
                    </span>
                ))}
                <div className="w-full h-[2px] bg-neutral-800 my-1" />
                <div className={`min-h-[2.5rem] flex items-center justify-end w-full ${valueClass('solution')}`}>
                    {showValue('solution') ? data.answer : ''}
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
        if (!root) root = createRoot(container);
        root.render(<OperationsVertical payload={payload} />);
    }
};
