import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { RenderPayload } from '../../types/ml-engine.ts';
import { GeometryProblem } from '../../types/problems.ts';
import { getBallPosition, getTracePath } from './helpers.ts';
import '../../tailwind.css';

interface Props {
    payload: RenderPayload;
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
                <circle cx="50" cy="50" r="35" fill="url(#sphere-grad-viewer-react)" stroke="#1d4ed8" strokeWidth="2" />
                <defs>
                    <radialGradient id="sphere-grad-viewer-react" cx="30%" cy="30%" r="70%">
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

export function GeometryViewer({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data as GeometryProblem;

    const mode = data.mode || 'name-2d';
    const answer = data.answer;

    // 1. Compute prompt and illustration
    const promptText = useMemo(() => {
        if (mode === 'position') return "Where is the ball relative to the box?";
        if (mode === 'env-shapes') return `What shape is the ${data.target}?`;
        if (mode === 'name-2d' || mode === 'name-3d') return "What shape is this?";
        if (mode === 'classify-dim') return "Is this shape flat (two-dimensional) or solid (three-dimensional)?";
        if (mode === 'compare-attributes') return `Which shape has more ${data.attribute}?`;
        if (mode === 'same-attribute') {
            const promptMap: Record<string, string> = {
                'can-roll': 'Which of these shapes rolls easily?',
                'can-stack': 'Which of these shapes is best for stacking?',
                'flat-faces': 'Which of these shapes has NO flat faces?'
            };
            return promptMap[data.attribute || ''] || 'Choose the correct shape.';
        }
        if (mode === 'build-shape') return `To build a ${data.target}, how many sticks (sides) and clay balls (corners) do you need?`;
        if (mode === 'draw-shape') return `Trace the ${data.target}.`;
        if (mode === 'compose-shapes') return `Which two shapes can you join to make a ${data.target}?`;
        return 'Choose the correct answer.';
    }, [mode, data.target, data.attribute]);

    // 2. Render Workspace
    const renderWorkspace = () => {
        if (mode === 'position') {
            const pos = getBallPosition(data.relation || 'above');
            return (
                <svg width="300" height="180" className="overflow-visible">
                    {/* Box */}
                    <rect x="100" y="80" width="60" height="60" fill="#e2e8f0" stroke="#475569" strokeWidth="2" rx="4"/>
                    <text x="130" y="115" fill="#475569" fontWeight="bold" fontSize="14" textAnchor="middle">Box</text>
                    {/* Ball */}
                    <circle cx={pos.x} cy={pos.y} r="20" fill="#f43f5e" stroke="#be123c" strokeWidth="2" />
                    <text x={pos.x} y={pos.y + 4} fill="#ffffff" fontWeight="bold" fontSize="12" textAnchor="middle">Ball</text>
                </svg>
            );
        }

        if (mode === 'env-shapes') {
            return (
                <div className="relative w-[320px] h-[180px] bg-sky-100 border-[2.5px] border-sky-600 rounded-lg overflow-hidden">
                    {/* Table */}
                    <div className="absolute bottom-0 left-[60px] width-[200px] height-[50px] bg-[#8b5a2b] border-2 border-[#5c3a21] rounded" style={{ width: '200px', height: '50px' }}></div>
                    <div className="absolute bottom-0 left-[75px] w-3 h-[35px] bg-[#5c3a21]"></div>
                    <div className="absolute bottom-0 right-[75px] w-3 h-[35px] bg-[#5c3a21]"></div>
                    {/* Window */}
                    <div className="absolute top-[15px] left-[30px] w-[50px] h-[50px] bg-white border-3 border-slate-500 grid grid-cols-2 grid-rows-2 gap-[2px]">
                        <div className="bg-sky-200"></div><div className="bg-sky-200"></div>
                        <div className="bg-sky-200"></div><div className="bg-sky-200"></div>
                    </div>
                    {/* Clock */}
                    <div className="absolute top-[20px] right-[40px] w-[45px] h-[45px] rounded-full bg-white border-[3.5px] border-red-500 flex justify-center items-center font-bold text-[8px] text-slate-700">12</div>
                </div>
            );
        }

        if (mode === 'name-2d' || mode === 'name-3d') {
            const shape = data.shape || 'triangle';
            const rotation = data.rotation || 0;
            const scale = data.scale || 1.0;
            return (
                <div 
                    style={{ transform: `rotate(${rotation}deg) scale(${scale})`, transformOrigin: 'center' }} 
                    className="flex justify-center items-center w-[120px] h-[120px]"
                >
                    <ShapeSVG shape={shape} size={100} />
                </div>
            );
        }

        if (mode === 'classify-dim') {
            const shape = data.shape || 'circle';
            return (
                <div className="flex justify-center items-center w-[120px] h-[120px]">
                    <ShapeSVG shape={shape} size={100} />
                </div>
            );
        }

        if (mode === 'compare-attributes') {
            const shape1 = data.shape1 || 'rectangle';
            const shape2 = data.shape2 || 'triangle';
            return (
                <div className="flex gap-10 items-center justify-center w-full">
                    <div className="flex flex-col items-center gap-2.5">
                        <ShapeSVG shape={shape1} size={80} />
                        <span className="font-bold text-slate-500 uppercase">{shape1}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2.5">
                        <ShapeSVG shape={shape2} size={80} />
                        <span className="font-bold text-slate-500 uppercase">{shape2}</span>
                    </div>
                </div>
            );
        }

        if (mode === 'same-attribute') {
            return (
                <div className="flex gap-[30px] justify-center items-center w-full">
                    <div className="flex flex-col items-center gap-1.5">
                        <ShapeSVG shape="sphere" size={70} />
                        <span className="font-bold text-slate-500">Sphere</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <ShapeSVG shape="cube" size={70} />
                        <span className="font-bold text-slate-500">Cube</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <ShapeSVG shape="cone" size={70} />
                        <span className="font-bold text-slate-500">Cone</span>
                    </div>
                </div>
            );
        }

        if (mode === 'build-shape') {
            const target = data.target || 'triangle';
            return (
                <div className="flex gap-5 items-center justify-center w-full">
                    <div className="p-2.5 bg-white border border-dashed border-slate-300 rounded-lg flex flex-col gap-2">
                        <div className="flex gap-1.5 items-center font-bold text-slate-500">
                            <span className="inline-block w-[30px] h-1 bg-slate-500" /> Stick (Side)
                        </div>
                        <div className="flex gap-1.5 items-center font-bold text-slate-500">
                            <span className="inline-block w-3.5 h-3.5 rounded-full bg-rose-600" /> Clay Ball (Corner)
                        </div>
                    </div>
                    <ShapeSVG shape={target} size={80} />
                </div>
            );
        }

        if (mode === 'draw-shape') {
            const target = data.target || 'circle';
            const pathD = getTracePath(target);
            return (
                <svg width="150" height="150" viewBox="0 0 100 100" className="overflow-visible">
                    {/* Dotted outline */}
                    <path d={pathD} fill="none" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="4 4" />
                    {/* Solid trace path in solution view */}
                    {isSolutionView && (
                        <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                </svg>
            );
        }

        if (mode === 'compose-shapes') {
            const target = data.target || 'rectangle';
            return (
                <div className="flex gap-[30px] items-center justify-center w-full">
                    <div className="relative w-[100px] h-[70px] border-2 border-dashed border-slate-500 rounded flex justify-center items-center font-bold text-slate-500">
                        Target: {target.toUpperCase()}
                        {isSolutionView && target === 'rectangle' && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <line x1="0" y1="0" x2="100" y2="70" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="3 3" />
                            </svg>
                        )}
                    </div>
                </div>
            );
        }

        return null;
    };

    // 3. Render Choices / Buttons
    const getOptions = () => {
        if (mode === 'position') return ['above', 'below', 'nextTo'];
        if (mode === 'env-shapes') return ['circle', 'square', 'rectangle'];
        if (mode === 'name-2d') return ['square', 'circle', 'triangle', 'rectangle', 'hexagon'];
        if (mode === 'name-3d') return ['cube', 'cone', 'cylinder', 'sphere'];
        if (mode === 'classify-dim') return ['Flat (2D)', 'Solid (3D)'];
        if (mode === 'compare-attributes') return [data.shape1 || '', data.shape2 || ''];
        if (mode === 'same-attribute') return ['sphere', 'cube', 'cone'];
        if (mode === 'build-shape') return ['3 sticks, 3 balls', '4 sticks, 4 balls'];
        if (mode === 'compose-shapes') return ['Two triangles', 'Two circles'];
        return [];
    };

    const options = getOptions();

    const getBtnClass = (opt: string) => {
        let cls = "flex-1 min-w-[120px] py-3 px-2.5 border-2 rounded-lg text-center font-semibold text-[1rem] transition-all duration-200 cursor-pointer ";
        const isCorrect = opt === answer;
        if (isCorrect && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
    };

    const getLabelText = (opt: string) => {
        if (mode === 'position' && opt === 'nextTo') return 'Next to the box';
        if (mode === 'position') return opt.charAt(0).toUpperCase() + opt.slice(1) + ' the box';
        return opt.charAt(0).toUpperCase() + opt.slice(1);
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center font-sans leading-normal">
                    {promptText}
                </div>
                
                <div className="flex justify-center items-center w-[420px] h-[220px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] p-[15px] box-border">
                    {renderWorkspace()}
                </div>

                {options.length > 0 && (
                    <div className="flex flex-wrap gap-3 w-full justify-center">
                        {options.map((opt, i) => (
                            <div key={i} className={getBtnClass(opt)}>
                                {getLabelText(opt)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: RenderPayload) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<GeometryViewer payload={payload} />);
    }
};
