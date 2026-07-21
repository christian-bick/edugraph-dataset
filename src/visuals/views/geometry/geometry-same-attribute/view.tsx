import { createRoot } from 'react-dom/client';
import { useMemo } from 'react';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { GeometrySameAttributeViewConfig, GeometrySameAttributeViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData, ViewValidationError } from '../../../helpers/validation.ts';
import '../../../tailwind.css';

interface CoreProps {
    config: GeometrySameAttributeViewConfig;
    payload: ViewRenderPayload<'geometry-same-attribute'>;
}

function ShapeSVG({ shape, size = 100 }: { shape: string; size?: number }) {
    const commonProps = {
        width: size,
        height: size,
        viewBox: "0 0 100 100",
        className: "overflow-visible"
    };

    if (shape === 'cube') {
        return (
            <svg {...commonProps}>
                <path d="M 20 40 L 60 40 L 60 80 L 20 80 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                <path d="M 20 40 L 40 20 L 80 20 L 60 40 Z" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2" />
                <path d="M 60 40 L 80 20 L 80 60 L 60 80 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" />
            </svg>
        );
    } else if (shape === 'sphere') {
        return (
            <svg {...commonProps}>
                <circle cx="50" cy="50" r="35" fill="url(#sphere-grad-viewer-react-same)" stroke="#1d4ed8" strokeWidth="2" />
                <defs>
                    <radialGradient id="sphere-grad-viewer-react-same" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#93c5fd" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                    </radialGradient>
                </defs>
            </svg>
        );
    } else if (shape === 'rectangle') {
        return (
            <svg {...commonProps}>
                <rect x="15" y="30" width="70" height="40" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" rx="4"/>
            </svg>
        );
    }
    throw new ViewValidationError('geometry-same-attribute', `Unsupported shape: ${shape}`);
}

const GeometrySameAttributeCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('geometry-same-attribute', data, ['attribute', 'answer']);

    const attribute = data.attribute;
    const answer = data.answer;

    const promptText = useMemo(() => {
        const promptMap: Record<string, string> = {
            'rollable': 'Which of these shapes rolls easily?',
            'stackable': 'Which of these shapes is best for stacking?',
            'foldable': 'Which of these shapes can be folded?'
        };
        const text = promptMap[attribute];
        if (!text) {
            throw new ViewValidationError('geometry-same-attribute', `Unsupported attribute: ${attribute}`);
        }
        return text;
    }, [attribute]);

    const options = ['sphere', 'cube', 'rectangle'];

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
                            <ShapeSVG shape="rectangle" size={70} />
                            <span className="font-bold text-slate-500">Rectangle</span>
                        </div>
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
};

export const GeometrySameAttribute = withConfig(GeometrySameAttributeViewSchema, GeometrySameAttributeCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-same-attribute'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<GeometrySameAttribute payload={payload} />);
    }
};
