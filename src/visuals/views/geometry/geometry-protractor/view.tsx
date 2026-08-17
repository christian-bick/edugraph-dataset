import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MeasureAngleProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {pointOnAngleCircle} from '../helpers.ts';
import {isValidMeasureAngleProblem} from './helpers.ts';
import {
    GeometryProtractorViewConfig,
    GeometryProtractorViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: GeometryProtractorViewConfig;
    payload: ViewRenderPayload<'geometry-protractor'>;
}

const CENTER_X = 325;
const CENTER_Y = 250;
const OUTER_RADIUS = 200;

function scaleLabelPosition(degrees: number, scale: 'inner' | 'outer') {
    return pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        scale === 'inner' ? 151 : 181,
        degrees
    );
}

function ProtractorDiagram({data, isSolutionView}: {
    data: MeasureAngleProblem;
    isSolutionView: boolean;
}) {
    const tickDegrees = Array.from(
        {length: (data.protractor.maximumDegrees - data.protractor.minimumDegrees) / data.protractor.tickStepDegrees + 1},
        (_, index) => data.protractor.minimumDegrees + index * data.protractor.tickStepDegrees
    );
    const labelDegrees = tickDegrees.filter(degrees => degrees % data.protractor.labelStepDegrees === 0);
    const baselineEnd = pointOnAngleCircle(CENTER_X, CENTER_Y, OUTER_RADIUS + 16, data.geometry.baselineDegrees);
    const terminalEnd = pointOnAngleCircle(CENTER_X, CENTER_Y, OUTER_RADIUS + 16, data.geometry.terminalDegrees);
    const baselineLabel = pointOnAngleCircle(CENTER_X, CENTER_Y, OUTER_RADIUS + 32, data.geometry.baselineDegrees);
    const terminalLabel = pointOnAngleCircle(CENTER_X, CENTER_Y, OUTER_RADIUS + 30, data.geometry.terminalDegrees);
    const selectedScale = data.protractor.readingScale;
    const accessibleName = isSolutionView
        ? `Angle AOB aligned on the ${selectedScale} protractor scale; ${data.solutionRelation}`
        : `Angle AOB aligned on the ${selectedScale} protractor scale with its measure left unknown`;

    return (
        <svg viewBox="0 0 650 340" className="h-[340px] w-[650px]" aria-label={accessibleName}>
            <defs>
                <marker id="protractor-ray-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="#334155" />
                </marker>
            </defs>
            <path
                d="M 125 250 A 200 200 0 0 1 525 250 L 125 250 Z"
                fill="#eff6ff"
                stroke="#60a5fa"
                strokeWidth="3"
            />
            <line x1="125" y1="250" x2="525" y2="250" stroke="#60a5fa" strokeWidth="3" />
            <g aria-hidden="true">
                {tickDegrees.map(degrees => {
                    const isTen = degrees % data.protractor.labelStepDegrees === 0;
                    const isFive = degrees % 5 === 0;
                    const inner = pointOnAngleCircle(
                        CENTER_X,
                        CENTER_Y,
                        OUTER_RADIUS - (isTen ? 18 : isFive ? 12 : 7),
                        degrees
                    );
                    const outer = pointOnAngleCircle(CENTER_X, CENTER_Y, OUTER_RADIUS, degrees);
                    return (
                        <line
                            key={degrees}
                            x1={inner.x}
                            y1={inner.y}
                            x2={outer.x}
                            y2={outer.y}
                            stroke={isTen ? '#475569' : '#94a3b8'}
                            strokeWidth={isTen ? 2 : 1}
                        />
                    );
                })}
            </g>
            {labelDegrees.map(degrees => {
                const innerPosition = scaleLabelPosition(degrees, 'inner');
                const outerPosition = scaleLabelPosition(degrees, 'outer');
                return (
                    <g key={degrees}>
                        <text
                            x={innerPosition.x}
                            y={innerPosition.y + 4}
                            textAnchor="middle"
                            className={selectedScale === 'inner'
                                ? 'fill-teal-800 text-[10px] font-extrabold'
                                : 'fill-slate-500 text-[9px] font-semibold'}
                        >
                            {degrees}
                        </text>
                        <text
                            x={outerPosition.x}
                            y={outerPosition.y + 4}
                            textAnchor="middle"
                            className={selectedScale === 'outer'
                                ? 'fill-teal-800 text-[10px] font-extrabold'
                                : 'fill-slate-500 text-[9px] font-semibold'}
                        >
                            {data.protractor.maximumDegrees - degrees}
                        </text>
                    </g>
                );
            })}
            <line
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={baselineEnd.x}
                y2={baselineEnd.y}
                stroke="#334155"
                strokeWidth="5"
                markerEnd="url(#protractor-ray-arrow)"
            />
            <line
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={terminalEnd.x}
                y2={terminalEnd.y}
                stroke="#334155"
                strokeWidth="5"
                markerEnd="url(#protractor-ray-arrow)"
            />
            <circle cx={CENTER_X} cy={CENTER_Y} r="10" fill="white" stroke="#0f766e" strokeWidth="4" />
            <line x1={CENTER_X - 14} y1={CENTER_Y} x2={CENTER_X + 14} y2={CENTER_Y} stroke="#0f766e" strokeWidth="2" />
            <line x1={CENTER_X} y1={CENTER_Y - 14} x2={CENTER_X} y2={CENTER_Y + 14} stroke="#0f766e" strokeWidth="2" />
            <text x={CENTER_X} y={CENTER_Y + 33} textAnchor="middle" className="fill-slate-800 text-[17px] font-extrabold">{data.geometry.vertexLabel}</text>
            <text
                x={baselineLabel.x}
                y={baselineLabel.y + 6}
                textAnchor="middle"
                className="fill-slate-800 text-[18px] font-extrabold"
            >
                {data.geometry.baselinePointLabel}
            </text>
            <text
                x={terminalLabel.x}
                y={terminalLabel.y + 6}
                textAnchor="middle"
                className="fill-slate-800 text-[18px] font-extrabold"
            >
                {data.geometry.terminalPointLabel}
            </text>
            <g transform="translate(325 314)">
                <rect x="-150" y="-17" width="300" height="34" rx="17" fill="#ecfeff" stroke="#5eead4" strokeWidth="2" />
                <text y="5" textAnchor="middle" className="fill-teal-900 text-[14px] font-extrabold">
                    Start at A = 0° · read the {selectedScale} scale
                </text>
            </g>
        </svg>
    );
}

const GeometryProtractorCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData('geometry-protractor', problem.data, [
        'task',
        'prompt',
        'geometry',
        'answer',
        'answerStatement',
        'explanation'
    ]);
    const data = problem.data;
    if (data.task !== 'measure-angle') {
        throw new ViewValidationError('geometry-protractor', 'Expected a protractor measurement task.');
    }
    validateProblemData('geometry-protractor', data, [
        'protractor',
        'angleMeasure',
        'questionRelation',
        'solutionRelation'
    ]);
    if (!isValidMeasureAngleProblem(data)) {
        throw new ViewValidationError(
            'geometry-protractor',
            'The rays, protractor scale, whole-degree reading, and supplied prose must agree exactly.'
        );
    }

    return (
        <div className="w-[700px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[48px] items-center justify-center text-center text-[1.22rem] font-bold text-slate-700">
                {data.prompt}
            </div>
            <div className="mt-2 flex h-[350px] items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <ProtractorDiagram data={data} isSolutionView={isSolutionView} />
            </div>
            {!isSolutionView && (
                <div className="mt-3 flex min-h-[58px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 font-mono text-[1.08rem] font-extrabold text-slate-700">
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

export const GeometryProtractor = withConfig(
    GeometryProtractorViewSchema,
    GeometryProtractorCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-protractor'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<GeometryProtractor payload={payload} />);
    }
};
