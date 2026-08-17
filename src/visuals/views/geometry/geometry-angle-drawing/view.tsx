import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {SketchAngleProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {counterclockwiseAngleArc, pointOnAngleCircle} from '../helpers.ts';
import {isValidSketchAngleProblem} from './helpers.ts';
import {
    GeometryAngleDrawingViewConfig,
    GeometryAngleDrawingViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: GeometryAngleDrawingViewConfig;
    payload: ViewRenderPayload<'geometry-angle-drawing'>;
}

const CENTER_X = 220;
const CENTER_Y = 225;
const RAY_RADIUS = 205;

function DrawingCanvas({data, isSolutionView}: {
    data: SketchAngleProblem;
    isSolutionView: boolean;
}) {
    const baselineEnd = pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        RAY_RADIUS,
        data.geometry.baselineDegrees
    );
    const baselineLabel = pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        RAY_RADIUS + 25,
        data.geometry.baselineDegrees
    );
    const terminalEnd = pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        RAY_RADIUS,
        data.geometry.terminalDegrees
    );
    const terminalLabel = pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        RAY_RADIUS + 25,
        data.geometry.terminalDegrees
    );
    const measureLabel = pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        112,
        data.geometry.sweepDegrees / 2
    );
    const accessibleName = isSolutionView
        ? `Completed angle AOB with ${data.solutionRelation}`
        : 'Blank angle-drawing canvas with vertex O and starting ray OA only';

    return (
        <svg viewBox="0 0 650 330" className="h-[330px] w-[650px]" aria-label={accessibleName}>
            <defs>
                <marker id="drawing-ray-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="#334155" />
                </marker>
            </defs>
            <line
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={baselineEnd.x}
                y2={baselineEnd.y}
                stroke="#334155"
                strokeWidth="6"
                markerEnd="url(#drawing-ray-arrow)"
            />
            <circle cx={CENTER_X} cy={CENTER_Y} r="8" fill="#1e293b" />
            <text x={CENTER_X - 17} y={CENTER_Y + 28} className="fill-slate-800 text-[18px] font-extrabold">{data.geometry.vertexLabel}</text>
            <text x={baselineLabel.x} y={baselineLabel.y + 6} textAnchor="middle" className="fill-slate-800 text-[18px] font-extrabold">{data.geometry.baselinePointLabel}</text>

            {!isSolutionView && (
                <g>
                    <rect x="125" y="35" width="420" height="72" rx="18" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 7" />
                    <text x="335" y="67" textAnchor="middle" className="fill-slate-600 text-[17px] font-extrabold">Draw the second ray from O.</text>
                    <text x="335" y="91" textAnchor="middle" className="fill-slate-500 text-[14px] font-semibold">Label its endpoint B.</text>
                </g>
            )}

            {isSolutionView && (
                <g>
                    <line
                        x1={CENTER_X}
                        y1={CENTER_Y}
                        x2={terminalEnd.x}
                        y2={terminalEnd.y}
                        stroke="#0f766e"
                        strokeWidth="6"
                        markerEnd="url(#drawing-ray-arrow)"
                    />
                    <path
                        d={counterclockwiseAngleArc(
                            CENTER_X,
                            CENTER_Y,
                            82,
                            data.geometry.baselineDegrees,
                            data.geometry.terminalDegrees
                        )}
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth="9"
                        strokeLinecap="round"
                    />
                    <text x={terminalLabel.x} y={terminalLabel.y + 6} textAnchor="middle" className="fill-teal-800 text-[18px] font-extrabold">{data.geometry.terminalPointLabel}</text>
                    <rect x={measureLabel.x - 36} y={measureLabel.y - 22} width="72" height="36" rx="16" fill="white" stroke="#10b981" strokeWidth="2" />
                    <text x={measureLabel.x} y={measureLabel.y + 3} textAnchor="middle" className="fill-emerald-700 text-[18px] font-extrabold">{data.completedMeasure}°</text>
                </g>
            )}
        </svg>
    );
}

const GeometryAngleDrawingCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData('geometry-angle-drawing', problem.data, [
        'task',
        'prompt',
        'geometry',
        'answer',
        'answerStatement',
        'explanation'
    ]);
    const data = problem.data;
    if (data.task !== 'sketch-angle') {
        throw new ViewValidationError('geometry-angle-drawing', 'Expected an angle sketching task.');
    }
    validateProblemData('geometry-angle-drawing', data, [
        'requestedMeasure',
        'completedMeasure',
        'questionRelation',
        'solutionRelation'
    ]);
    if (!isValidSketchAngleProblem(data)) {
        throw new ViewValidationError(
            'geometry-angle-drawing',
            'The requested measure, completed rays, degree annotation, and supplied prose must agree exactly.'
        );
    }

    return (
        <div className="w-[700px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[54px] items-center justify-center px-4 text-center text-[1.22rem] font-bold leading-snug text-slate-700">
                {data.prompt}
            </div>
            <div className="mt-3 flex h-[340px] items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <DrawingCanvas data={data} isSolutionView={isSolutionView} />
            </div>
            {!isSolutionView && (
                <div className="mt-3 flex min-h-[58px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 font-mono text-[1.05rem] font-extrabold text-slate-700">
                    {data.questionRelation}
                </div>
            )}
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="font-mono text-[1.08rem] font-extrabold">{data.solutionRelation}</div>
                    <div className="mt-1 text-[1rem] font-extrabold">{data.answerStatement}</div>
                    <div className="mt-1 text-[0.87rem] font-semibold leading-snug text-slate-700">{data.explanation}</div>
                </div>
            )}
        </div>
    );
};

export const GeometryAngleDrawing = withConfig(
    GeometryAngleDrawingViewSchema,
    GeometryAngleDrawingCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-angle-drawing'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<GeometryAngleDrawing payload={payload} />);
    }
};
