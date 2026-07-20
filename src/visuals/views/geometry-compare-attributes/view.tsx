import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../types/ml-engine.ts';
import '../../../tailwind.css';
import { GeometryCompareAttributesViewConfig, GeometryCompareAttributesViewSchema } from './spec.ts';
import { withConfig } from '../withConfig.tsx';
import { validateProblemData, ViewValidationError } from '../../helpers/validation.ts';

interface CoreProps {
    config: GeometryCompareAttributesViewConfig;
    payload: ViewRenderPayload<'geometry-compare-attributes'>;
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
    }
    throw new ViewValidationError('geometry-compare-attributes', `Unsupported shape: ${shape}`);
}

const GeometryCompareAttributesCore = ({ payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('geometry-compare-attributes', data, ['attribute', 'shape1', 'shape2', 'val1', 'val2', 'answer']);

    const attribute = data.attribute;
    const shape1 = data.shape1;
    const shape2 = data.shape2;
    const answer = data.answer;

    const promptText = `Which shape has more ${attribute}?`;
    const options = [shape1, shape2];

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

export const GeometryCompareAttributes = withConfig(GeometryCompareAttributesViewSchema, GeometryCompareAttributesCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-compare-attributes'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<GeometryCompareAttributes payload={payload} />);
    }
};
