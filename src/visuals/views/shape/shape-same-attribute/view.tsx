import { createRoot } from 'react-dom/client';
import { useMemo } from 'react';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { ShapeSameAttributeViewConfig, ShapeSameAttributeViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData, ViewValidationError } from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeSameAttributeViewConfig;
    payload: ViewRenderPayload<'shape-same-attribute'>;
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
    } else if (shape === 'rectangular-prism') {
        return (
            <svg {...commonProps}>
                <path d="M 14 38 L 64 38 L 64 76 L 14 76 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                <path d="M 14 38 L 34 22 L 84 22 L 64 38 Z" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2" />
                <path d="M 64 38 L 84 22 L 84 60 L 64 76 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" />
            </svg>
        );
    } else if (shape === 'cone') {
        return (
            <svg {...commonProps}>
                <path d="M 50 15 L 18 76 Q 50 92 82 76 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                <ellipse cx="50" cy="76" rx="32" ry="10" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2" />
            </svg>
        );
    }
    throw new ViewValidationError('shape-same-attribute', `Unsupported shape: ${shape}`);
}

const ShapeSameAttributeCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('shape-same-attribute', data, ['attribute', 'answer']);

    const attribute = data.attribute;
    const answer = data.answer;

    const action = useMemo(() => {
        const actionMap: Record<string, string> = {
            'rollable': 'roll',
            'stackable': 'stack',
            'foldable': 'fold'
        };
        const resolvedAction = actionMap[attribute];
        if (!resolvedAction) {
            throw new ViewValidationError('shape-same-attribute', `Unsupported attribute: ${attribute}`);
        }
        return resolvedAction;
    }, [attribute]);

    const options = attribute === 'rollable'
        ? ['sphere', 'cube', 'rectangular-prism']
        : attribute === 'stackable'
            ? ['sphere', 'cube', 'cone']
            : ['sphere', 'cube', 'rectangle'];
    const otherOptions = options.filter(option => option !== answer);
    const labelText = (shape: string) => {
        if (shape === 'rectangular-prism') return 'Rectangular prism';
        if (shape === 'rectangle') return 'Rectangular sheet';
        return shape.charAt(0).toUpperCase() + shape.slice(1);
    };
    const shapeCard = (shape: string, solved = false) => (
        <div
            key={shape}
            className={`flex min-w-[84px] flex-col items-center rounded-xl border-2 px-2 py-2 ${
                solved ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'
            }`}
        >
            <ShapeSVG shape={shape} size={52} />
            <span className={`text-sm font-bold ${solved ? 'text-emerald-700' : 'text-slate-600'}`}>
                {labelText(shape)}
            </span>
        </div>
    );

    return (
        <div className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-white p-[30px] font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center leading-normal">
                    Sort the shapes by whether they can {action}.
                </div>
                
                {!isSolutionView ? (
                    <div className="flex w-[460px] flex-col items-center gap-3">
                        <div className="flex w-full items-center justify-center gap-4 rounded-xl border-2 border-slate-200 bg-slate-50 p-3">
                            {options.map(option => shapeCard(option))}
                        </div>
                        <div className="flex w-full gap-3">
                            <div className="flex h-[72px] flex-1 items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-sm font-bold text-emerald-700">
                                Can {action}
                            </div>
                            <div className="flex h-[72px] flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm font-bold text-slate-600">
                                Does not {action}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex w-[460px] items-stretch justify-center gap-3">
                        <div className="flex min-h-[180px] flex-1 flex-col items-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-3">
                            <span className="text-sm font-bold text-emerald-700">Can {action}</span>
                            {shapeCard(answer, true)}
                        </div>
                        <div className="flex min-h-[180px] flex-1 flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 p-3">
                            <span className="text-sm font-bold text-slate-600">Does not {action}</span>
                            <div className="flex gap-2">
                                {otherOptions.map(option => shapeCard(option))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ShapeSameAttribute = withConfig(ShapeSameAttributeViewSchema, ShapeSameAttributeCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-same-attribute'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<ShapeSameAttribute payload={payload} />);
    }
};
