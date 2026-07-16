import {Scope} from 'edugraph-ts';
import {useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {sortNumbers} from './helpers.ts';
import '../../../tailwind.css';

interface Props {
    payload: ViewRenderPayload<'numbers-order'>;
}

export function NumbersOrder({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    const isDesc = payload.labels.includes(Scope.Most);

    const sortedNumbers = useMemo(() => {
        return sortNumbers(data.numbers, isDesc);
    }, [data.numbers, isDesc]);

    const arrowSymbol = isDesc ? '↘' : '↗';

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit">
            <div className="flex flex-row items-center gap-[15px]">
                <div className="flex gap-2.5 p-2.5 border-2 border-slate-200 rounded-xl bg-slate-50">
                    {data.numbers.map((n, i) => (
                        <div key={i} className="w-[50px] h-[50px] flex justify-center items-center text-[1.5rem] font-bold text-slate-800">
                            {n}
                        </div>
                    ))}
                </div>
                
                <div className="text-3xl text-slate-500 font-bold mx-[15px]">
                    {arrowSymbol}
                </div>
                
                <div className="flex gap-2.5">
                    {sortedNumbers.map((n, i) => {
                        let cls = 'border-2 border-slate-800 rounded w-[50px] h-[50px] flex justify-center items-center text-[1.5rem] font-mono bg-white';
                        if (isSolutionView) {
                            cls += ' text-emerald-700 border-emerald-600 bg-emerald-50 font-bold';
                        }
                        return (
                            <div key={i} className={cls}>
                                {isSolutionView ? n : ''}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-order'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<NumbersOrder payload={payload} />);
    }
};
