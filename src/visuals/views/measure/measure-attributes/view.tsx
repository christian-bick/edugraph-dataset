import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MeasureAttributesViewConfig, MeasureAttributesViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData} from '../../../helpers/validation.ts';
import '../../../tailwind.css';

interface CoreProps {
    config: MeasureAttributesViewConfig;
    payload: ViewRenderPayload<'measure-attributes'>;
}

function Illustration({ attribute }: { attribute: string }) {
    if (attribute === 'height') {
        return (
            <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible drop-shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
                {/* Tree Trunk */}
                <rect x="92" y="120" width="16" height="60" fill="#8b5a2b" rx="2" />
                {/* Tree Canopy */}
                <circle cx="100" cy="90" r="45" fill="#22c55e" />
                <circle cx="75" cy="110" r="35" fill="#16a34a" />
                <circle cx="125" cy="110" r="35" fill="#16a34a" />
                {/* Ground */}
                <line x1="20" y1="180" x2="180" y2="180" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
                
                {/* Height Dimension Line */}
                <line x1="160" y1="45" x2="160" y2="180" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="4 4" />
                {/* Arrows */}
                <path d="M 155 55 L 160 45 L 165 55" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
                <path d="M 155 170 L 160 180 L 165 170" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
                <text x="175" y="115" fill="#3b82f6" fontSize="14" fontWeight="bold">?</text>
            </svg>
        );
    } else if (attribute === 'weight') {
        return (
            <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible drop-shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
                {/* Base */}
                <rect x="40" y="160" width="120" height="20" fill="#64748b" rx="4" />
                {/* Scale Body */}
                <circle cx="100" cy="115" r="45" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
                {/* Dial Face */}
                <circle cx="100" cy="115" r="35" fill="#ffffff" />
                {/* Dial ticks */}
                <line x1="100" y1="80" x2="100" y2="85" stroke="#334155" strokeWidth="2" />
                <line x1="135" y1="115" x2="130" y2="115" stroke="#334155" strokeWidth="2" />
                <line x1="65" y1="115" x2="70" y2="115" stroke="#334155" strokeWidth="2" />
                {/* Dial Pointer */}
                <line x1="100" y1="115" x2="120" y2="95" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="115" r="4" fill="#334155" />
                {/* Top Tray */}
                <path d="M 60 70 L 140 70 L 120 80 L 80 80 Z" fill="#475569" />
                <line x1="100" y1="80" x2="100" y2="70" stroke="#475569" strokeWidth="6" />
                {/* Box on tray */}
                <rect x="75" y="30" width="50" height="40" fill="#ea580c" rx="3" />
                <line x1="75" y1="50" x2="125" y2="50" stroke="#c2410c" strokeWidth="2" />
                <line x1="100" y1="30" x2="100" y2="70" stroke="#c2410c" strokeWidth="2" />
            </svg>
        );
    } else {
        // length
        return (
            <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible drop-shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
                {/* Pencil Lead */}
                <polygon points="20,100 40,88 40,112" fill="#e2e8f0" />
                <polygon points="20,100 27,96 27,104" fill="#1e293b" />
                {/* Pencil Body */}
                <rect x="40" y="88" width="110" height="24" fill="#eab308" />
                <rect x="40" y="88" width="110" height="8" fill="#ca8a04" />
                {/* Eraser holder */}
                <rect x="150" y="88" width="15" height="24" fill="#94a3b8" />
                {/* Eraser */}
                <path d="M 165 88 L 173 88 A 12 12 0 0 1 173 112 L 165 112 Z" fill="#fda4af" />
                
                {/* Length Dimension Line */}
                <line x1="20" y1="140" x2="175" y2="140" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="4 4" />
                {/* Arrows */}
                <path d="M 30 135 L 20 140 L 30 145" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
                <path d="M 165 135 L 175 140 L 165 145" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
                <text x="95" y="165" fill="#3b82f6" fontSize="14" fontWeight="bold" textAnchor="middle">?</text>
            </svg>
        );
    }
}

const MeasureAttributesCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    validateProblemData('measure-attributes', data, ['attribute']);

    const attribute = data.attribute;

    const promptText = "What are we measuring with this setup?";

    const getBtnClass = (option: string) => {
        let cls = "flex-1 py-3 px-2 border-2 rounded-lg text-center font-semibold text-[1.1rem] transition-all duration-200 cursor-pointer ";
        if (attribute === option && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                {!isSolutionView && (
                    <div className="text-[1.4rem] font-bold text-slate-700 mb-[25px] text-center font-sans">
                        {promptText}
                    </div>
                )}
                
                <div className="flex justify-center items-center w-[400px] h-[220px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px]">
                    <Illustration attribute={attribute} />
                </div>

                <div className="flex gap-3 w-full">
                    <div className={getBtnClass('length')}>Length</div>
                    <div className={getBtnClass('height')}>Height</div>
                    <div className={getBtnClass('weight')}>Weight</div>
                </div>
            </div>
        </div>
    );
};

export const MeasureAttributes = withConfig(MeasureAttributesViewSchema, MeasureAttributesCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'measure-attributes'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<MeasureAttributes payload={payload} />);
    }
};
