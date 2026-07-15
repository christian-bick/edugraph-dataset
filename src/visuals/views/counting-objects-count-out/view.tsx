import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../types/ml-engine.ts';
import { generatePositions } from '../../helpers/counting-helpers.ts';
import '../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface Props {
    payload: ViewRenderPayload<'counting-objects-count-out'>;
}

export function CountingObjectsCountOut({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const numObjects = problem.data.numObjects;
    const totalCount = problem.data.totalCount !== undefined ? problem.data.totalCount : (numObjects + 3);
    const arrangement = problem.data.arrangement || 'line';

    const icon = useMemo(() => {
        const iconIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        return ICONS[iconIndex];
    }, [problem.id]);

    const positions = useMemo(() => {
        return generatePositions(totalCount, arrangement, problem.id);
    }, [totalCount, arrangement, problem.id]);

    const solClass = isSolutionView 
        ? 'text-green-600 border-green-600 bg-green-50' 
        : 'text-slate-500 border-slate-500 bg-white';

    const answerContent = `Colored: ${numObjects}`;

    return (
        <div className="flex justify-center items-center p-[25px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-2xl font-bold text-slate-700 mb-5 text-center font-sans">
                    Color exactly {numObjects} objects.
                </div>
                
                <div className="relative w-[450px] h-[300px] bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    {positions.map((pos, i) => {
                        const isColored = i < numObjects;
                        let imgClass = 'w-8 h-8 transition-all duration-300';
                        if (isColored && isSolutionView) {
                            imgClass += ' drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]';
                        } else {
                            imgClass += ' grayscale opacity-30';
                        }

                        return (
                            <div 
                                key={i}
                                className="absolute w-8 h-8 flex justify-center items-center"
                                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                            >
                                <img className={imgClass} src={`/icons/counting/${icon}`} alt="counting object" />
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center w-full mt-5">
                    <div className={`w-[200px] h-[55px] border-[2.5px] rounded-xl flex justify-center items-center text-[1.5rem] font-mono font-extrabold ${solClass}`}>
                        {isSolutionView ? answerContent : ''}
                    </div>
                </div>
            </div>
        </div>
    );
}

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-objects-count-out'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<CountingObjectsCountOut payload={payload} />);
    }
};
