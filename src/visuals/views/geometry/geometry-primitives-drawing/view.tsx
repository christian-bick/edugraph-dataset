import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PrimitiveScene} from '../primitive-scene.tsx';
import {isValidGeometryPrimitivesDrawingProblem} from './helpers.ts';
import {
    GeometryPrimitivesDrawingViewConfig,
    GeometryPrimitivesDrawingViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: GeometryPrimitivesDrawingViewConfig;
    payload: ViewRenderPayload<'geometry-primitives-drawing'>;
}

const GeometryPrimitivesDrawingCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData('geometry-primitives-drawing', problem.data, [
        'primitiveKind',
        'displayName',
        'definition',
        'drawing'
    ]);
    const data = problem.data;
    validateProblemData('geometry-primitives-drawing', data.drawing, [
        'prompt',
        'guideScene',
        'solutionScene',
        'answer',
        'answerStatement',
        'explanation'
    ]);
    if (!isValidGeometryPrimitivesDrawingProblem(data, config.usesLinearDrawing)) {
        throw new ViewValidationError(
            'geometry-primitives-drawing',
            'The requested primitive, construction guide, completed geometry, and supplied prose must agree exactly.'
        );
    }

    const scene = isSolutionView ? data.drawing.solutionScene : data.drawing.guideScene;
    const diagramLabel = isSolutionView
        ? `Completed ${data.displayName} construction: ${data.drawing.answer}`
        : 'Construction guide with the requested starting points or given line only';

    return (
        <div className="w-[700px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[58px] items-center justify-center px-5 text-center text-[1.22rem] font-extrabold leading-snug text-slate-700">
                {data.drawing.prompt}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-[0.78rem] font-bold uppercase tracking-wide text-slate-500">
                <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1">
                    {config.usesLinearDrawing ? 'Straightedge construction' : 'Point construction'}
                </span>
                <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1">Labels required</span>
            </div>
            <div
                className="relative mt-4 flex h-[330px] items-center justify-center overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50"
                role="img"
                aria-label={diagramLabel}
            >
                <div
                    className="absolute inset-0 opacity-45"
                    style={{
                        backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />
                <div className="relative h-[285px] w-[520px] rounded-lg border-2 border-dashed border-slate-300 bg-white/85 p-3">
                    <PrimitiveScene
                        scene={scene}
                        kind={data.primitiveKind}
                        markerId="primitive-drawing"
                        accent={isSolutionView ? '#047857' : '#475569'}
                    />
                </div>
                {!isSolutionView && (
                    <div className="absolute bottom-4 rounded-full bg-slate-700 px-4 py-1.5 text-[0.82rem] font-bold text-white">
                        Complete the construction
                    </div>
                )}
            </div>
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="text-[1.05rem] font-extrabold">{data.drawing.answer}</div>
                    <div className="mt-1 text-[0.96rem] font-bold">{data.drawing.answerStatement}</div>
                    <div className="mt-1 text-[0.86rem] font-semibold leading-snug text-slate-700">{data.drawing.explanation}</div>
                </div>
            )}
        </div>
    );
};

export const GeometryPrimitivesDrawing = withConfig(
    GeometryPrimitivesDrawingViewSchema,
    GeometryPrimitivesDrawingCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-primitives-drawing'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<GeometryPrimitivesDrawing payload={payload} />);
    }
};
