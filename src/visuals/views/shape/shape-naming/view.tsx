import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeNamingViewConfig, ShapeNamingViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {deriveShapeNamingAppearances} from './helpers.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeNamingViewConfig;
    payload: ViewRenderPayload<'shape-naming'>;
}

function ShapeSVG({ shape, size }: { shape: string; size: number }) {
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
    } else if (shape === 'rhombus') {
        return (
            <svg {...commonProps}>
                <polygon points="50,8 92,50 50,92 8,50" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="3"/>
            </svg>
        );
    } else if (shape === 'rectangle') {
        return (
            <svg {...commonProps}>
                <rect x="10" y="25" width="80" height="50" rx="4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="3"/>
            </svg>
        );
    } else if (shape === 'quadrilateral') {
        return (
            <svg {...commonProps}>
                <polygon points="18,20 84,12 72,86 10,70" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="3"/>
            </svg>
        );
    } else if (shape === 'pentagon') {
        return (
            <svg {...commonProps}>
                <polygon points="50,8 90,38 75,88 25,88 10,38" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="3"/>
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
    throw new ViewValidationError('shape-naming', `Unsupported shape: ${shape}`);
}

export const ShapeNamingCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    validateProblemData('shape-naming', data, ['shape']);

    const shape = data.shape;
    const answer = shape;

    const supportedShapes = [
        'circle', 'square', 'rhombus', 'rectangle', 'quadrilateral', 'pentagon',
        'triangle', 'hexagon', 'cube', 'cone', 'cylinder', 'sphere'
    ];
    if (!supportedShapes.includes(shape)) {
        throw new ViewValidationError('shape-naming', 'The shape must be a supported geometric kind.');
    }
    if (data.attributes !== undefined
        && (!Array.isArray(data.attributes) || data.attributes.some(attribute => typeof attribute !== 'string' || attribute.length === 0))) {
        throw new ViewValidationError('shape-naming', 'Shape attributes must be non-empty text statements.');
    }

    const is3D = ['cube', 'cone', 'cylinder', 'sphere'].includes(shape);
    const options = is3D
        ? ['cube', 'cone', 'cylinder', 'sphere']
        : ['quadrilateral', 'pentagon'].includes(shape)
            ? ['triangle', 'quadrilateral', 'pentagon', 'hexagon']
            : ['square', 'circle', 'triangle', 'rectangle', 'hexagon'];

    const appearances = deriveShapeNamingAppearances(payload.seed, is3D, {
        varyOrientation: config.varyOrientation === true,
        varySize: config.varySize === true
    });
    const visibleAppearances = config.varyOrientation === true || config.varySize === true
        ? appearances
        : appearances.slice(0, 1);

    const promptText = "What shape are these?";

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
                    <div className="flex items-center justify-center gap-5">
                        {visibleAppearances.map((appearance, index) => (
                            <div key={`${appearance.size}-${appearance.rotation}-${index}`} className="contents">
                                {index > 0 && (
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">same shape</span>
                                )}
                                <div
                                    data-shape-size={appearance.size}
                                    data-shape-rotation={appearance.rotation}
                                    style={{transform: `rotate(${appearance.rotation}deg)`, transformOrigin: 'center'}}
                                    className="flex h-[145px] w-[145px] items-center justify-center"
                                >
                                    <ShapeSVG shape={shape} size={appearance.size} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {data.attributes && (
                    <div className="mb-5 flex flex-wrap justify-center gap-2 text-sm font-bold text-blue-700">
                        {data.attributes.map(attribute => (
                            <span key={attribute} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
                                {attribute}
                            </span>
                        ))}
                    </div>
                )}

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

export const ShapeNaming = withConfig(ShapeNamingViewSchema, ShapeNamingCore);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'shape-naming'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) {
                root = createRoot(container);
            }
            root.render(<ShapeNaming payload={payload} />);
        }
    };
}
