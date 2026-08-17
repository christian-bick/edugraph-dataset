import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapePatternProblem, ShapePatternToken} from '../../../../types/problems.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    isTermWithheld,
    SHAPE_PATTERNS_VIEW_ID,
    shouldRevealEvidence,
    shouldRevealExplanation,
    validateShapePattern
} from './helpers.ts';
import {ShapePatternsViewConfig, ShapePatternsViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapePatternsViewConfig;
    payload: ViewRenderPayload<'shape-patterns'>;
}

function TriangleToken({orientation}: {orientation: ShapePatternToken['orientation']}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className="h-[58px] w-[58px]"
            aria-label={`Triangle pointing ${orientation} degrees clockwise from up`}
        >
            <g transform={`rotate(${orientation} 50 50)`}>
                <polygon points="50,7 91,86 9,86" fill="#2563eb" stroke="#1e3a8a" strokeWidth="5" strokeLinejoin="round" />
                <line x1="50" y1="70" x2="50" y2="30" stroke="white" strokeWidth="7" strokeLinecap="round" />
                <polyline points="37,43 50,28 63,43" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        </svg>
    );
}

function SquareToken() {
    return (
        <svg viewBox="0 0 40 40" className="h-[25px] w-[25px]" aria-label="Square">
            <rect x="3" y="3" width="34" height="34" rx="5" fill="#f59e0b" stroke="#92400e" strokeWidth="4" />
        </svg>
    );
}

function GeometryToken({token}: {token: ShapePatternToken}) {
    return token.shape === 'triangle'
        ? <TriangleToken orientation={token.orientation} />
        : <SquareToken />;
}

function FigureCard({
    data,
    position,
    isSolutionView
}: {
    data: ShapePatternProblem;
    position: number;
    isSolutionView: boolean;
}) {
    const term = data.sequence[position - 1];
    const withheld = isTermWithheld(data, position, isSolutionView);

    return (
        <div className={`flex h-[150px] w-[132px] flex-col rounded-2xl border-2 p-3 ${
            withheld
                ? 'border-dashed border-sky-400 bg-sky-50'
                : isSolutionView && data.task === 'generate' && position > data.givenTermCount
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-white'
        }`}>
            <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Figure {position}
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center">
                {withheld ? (
                    <div className="flex h-[64px] w-[78px] items-center justify-center rounded-xl border-2 border-dashed border-sky-400 bg-white text-3xl font-extrabold text-sky-600">
                        ?
                    </div>
                ) : (
                    <div className="grid max-w-[92px] grid-cols-3 place-items-center gap-1">
                        {term.tokens.map((token, tokenIndex) => (
                            <GeometryToken key={tokenIndex} token={token} />
                        ))}
                    </div>
                )}
            </div>
            <div className={`min-h-[30px] text-center text-[0.72rem] font-bold leading-tight ${
                withheld ? 'text-sky-700' : 'text-slate-600'
            }`}>
                {withheld ? 'Build this figure' : term.caption}
            </div>
        </div>
    );
}

function EvidencePanel({data}: {data: ShapePatternProblem}) {
    return (
        <div className="mt-3 grid grid-cols-2 gap-3">
            {data.evidence.map((item, index) => (
                <div key={index} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-emerald-700">
                        Figures {item.positions.join(', ')}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-emerald-900">{item.observation}</div>
                </div>
            ))}
        </div>
    );
}

function TaskResponse({data, isSolutionView}: {data: ShapePatternProblem; isSolutionView: boolean}) {
    if (data.task === 'generate') {
        return (
            <div className={`rounded-2xl border-2 px-5 py-3 text-center text-base font-extrabold ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-dashed border-sky-300 bg-sky-50 text-sky-800'
            }`}>
                {isSolutionView
                    ? 'Figures 5 and 6 complete the supplied rule.'
                    : 'Draw figures 5 and 6 in the empty positions.'}
            </div>
        );
    }

    if (data.task === 'identify') {
        return (
            <div>
                <div className="grid grid-cols-3 gap-3">
                    {data.featureOptions.map((option, index) => {
                        const selected = isSolutionView && option === data.feature;
                        return (
                            <div key={option} className={`min-h-[88px] rounded-xl border-2 px-4 py-3 text-sm font-semibold leading-snug ${
                                selected
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                    : 'border-slate-200 bg-white text-slate-700'
                            }`}>
                                <div className={`mb-1 text-xs font-extrabold uppercase tracking-[0.1em] ${
                                    selected ? 'text-emerald-700' : 'text-slate-400'
                                }`}>
                                    {String.fromCharCode(65 + index)}{selected ? ' · feature' : ''}
                                </div>
                                {option}
                            </div>
                        );
                    })}
                </div>
                {shouldRevealEvidence(data, isSolutionView) && <EvidencePanel data={data} />}
            </div>
        );
    }

    return (
        <div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-3">
                <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-violet-700">Feature to explain</div>
                <div className="mt-1 text-base font-bold leading-snug text-violet-950">{data.feature}</div>
            </div>
            {shouldRevealEvidence(data, isSolutionView) && <EvidencePanel data={data} />}
            <div className={`mt-3 min-h-[72px] rounded-xl border-2 px-5 py-4 text-base font-semibold leading-relaxed ${
                shouldRevealExplanation(data, isSolutionView)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-white text-slate-500'
            }`}>
                {shouldRevealExplanation(data, isSolutionView)
                    ? data.explanation
                    : 'Explain why this feature continues as the pattern grows.'}
            </div>
        </div>
    );
}

const ShapePatternsCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(SHAPE_PATTERNS_VIEW_ID, data, [
        'task',
        'patternKind',
        'rule',
        'sequence',
        'givenTermCount',
        'feature',
        'evidence',
        'explanation',
        'prompt'
    ]);
    if (data.task === 'generate') {
        validateProblemData(SHAPE_PATTERNS_VIEW_ID, data, ['responsePositions']);
    } else if (data.task === 'identify') {
        validateProblemData(SHAPE_PATTERNS_VIEW_ID, data, ['featureOptions']);
    }
    validateShapePattern(data);

    return (
        <div className="w-[950px] rounded-3xl bg-white p-7 font-sans shadow-[0_12px_34px_rgba(15,23,42,0.1)]">
            <div className="flex items-start justify-between gap-6">
                <div>
                    <div className="text-sm font-extrabold uppercase tracking-[0.15em] text-sky-700">
                        Shape pattern
                    </div>
                    <div className="mt-1 text-xl font-extrabold leading-snug text-slate-900">{data.prompt}</div>
                </div>
                <div className="max-w-[480px] rounded-xl border border-sky-200 bg-sky-50 px-5 py-3">
                    <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-sky-700">Rule</div>
                    <div className="mt-1 text-sm font-bold leading-snug text-sky-950">{data.rule}</div>
                </div>
            </div>

            <div className="mt-5 flex justify-center gap-3 rounded-2xl bg-slate-50 p-4">
                {data.sequence.map(term => (
                    <FigureCard
                        key={term.position}
                        data={data}
                        position={term.position}
                        isSolutionView={isSolutionView}
                    />
                ))}
            </div>

            <div className="mt-5">
                <TaskResponse data={data} isSolutionView={isSolutionView} />
            </div>
        </div>
    );
};

export const ShapePatterns = withConfig(ShapePatternsViewSchema, ShapePatternsCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-patterns'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapePatterns payload={payload} />);
    }
};
