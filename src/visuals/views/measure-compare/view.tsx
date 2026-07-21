
import {useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {getWeightLayout} from './helpers.ts';
import {MeasureCompareViewConfig, MeasureCompareViewSchema} from './spec.ts';
import {withConfig} from '../withConfig.tsx';
import {validateProblemData} from '../../helpers/validation.ts';
import '../../../tailwind.css';

interface CoreProps {
    config: MeasureCompareViewConfig;
    payload: ViewRenderPayload<'measure-compare'>;
}

function Illustration({ attribute, val1, val2, maxVal }: { attribute: string; val1: number; val2: number; maxVal?: number }) {
    const layout = useMemo(() => {
        return getWeightLayout(val1, val2);
    }, [val1, val2]);

    if (attribute === 'weight') {
        return (
            <svg width="220" height="200" viewBox="0 0 220 200" className="overflow-visible drop-shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
                {/* Scale Base & Pillar */}
                <rect x="100" y="140" width="20" height="40" fill="#64748b" />
                <rect x="70" y="170" width="80" height="15" fill="#475569" rx="3" />
                <circle cx="110" cy="90" r="6" fill="#334155" />
                
                {/* Rotating Beam */}
                <g 
                    style={{ 
                        transformOrigin: '110px 90px', 
                        transform: `rotate(${layout.beamRotate}deg)`,
                        transition: 'transform 0.5s' 
                    }}
                >
                    <line x1="30" y1="90" x2="190" y2="90" stroke="#475569" strokeWidth="5" />
                    {/* Left Hanger */}
                    <line x1="30" y1="90" x2="30" y2={layout.leftPanY - 20} stroke="#94a3b8" strokeWidth="2" />
                    <line x1="30" y1="90" x2="15" y2={layout.leftPanY} stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="30" y1="90" x2="45" y2={layout.leftPanY} stroke="#94a3b8" strokeWidth="1.5" />
                    <path d={`M 10 ${layout.leftPanY} L 50 ${layout.leftPanY}`} stroke="#475569" strokeWidth="3" strokeLinecap="round" />
                    
                    {/* Right Hanger */}
                    <line x1="190" y1="90" x2="190" y2={layout.rightPanY - 20} stroke="#94a3b8" strokeWidth="2" />
                    <line x1="190" y1="90" x2="175" y2={layout.rightPanY} stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="190" y1="90" x2="205" y2={layout.rightPanY} stroke="#94a3b8" strokeWidth="1.5" />
                    <path d={`M 170 ${layout.rightPanY} L 210 ${layout.rightPanY}`} stroke="#475569" strokeWidth="3" strokeLinecap="round" />
                </g>

                {/* Left Object */}
                <rect x="15" y={layout.leftPanY - 25} width="30" height="25" fill="#ef4444" rx="2" />
                <text x="30" y={layout.leftPanY - 8} fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">A</text>

                {/* Right Object */}
                <circle cx="190" cy={layout.rightPanY - 15} r="15" fill="#3b82f6" />
                <text x="190" y={layout.rightPanY - 11} fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">B</text>
            </svg>
        );
    } else {
        // length
        const resolvedMax = maxVal || Math.max(val1, val2, 10);
        const scale = 250 / resolvedMax;
        const widthA = val1 * scale;
        const widthB = val2 * scale;

        return (
            <div className="flex flex-col gap-5 w-[320px] font-sans">
                <div className="flex items-center gap-[15px]">
                    <span className="text-[1.2rem] font-extrabold text-slate-500 w-5">A:</span>
                    <div 
                        className="h-6 rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-gradient-to-r from-rose-400 to-rose-600" 
                        style={{ width: `${widthA}px` }}
                    />
                </div>
                <div className="flex items-center gap-[15px]">
                    <span className="text-[1.2rem] font-extrabold text-slate-500 w-5">B:</span>
                    <div 
                        className="h-6 rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-gradient-to-r from-blue-400 to-blue-600" 
                        style={{ width: `${widthB}px` }}
                    />
                </div>
            </div>
        );
    }
}

const MeasureCompareCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    validateProblemData('measure-compare', data, ['attribute', 'relation', 'val1', 'val2', 'answer']);

    const attribute = data.attribute;
    const relation = data.relation;
    const val1 = data.val1;
    const val2 = data.val2;
    const answer = data.answer;

    const promptText = attribute === 'length' 
        ? `Which ribbon is ${relation}?` 
        : `Which item is ${relation}?`;

    const labelA = attribute === 'length' ? 'Ribbon A' : 'Item A';
    const labelB = attribute === 'length' ? 'Ribbon B' : 'Item B';

    const getBtnClass = (option: 'A' | 'B') => {
        let cls = "flex-1 py-3.5 px-2.5 border-2 rounded-lg text-center font-semibold text-[1.1rem] transition-all duration-200 cursor-pointer ";
        if (answer === option && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.4rem] font-bold text-slate-700 mb-[25px] text-center font-sans">
                    {promptText}
                </div>
                
                <div className="flex justify-center items-center w-[400px] h-[220px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px]">
                    <Illustration attribute={attribute} val1={val1} val2={val2} maxVal={data.maxVal} />
                </div>

                <div className="flex gap-3 w-full animate-fade-in">
                    <div className={getBtnClass('A')}>{labelA}</div>
                    <div className={getBtnClass('B')}>{labelB}</div>
                </div>
            </div>
        </div>
    );
};

export const MeasureCompare = withConfig(MeasureCompareViewSchema, MeasureCompareCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'measure-compare'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<MeasureCompare payload={payload} />);
    }
};
