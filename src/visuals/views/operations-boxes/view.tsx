import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {getBlankPart} from './helpers.ts';
import '../../../tailwind.css';

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

interface Props {
    payload: ViewRenderPayload<'operations-boxes'>;
}

export function OperationsBoxes({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    const symbol = operatorSymbols[data.operation || (data as any).operator] || '?';

    const requestedBlank = payload.constraints.blankPart || 'solution';
    const blankPart = getBlankPart(problem.id, requestedBlank);

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

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit">
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
        </div>
    );
}

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
