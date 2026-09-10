import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {PartitionBoundary, PartitionPoint, ShapePartitionEquivalenceProblem} from '../../../../types/problems.ts';
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

function validatePartitions(data: ShapePartitionEquivalenceProblem) {
    const fail = () => {
        throw new ViewValidationError('shape-partition-equivalence', 'Expected a whole and two finite partition boundaries.');
    };
    const finitePoint = (point: PartitionPoint) => point && Number.isFinite(point.x) && Number.isFinite(point.y);
    const whole = data.whole;
    if (!whole || (whole.shape !== 'circle' && whole.shape !== 'rectangle')) fail();
    const dimensions = whole.shape === 'circle' ? [whole.radius] : [whole.width, whole.height];
    if (dimensions.some(value => !Number.isFinite(value) || value <= 0)) fail();
    if (!Array.isArray(data.boundaries) || data.boundaries.length !== 2) fail();
    for (const boundary of data.boundaries) {
        if (!boundary || !finitePoint(boundary.start)) fail();
        if (boundary.kind === 'segment') {
            if (!finitePoint(boundary.end)) fail();
        } else if (boundary.kind === 'cubic') {
            if (!Array.isArray(boundary.segments) || boundary.segments.length === 0) fail();
            for (const segment of boundary.segments) {
                if (!segment || ![segment.control1, segment.control2, segment.end].every(finitePoint)) fail();
            }
        } else fail();
    }
}

function Partition({whole, boundary, x, label}: {
    whole: ShapePartitionEquivalenceProblem['whole'];
    boundary: PartitionBoundary;
    x: number;
    label: string;
}) {
    const scale = whole.shape === 'circle'
        ? 75 / whole.radius
        : Math.min(190 / whole.width, 150 / whole.height);
    const point = ({x, y}: PartitionPoint) => `${x * scale} ${y * scale}`;
    const path = `M ${point(boundary.start)} ` + (boundary.kind === 'segment'
        ? `L ${point(boundary.end)}`
        : boundary.segments.map(segment => `C ${point(segment.control1)} ${point(segment.control2)} ${point(segment.end)}`).join(' '));

    return (
        <g transform={`translate(${x} 107)`}>
            <text y="-87" textAnchor="middle" className="fill-slate-600 text-[14px] font-bold">{label}</text>
            <g fill="#dbeafe" stroke="#334155" strokeWidth="4">
                {whole.shape === 'circle'
                    ? <circle r={whole.radius * scale} />
                    : <rect x={-whole.width * scale / 2} y={-whole.height * scale / 2} width={whole.width * scale} height={whole.height * scale} />}
                <path d={path} fill="none" />
            </g>
        </g>
    );
}

export const ShapePartitionEquivalenceCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData('shape-partition-equivalence', problem.data, ['whole', 'boundaries']);
    validatePartitions(problem.data);
    const {whole, boundaries} = problem.data;

    return (
        <div className="flex justify-center items-center p-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="w-[580px] flex flex-col items-center gap-4">
                <div className="px-5 text-center text-[1.3rem] leading-snug font-bold text-slate-700">
                    Can equal shares of identical wholes have different shapes?
                    <div className="mt-2 text-[1rem] font-medium">Explain using these pictures.</div>
                </div>
                <div className="w-[520px] h-[250px] rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center box-border">
                    <svg viewBox="0 0 480 220" className="w-[480px] h-[220px]" aria-label="Two partitions of identical wholes">
                        <Partition whole={whole} boundary={boundaries[0]} x={120} label="Whole A" />
                        <Partition whole={whole} boundary={boundaries[1]} x={360} label="Whole B" />
                        <text x="240" y="208" textAnchor="middle" className="fill-slate-500 text-[13px] font-semibold">identical wholes</text>
                    </svg>
                </div>
                <div
                    className={`min-h-[132px] w-[520px] px-5 py-3 rounded-xl border-2 flex items-center justify-center text-center text-[1.05rem] leading-snug box-border ${
                        isSolutionView
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-slate-300 bg-white'
                    }`}
                    aria-label={isSolutionView ? 'Explanation' : 'Blank answer'}
                >
                    {isSolutionView ? <div>
                        <strong>Yes. These pictures show that it is possible.</strong>
                        <div className="mt-2">In each whole, a half-turn fits one piece onto the other, so each piece is half of the same-size whole.</div>
                        <div className="mt-2">Yet the pieces in A and B have different shapes.</div>
                    </div> : '\u00a0'}
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

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'shape-partition-equivalence'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<ShapePartitionEquivalence payload={payload} />);
        }
    };
}
