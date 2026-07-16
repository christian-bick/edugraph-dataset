import { Scope, Ability } from 'edugraph-ts';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../types/ml-engine.ts';
import { generatePositions } from '../../helpers/counting-helpers.ts';
import '../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface Props {
    payload: ViewRenderPayload<'counting-objects-one-to-one'>;
}

export function CountingObjectsOneToOne({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const { numObjects } = problem.data;
    let arrangement: 'line' | 'circle' | 'scattered' | 'array' = 'scattered';
    if (payload.labels.includes(Scope.LinearArrangement)) arrangement = 'line';
    else if (payload.labels.includes(Scope.CircularArrangement)) arrangement = 'circle';
    else if (payload.labels.includes(Scope.ScatteredArrangement)) arrangement = 'scattered';

    const icon = useMemo(() => {
        const iconIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        return ICONS[iconIndex];
    }, [problem.id]);

    const positions = useMemo(() => {
        return generatePositions(numObjects, arrangement, problem.id);
    }, [numObjects, arrangement, problem.id]);

    const solClass = isSolutionView 
        ? 'text-green-600 border-green-600 bg-green-50' 
        : 'text-slate-500 border-slate-500 bg-white';

    return (
        <div className="flex justify-center items-center p-[25px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-2xl font-bold text-slate-700 mb-5 text-center font-sans">
                    Count the objects and write the numbers in order.
                </div>
                
                <div className="relative w-[450px] h-[300px] bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    {positions.map((pos, i) => (
                        <div 
                            key={i}
                            className="absolute w-8 h-8 flex justify-center items-center"
                            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                        >
                            <img className="w-8 h-8 transition-all duration-300" src={`/icons/counting/${icon}`} alt="counting object" />
                            <div className={`absolute -bottom-[10px] bg-white border-[1.5px] rounded-full w-5 h-5 text-[0.8rem] font-bold flex justify-center items-center shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${
                                isSolutionView ? 'bg-green-100 border-green-600 text-green-700' : 'border-slate-400 text-slate-400'
                            }`}>
                                {isSolutionView ? `${i + 1}` : ''}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center w-full mt-5">
                    <div className={`w-[150px] h-[55px] border-[2.5px] rounded-xl flex justify-center items-center text-[1.8rem] font-mono font-extrabold ${solClass}`}>
                        {isSolutionView ? numObjects : ''}
                    </div>
                </div>
            </div>
        </div>
    );
}

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-objects-one-to-one'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<CountingObjectsOneToOne payload={payload} />);
    }
};
