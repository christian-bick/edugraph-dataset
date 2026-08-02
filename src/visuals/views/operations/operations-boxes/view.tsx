import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {getBlankPart} from './helpers.ts';
import {OperationsBoxesViewConfig, OperationsBoxesViewSchema} from './spec.ts';
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
    config: OperationsBoxesViewConfig;
    payload: ViewRenderPayload<'operations-boxes'>;
}

const OperationsBoxesCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;

    const data = problem.data;
    validateProblemData('operations-boxes', data, ['num1', 'num2', 'operation', 'answer']);
    const symbol = operatorSymbols[data.operation];
    if (!symbol) {
        throw new ViewValidationError('operations-boxes', `Unsupported operation: ${data.operation}`);
    }

    const blankPart = getBlankPart(
        payload.seed,
        config.invertProcedure || config.unknownAddendMode ? 'problem' : 'solution'
    );

    const isBlanked = (part: string) => {
        return !isSolutionView && blankPart === part;
    };

    const isSolutionHighlight = (part: string) => {
        return isSolutionView && blankPart === part;
    };

    const boxClass = (part: string) => {
        let cls = 'border-2 border-neutral-800 rounded-md py-[6px] px-3 mx-[5px] min-w-[100px] min-h-[50px] text-center font-mono flex items-center justify-center';
        if (isSolutionHighlight(part)) {
            cls += ' text-emerald-700 font-bold';
        }
        return cls;
    };

    const symbolClass = (part: string) => {
        let cls = 'text-[1.8rem] font-bold w-[50px] text-center';
        if (isSolutionHighlight(part)) {
            cls += ' text-emerald-700';
        }
        return cls;
    };

    const equation = (
        <div className="flex items-center text-[1.5rem]">
            <div className={boxClass('num1')}>
                {isBlanked('num1') ? '' : data.num1}
            </div>
            <div className={symbolClass('symbol')}>
                {isBlanked('symbol') ? '' : symbol}
            </div>
            <div className={boxClass('num2')}>
                {isBlanked('num2') ? '' : data.num2}
            </div>
            <div className="text-[1.8rem] font-bold w-[50px] text-center">=</div>
            <div className={`${boxClass('solution')} font-mono tracking-wider`}>
                {isBlanked('solution') ? '' : data.answer}
            </div>
        </div>
    );

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit">
            {config.unknownAddendMode ? (
                <div className="flex flex-col items-center">
                    <div className={`w-[430px] mb-3 py-2 rounded-xl text-center font-semibold font-sans ${
                        isSolutionView
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-indigo-50 text-indigo-700'
                    }`}>
                        {isSolutionView ? 'Missing addend found' : 'Find the missing addend'}
                    </div>
                    {equation}
                </div>
            ) : equation}
        </div>
    );
};

export const OperationsBoxes = withConfig(OperationsBoxesViewSchema, OperationsBoxesCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-boxes'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<OperationsBoxes payload={payload} />);
    }
};
