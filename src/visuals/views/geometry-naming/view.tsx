import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../types/ml-engine.ts';
import '../../../tailwind.css';

interface Props {
    payload: ViewRenderPayload<'geometry-naming'>;
}

function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function ShapeSVG({ shape, size = 100 }: { shape: string; size?: number }) {
    const commonProps = {
        width: size,
        height: size,
        viewBox: "0 0 100 100",
        className: "overflow-visible"
    };

    if (shape === 'circle') {
        return (
            <svg {...commonProps}>
                <circle cx="50" cy="50" r="40" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="3"/>
            </svg>
        );
    } else if (shape === 'square') {
        return (
            <svg {...commonProps}>
                <rect x="10" y="10" width="80" height="80" rx="4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="3"/>
            </svg>
        );
    } else if (shape === 'rectangle') {
        return (
            <svg {...commonProps}>
                <rect x="10" y="25" width="80" height="50" rx="4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="3"/>
            </svg>
        );
    } else if (shape === 'triangle') {
        return (
            <svg {...commonProps}>
                <polygon points="50,10 90,90 10,90" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="3"/>
            </svg>
        );
    } else if (shape === 'hexagon') {
        return (
            <svg {...commonProps}>
                <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="3"/>
            </svg>
        );
    } else if (shape === 'cube') {
        return (
            <svg {...commonProps}>
                <path d="M 20 40 L 60 40 L 60 80 L 20 80 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                <path d="M 20 40 L 40 20 L 80 20 L 60 40 Z" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2" />
                <path d="M 60 40 L 80 20 L 80 60 L 60 80 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" />
            </svg>
        );
    } else if (shape === 'cone') {
        return (
            <svg {...commonProps}>
                <ellipse cx="50" cy="75" rx="30" ry="10" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" />
                <polygon points="50,15 20,75 80,75" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                <path d="M 50 15 L 80 75 A 30 10 0 0 1 50 85 Z" fill="#1e40af" opacity="0.2"/>
            </svg>
        );
    } else if (shape === 'cylinder') {
        return (
            <svg {...commonProps}>
                <path d="M 25 25 L 25 75 A 25 8 0 0 0 75 75 L 75 25 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                <ellipse cx="50" cy="25" rx="25" ry="8" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2" />
                <ellipse cx="50" cy="75" rx="25" ry="8" fill="#2563eb" stroke="#1d4ed8" strokeDasharray="3 3" />
            </svg>
        );
    } else if (shape === 'sphere') {
        return (
            <svg {...commonProps}>
                <circle cx="50" cy="50" r="35" fill="url(#sphere-grad-viewer-react-naming)" stroke="#1d4ed8" strokeWidth="2" />
                <defs>
                    <radialGradient id="sphere-grad-viewer-react-naming" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#93c5fd" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                    </radialGradient>
                </defs>
            </svg>
        );
    }
    return null;
}

export function GeometryNaming({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    const shape = data.shape || 'triangle';
    const answer = data.answer;

    const is3D = ['cube', 'cone', 'cylinder', 'sphere'].includes(shape);
    const options = is3D 
        ? ['cube', 'cone', 'cylinder', 'sphere']
        : ['square', 'circle', 'triangle', 'rectangle', 'hexagon'];

    const hash = hashCode(problem.id);
    const rotation = hash % 360;
    const scale = parseFloat(((hash % 11) / 10 + 0.5).toFixed(1));

    const promptText = "What shape is this?";

    const getBtnClass = (opt: string) => {
        let cls = "flex-1 min-w-[120px] py-3 px-2.5 border-2 rounded-lg text-center font-semibold text-[1rem] transition-all duration-200 cursor-pointer ";
        if (opt === answer && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
    };

    const getLabelText = (opt: string) => {
        return opt.charAt(0).toUpperCase() + opt.slice(1);
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center leading-normal">
                    {promptText}
                </div>
                
                <div className="flex justify-center items-center w-[420px] h-[220px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] p-[15px] box-border">
                    <div 
                        style={{ transform: `rotate(${rotation}deg) scale(${scale})`, transformOrigin: 'center' }} 
                        className="flex justify-center items-center w-[120px] h-[120px]"
                    >
                        <ShapeSVG shape={shape} size={100} />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full justify-center">
                    {options.map((opt, i) => (
                        <div key={i} className={getBtnClass(opt)}>
                            {getLabelText(opt)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-naming'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<GeometryNaming payload={payload} />);
    }
};
