import {useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {getDecomposeLayout} from './helpers.ts';
import { OperationsDecomposeViewConfig, OperationsDecomposeViewSchema } from './spec.ts';
import { withConfig } from '../withConfig.tsx';
import { validateProblemData } from '../../helpers/validation.ts';
import '../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface CoreProps {
    config: OperationsDecomposeViewConfig;
    payload: ViewRenderPayload<'operations-decompose'>;
}

function DotsDisplay({ a, b, icon }: { a: number; b: number; icon: string }) {
    const { startX, spacing } = useMemo(() => {
        return getDecomposeLayout(a, b, 18);
    }, [a, b]);

    return (
        <div className="relative w-[200px] h-[50px] bg-white border border-slate-200 rounded-lg mb-[15px]">
            {/* Color A dots */}
            {Array.from({ length: a }).map((_, i) => {
                const x = startX + i * spacing - 7.5;
                return (
                    <div 
                        key={`a-${i}`}
                        className="absolute w-[15px] h-[15px] top-[17.5px] flex justify-center items-center"
                        style={{ left: `${x}px` }}
                    >
                        <img 
                            src={`/icons/counting/${icon}`} 
                            style={{ filter: 'drop-shadow(0 1px 2px rgba(244, 63, 94, 0.2))' }} 
                            alt="part 1 dot" 
                            className="w-[15px] h-[15px]"
                        />
                    </div>
                );
            })}
            
            {/* Color B dots */}
            {Array.from({ length: b }).map((_, i) => {
                const x = startX + (a + i) * spacing - 7.5;
                return (
                    <div 
                        key={`b-${i}`}
                        className="absolute w-[15px] h-[15px] top-[17.5px] flex justify-center items-center"
                        style={{ left: `${x}px` }}
                    >
                        <img 
                            src={`/icons/counting/${icon}`} 
                            style={{ filter: 'sepia(1) saturate(5) hue-rotate(10deg) drop-shadow(0 1px 2px rgba(234, 179, 8, 0.3))' }} 
                            alt="part 2 dot" 
                            className="w-[15px] h-[15px]"
                        />
                    </div>
                );
            })}
        </div>
    );
}

const OperationsDecomposeCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('operations-decompose', data, ['targetNumber', 'pair1', 'pair2']);

    const targetNumber = data.targetNumber;
    const pair1 = data.pair1;
    const pair2 = data.pair2;

    const icon = useMemo(() => {
        const iconIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        return ICONS[iconIndex];
    }, [problem.id]);

    const box1_p1 = isSolutionView ? pair1[0] : '';
    const box2_p1 = isSolutionView ? pair1[1] : '';
    const box1_p2 = isSolutionView ? pair2[0] : '';
    const box2_p2 = isSolutionView ? pair2[1] : '';

    const getInputClass = () => {
        return `w-[42px] h-[42px] border-2 border-slate-600 rounded-md flex justify-center items-center text-[1.3rem] font-mono font-extrabold ${
            isSolutionView ? 'text-green-600 border-green-600 bg-green-50' : 'text-slate-800 bg-white'
        }`;
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.4rem] font-bold text-slate-700 mb-[25px] text-center font-sans">
                    Decompose {targetNumber} in two different ways.
                </div>
                
                <div className="flex flex-col items-center w-full">
                    {/* Target node at top */}
                    <div className="w-[65px] h-[65px] rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex justify-center items-center text-[2rem] font-extrabold shadow-[0_4px_12px_rgba(79,70,229,0.3)] z-10 mb-5 relative">
                        {targetNumber}
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[2px] h-5 bg-slate-300 -z-10" />
                    </div>
                    
                    <div className="flex gap-[25px] w-full justify-center">
                        {/* Branch 1 */}
                        <div className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl p-[15px] flex flex-col items-center box-border shadow-sm">
                            <DotsDisplay a={pair1[0]} b={pair1[1]} icon={icon} />
                            <div className="flex items-center gap-2">
                                <span className="text-[1.3rem] font-bold text-slate-500">{targetNumber} = </span>
                                <div className={getInputClass()}>{box1_p1}</div>
                                <span className="text-[1.3rem] font-bold text-slate-500">+</span>
                                <div className={getInputClass()}>{box2_p1}</div>
                            </div>
                        </div>

                        {/* Branch 2 */}
                        <div className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl p-[15px] flex flex-col items-center box-border shadow-sm">
                            <DotsDisplay a={pair2[0]} b={pair2[1]} icon={icon} />
                            <div className="flex items-center gap-2">
                                <span className="text-[1.3rem] font-bold text-slate-500">{targetNumber} = </span>
                                <div className={getInputClass()}>{box1_p2}</div>
                                <span className="text-[1.3rem] font-bold text-slate-500">+</span>
                                <div className={getInputClass()}>{box2_p2}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const OperationsDecompose = withConfig(OperationsDecomposeViewSchema, OperationsDecomposeCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-decompose'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<OperationsDecompose payload={payload} />);
    }
};
