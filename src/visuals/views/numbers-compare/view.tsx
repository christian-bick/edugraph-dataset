import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../types/ml-engine.ts';
import { getComparisonSymbol } from './helpers.ts';
import '../../../tailwind.css';

interface Props {
    payload: ViewRenderPayload<'numbers-compare'>;
}

export function NumbersCompare({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    const displayAnswer = useMemo(() => {
        return getComparisonSymbol(data.answer);
    }, [data.answer]);

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit">
            <div className="flex items-center gap-5 text-[2rem] font-mono">
                <span className="min-w-[60px] text-center">{data.num1}</span>
                <span className={`border-2 border-neutral-800 rounded w-[50px] h-[50px] flex justify-center items-center text-emerald-700 font-bold ${
                    isSolutionView ? 'bg-emerald-50' : 'bg-white'
                }`}>
                    {isSolutionView ? displayAnswer : ''}
                </span>
                <span className="min-w-[60px] text-center">{data.num2}</span>
            </div>
        </div>
    );
}

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-compare'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<NumbersCompare payload={payload} />);
    }
};
