import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeComparisonAttribute, ShapeComparisonName} from '../../../../types/problems.ts';
import '../../../../tailwind.css';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {comparisonAppearances, validateShapeComparison} from './helpers.ts';
import {ShapeCompareAttributesViewConfig, ShapeCompareAttributesViewSchema} from './spec.ts';

interface CoreProps {
    config: ShapeCompareAttributesViewConfig;
    payload: ViewRenderPayload<'shape-compare-attributes'>;
}

function ShapeArtwork({
    shape,
    color,
    idSuffix
}: {
    shape: ShapeComparisonName;
    color: string;
    idSuffix: string;
}) {
    const commonProps = {
        width: 124,
        height: 124,
        viewBox: '0 0 100 100',
        className: 'overflow-visible'
    };
    const stroke = '#1e3a5f';
    const props = {fill: color, stroke, strokeWidth: 3, strokeLinejoin: 'round' as const};

    if (shape === 'circle') return <svg {...commonProps}><circle cx="50" cy="50" r="39" {...props}/></svg>;
    if (shape === 'square') return <svg {...commonProps}><rect x="11" y="11" width="78" height="78" rx="3" {...props}/></svg>;
    if (shape === 'rectangle') return <svg {...commonProps}><rect x="8" y="25" width="84" height="50" rx="3" {...props}/></svg>;
    if (shape === 'triangle') return <svg {...commonProps}><polygon points="50,8 92,89 8,89" {...props}/></svg>;
    if (shape === 'hexagon') return <svg {...commonProps}><polygon points="50,7 87,28 87,72 50,93 13,72 13,28" {...props}/></svg>;
    if (shape === 'cube') {
        return (
            <svg {...commonProps}>
                <path d="M18 37 L59 37 L59 80 L18 80 Z" {...props}/>
                <path d="M18 37 L40 17 L82 17 L59 37 Z" fill="#bfdbfe" stroke={stroke} strokeWidth="3" strokeLinejoin="round"/>
                <path d="M59 37 L82 17 L82 60 L59 80 Z" fill={color} stroke={stroke} strokeWidth="3" strokeLinejoin="round"/>
                <path d="M18 80 L40 60 L82 60 M40 17 L40 60" fill="none" stroke={stroke} strokeWidth="2" strokeDasharray="4 4"/>
            </svg>
        );
    }
    if (shape === 'cone') {
        return (
            <svg {...commonProps}>
                <path d="M50 10 L18 76 Q50 94 82 76 Z" {...props}/>
                <ellipse cx="50" cy="76" rx="32" ry="11" fill={color} stroke={stroke} strokeWidth="3"/>
                <path d="M18 76 Q50 59 82 76" fill="none" stroke={stroke} strokeWidth="2" strokeDasharray="4 4"/>
            </svg>
        );
    }
    if (shape === 'cylinder') {
        return (
            <svg {...commonProps}>
                <path d="M20 25 V76 Q50 93 80 76 V25" {...props}/>
                <ellipse cx="50" cy="25" rx="30" ry="11" fill="#bfdbfe" stroke={stroke} strokeWidth="3"/>
                <ellipse cx="50" cy="76" rx="30" ry="11" fill={color} stroke={stroke} strokeWidth="3"/>
                <path d="M20 76 Q50 59 80 76" fill="none" stroke={stroke} strokeWidth="2" strokeDasharray="4 4"/>
            </svg>
        );
    }
    if (shape === 'sphere') {
        const gradientId = `shape-comparison-sphere-${idSuffix}`;
        return (
            <svg {...commonProps}>
                <defs>
                    <radialGradient id={gradientId} cx="32%" cy="28%" r="72%">
                        <stop offset="0%" stopColor="#ffffff"/>
                        <stop offset="45%" stopColor={color}/>
                        <stop offset="100%" stopColor="#1e3a5f"/>
                    </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="39" fill={`url(#${gradientId})`} stroke={stroke} strokeWidth="3"/>
                <ellipse cx="50" cy="50" rx="39" ry="13" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.65"/>
            </svg>
        );
    }
    throw new ViewValidationError('shape-compare-attributes', `Unsupported shape: ${shape}`);
}

function titleCase(shape: ShapeComparisonName): string {
    return shape.charAt(0).toUpperCase() + shape.slice(1);
}

function attributeLabel(attribute: ShapeComparisonAttribute, count?: number): string {
    if (attribute === 'faces') return count === 1 ? 'flat face' : 'flat faces';
    if (attribute === 'vertices') return count === 1 ? 'vertex' : 'vertices';
    if (attribute === 'sides') return count === 1 ? 'side' : 'sides';
    return count === 1 ? 'edge' : 'edges';
}

export const ShapeCompareAttributesCore = ({config: _config, payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData('shape-compare-attributes', data, [
        'dimension', 'attribute', 'shapes', 'relation', 'answer', 'prompt', 'evidence'
    ]);
    validateShapeComparison(data);

    const appearances = comparisonAppearances(payload.seed);

    return (
        <div className="flex w-[650px] flex-col items-center rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="mb-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-indigo-700">
                Compare {attributeLabel(data.attribute)}
            </div>
            <div className="mb-5 text-center text-[1.35rem] font-bold leading-snug text-slate-800">
                {data.prompt}
            </div>

            <div className="grid w-full grid-cols-2 gap-5">
                {data.shapes.map((item, index) => {
                    const appearance = appearances[index];
                    const isAnswer = payload.isSolutionView && item.shape === data.answer;
                    return (
                        <div
                            key={item.shape}
                            className={`flex min-h-[260px] flex-col items-center justify-between rounded-2xl border-[3px] p-4 ${
                                isAnswer
                                    ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
                                    : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <div className="flex h-[150px] w-full items-center justify-center">
                                <div style={{transform: `rotate(${appearance.rotation}deg) scale(${appearance.scale})`}}>
                                    <ShapeArtwork shape={item.shape} color={appearance.color} idSuffix={`${payload.seed}-${index}`}/>
                                </div>
                            </div>
                            <div className="text-lg font-extrabold text-slate-800">{titleCase(item.shape)}</div>
                            <div className={`mt-2 rounded-full px-4 py-2 text-base font-bold ${
                                isAnswer ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300'
                            }`}>
                                {item.count} {attributeLabel(data.attribute, item.count)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {payload.isSolutionView && (
                <div className="mt-5 w-full rounded-xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
                    <div className="mb-2 text-lg font-extrabold text-emerald-800">
                        {titleCase(data.answer)} has more {attributeLabel(data.attribute)}.
                    </div>
                    <div className="space-y-1 text-sm font-semibold text-slate-700">
                        {data.evidence.map(statement => <div key={statement}>{statement}</div>)}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ShapeCompareAttributes = withConfig(ShapeCompareAttributesViewSchema, ShapeCompareAttributesCore);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'shape-compare-attributes'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<ShapeCompareAttributes payload={payload}/>);
        }
    };
}
