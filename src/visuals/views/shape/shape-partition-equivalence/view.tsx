import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapePartitionEquivalenceProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    ShapePartitionEquivalenceViewConfig,
    ShapePartitionEquivalenceViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapePartitionEquivalenceViewConfig;
    payload: ViewRenderPayload<'shape-partition-equivalence'>;
}

function validateEquivalence(data: ShapePartitionEquivalenceProblem) {
    const expectedSecond = data.shape === 'circle' ? 'curved' : 'diagonal';
    if (
        (data.shape !== 'circle' && data.shape !== 'rectangle')
        || data.parts !== 2
        || data.firstPartition !== 'straight'
        || data.secondPartition !== expectedSecond
        || data.conclusion !== 'equal shares can have different shapes'
    ) {
        throw new ViewValidationError('shape-partition-equivalence', 'Expected two valid equal-share partitions with different geometries.');
    }
}

function EqualMarker({x, y, visible}: {x: number; y: number; visible: boolean}) {
    if (!visible) return null;
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r="15" fill="#ffffff" stroke="#059669" strokeWidth="2" />
            <text y="6" textAnchor="middle" className="fill-emerald-600 text-[20px] font-bold">=</text>
        </g>
    );
}

function RectanglePair({isSolutionView}: {isSolutionView: boolean}) {
    return (
        <svg viewBox="0 0 480 220" className="w-[480px] h-[220px]" aria-label="Two identical rectangles divided into equal shares of different shapes">
            <text x="120" y="20" textAnchor="middle" className="fill-slate-600 text-[14px] font-bold">Whole A</text>
            <text x="360" y="20" textAnchor="middle" className="fill-slate-600 text-[14px] font-bold">Whole B</text>
            <rect x="25" y="42" width="190" height="130" fill="#dbeafe" stroke="#334155" strokeWidth="4" />
            <line x1="120" y1="42" x2="120" y2="172" stroke="#334155" strokeWidth="4" />
            <rect x="265" y="42" width="190" height="130" fill="#fef3c7" stroke="#334155" strokeWidth="4" />
            <line x1="265" y1="42" x2="455" y2="172" stroke="#334155" strokeWidth="4" />
            <EqualMarker x={72} y={107} visible={isSolutionView} />
            <EqualMarker x={168} y={107} visible={isSolutionView} />
            <EqualMarker x={322} y={132} visible={isSolutionView} />
            <EqualMarker x={398} y={82} visible={isSolutionView} />
            <text x="240" y="208" textAnchor="middle" className="fill-slate-500 text-[13px] font-semibold">same-size wholes</text>
        </svg>
    );
}

function CirclePair({isSolutionView}: {isSolutionView: boolean}) {
    return (
        <svg viewBox="0 0 480 220" className="w-[480px] h-[220px]" aria-label="Two identical circles divided into equal shares of different shapes">
            <text x="120" y="20" textAnchor="middle" className="fill-slate-600 text-[14px] font-bold">Whole A</text>
            <text x="360" y="20" textAnchor="middle" className="fill-slate-600 text-[14px] font-bold">Whole B</text>
            <path d="M 120 32 A 75 75 0 0 0 120 182 Z" fill="#dbeafe" />
            <path d="M 120 32 A 75 75 0 0 1 120 182 Z" fill="#eff6ff" />
            <circle cx="120" cy="107" r="75" fill="none" stroke="#334155" strokeWidth="4" />
            <line x1="120" y1="32" x2="120" y2="182" stroke="#334155" strokeWidth="4" />
            <path d="M 360 32 A 75 75 0 0 0 360 182 C 402 160 402 129 360 107 C 318 85 318 54 360 32 Z" fill="#fef3c7" />
            <path d="M 360 32 A 75 75 0 0 1 360 182 C 402 160 402 129 360 107 C 318 85 318 54 360 32 Z" fill="#fffbeb" />
            <circle cx="360" cy="107" r="75" fill="none" stroke="#334155" strokeWidth="4" />
            <path d="M 360 32 C 318 54 318 85 360 107 C 402 129 402 160 360 182" fill="none" stroke="#334155" strokeWidth="4" />
            <EqualMarker x={82} y={107} visible={isSolutionView} />
            <EqualMarker x={158} y={107} visible={isSolutionView} />
            <EqualMarker x={330} y={73} visible={isSolutionView} />
            <EqualMarker x={390} y={141} visible={isSolutionView} />
            <text x="240" y="213" textAnchor="middle" className="fill-slate-500 text-[13px] font-semibold">same-size wholes</text>
        </svg>
    );
}

const ShapePartitionEquivalenceCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData('shape-partition-equivalence', problem.data, [
        'shape',
        'parts',
        'firstPartition',
        'secondPartition',
        'conclusion'
    ]);
    validateEquivalence(problem.data);

    return (
        <div className="flex justify-center items-center p-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="w-[580px] h-[450px] flex flex-col items-center gap-4">
                <div className="h-[58px] px-5 flex items-start justify-center text-center text-[1.3rem] leading-snug font-bold text-slate-700">
                    Do both identical wholes have two equal shares?
                </div>
                <div className="w-[520px] h-[270px] rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center box-border">
                    {problem.data.shape === 'circle'
                        ? <CirclePair isSolutionView={isSolutionView} />
                        : <RectanglePair isSolutionView={isSolutionView} />}
                </div>
                <div
                    className={`h-[68px] w-[500px] px-6 rounded-xl border-2 flex items-center justify-center text-center text-[1.13rem] leading-snug font-bold box-border ${
                        isSolutionView
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-slate-300 bg-white text-transparent'
                    }`}
                    aria-label={isSolutionView ? `Answer: ${problem.data.conclusion}` : 'Blank answer'}
                >
                    {isSolutionView
                        ? 'Yes. Equal shares can have different shapes.'
                        : '\u00a0'}
                </div>
            </div>
        </div>
    );
};

export const ShapePartitionEquivalence = withConfig(
    ShapePartitionEquivalenceViewSchema,
    ShapePartitionEquivalenceCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-partition-equivalence'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapePartitionEquivalence payload={payload} />);
    }
};
