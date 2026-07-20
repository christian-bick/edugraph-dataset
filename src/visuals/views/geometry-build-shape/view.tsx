import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {GeometryBuildShapeViewConfig, GeometryBuildShapeViewSchema} from './spec.ts';
import {withConfig} from '../withConfig.tsx';
import {validateProblemData} from '../../helpers/validation.ts';
import '../../../tailwind.css';

function ShapeSVG({ shape, size = 100 }: { shape: string; size?: number }) {
    const commonProps = {
        width: size,
        height: size,
        viewBox: "0 0 100 100",
        className: "overflow-visible"
    };

    if (shape === 'square') {
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
    return null;
}

interface CoreProps {
    config: GeometryBuildShapeViewConfig;
    payload: ViewRenderPayload<'geometry-build-shape'>;
}

const GeometryBuildShapeCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    validateProblemData('geometry-build-shape', problem.data, ['target', 'sides', 'corners']);
    const { target, sides, corners } = problem.data;

    const promptText = `To build a ${target}, how many sticks (sides) and clay balls (corners) do you need?`;
    const options = ['3 sticks, 3 balls', '4 sticks, 4 balls', '6 sticks, 6 balls'];

    const getBtnClass = (opt: string) => {
        let cls = "flex-1 min-w-[120px] py-3 px-2.5 border-2 rounded-lg text-center font-semibold text-[1rem] transition-all duration-200 cursor-pointer ";
        const isCorrect = opt === `${sides} sticks, ${corners} balls`;
        if (isCorrect && isSolutionView) {
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

export const GeometryBuildShape = withConfig(GeometryBuildShapeViewSchema, GeometryBuildShapeCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-build-shape'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<GeometryBuildShape payload={payload} />);
    }
};
