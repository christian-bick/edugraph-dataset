import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
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
    payload: ViewRenderPayload<'operations-vertical'>;
}

export function OperationsVertical({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    const symbol = operatorSymbols[data.operation || (data as any).operator] || '?';

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
}

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
