import {createRoot} from 'react-dom/client';
import {Ability} from 'edugraph-ts';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    AngleConceptGeometry,
    DeriveOneDegreeProblem,
    InterpretDegreeIterationProblem,
    RecognizeAngleFromArcProblem
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    GeometryAngleConceptsViewConfig,
    GeometryAngleConceptsViewSchema
} from './spec.ts';
import {
    counterclockwiseArcPath,
    isValidAngleConceptProblem,
    pointOnCircle
} from './helpers.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: GeometryAngleConceptsViewConfig;
    payload: ViewRenderPayload<'geometry-angle-concepts'>;
}

const CENTER_X = 310;
const CENTER_Y = 145;
const RADIUS = 105;

function RayAndArcDiagram({geometry}: {geometry: AngleConceptGeometry}) {
    const start = pointOnCircle(CENTER_X, CENTER_Y, RADIUS, geometry.startDegrees);
    const end = pointOnCircle(CENTER_X, CENTER_Y, RADIUS, geometry.endDegrees);
    const labelEnd = pointOnCircle(CENTER_X, CENTER_Y, RADIUS + 24, geometry.endDegrees);

    return (
        <svg
            viewBox="0 0 620 290"
            className="h-[290px] w-[620px]"
            aria-label="Two rays from O meet a circular reference at A and B, with the counterclockwise circumference arc highlighted"
        >
            <defs>
                <marker id="angle-ray-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="#334155" />
                </marker>
            </defs>
            <circle cx={CENTER_X} cy={CENTER_Y} r={RADIUS} fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
            <path
                d={counterclockwiseArcPath(CENTER_X, CENTER_Y, RADIUS, geometry.startDegrees, geometry.endDegrees)}
                fill="none"
                stroke="#0d9488"
                strokeWidth="12"
                strokeLinecap="round"
            />
            <line x1={CENTER_X} y1={CENTER_Y} x2={start.x + 18} y2={start.y} stroke="#334155" strokeWidth="5" markerEnd="url(#angle-ray-arrow)" />
            <line x1={CENTER_X} y1={CENTER_Y} x2={end.x} y2={end.y} stroke="#334155" strokeWidth="5" markerEnd="url(#angle-ray-arrow)" />
            <circle cx={CENTER_X} cy={CENTER_Y} r="7" fill="#1e293b" />
            <circle cx={start.x} cy={start.y} r="6" fill="#0f766e" />
            <circle cx={end.x} cy={end.y} r="6" fill="#0f766e" />
            <text x={CENTER_X - 14} y={CENTER_Y + 24} className="fill-slate-800 text-[18px] font-extrabold">{geometry.centerLabel}</text>
            <text x={start.x + 22} y={start.y + 7} className="fill-slate-800 text-[18px] font-extrabold">{geometry.startPointLabel}</text>
            <text x={labelEnd.x - 6} y={labelEnd.y + 7} textAnchor="middle" className="fill-slate-800 text-[18px] font-extrabold">{geometry.endPointLabel}</text>
        </svg>
    );
}

function RecognitionDiagram({data}: {data: RecognizeAngleFromArcProblem}) {
    return (
        <div className="flex h-[300px] flex-col items-center justify-center">
            <RayAndArcDiagram geometry={data.geometry} />
            <div className="-mt-6 text-[0.95rem] font-semibold text-slate-600">{data.rayStatement}</div>
        </div>
    );
}

function OneDegreeDiagram({data, isSolutionView}: {data: DeriveOneDegreeProblem; isSolutionView: boolean}) {
    const mainStart = pointOnCircle(175, 140, 98, data.geometry.startDegrees);
    const mainEnd = pointOnCircle(175, 140, 98, data.geometry.endDegrees);
    const insetStart = pointOnCircle(455, 145, 82, -14);
    const insetEnd = pointOnCircle(455, 145, 82, 14);

    return (
        <svg
            viewBox="0 0 620 290"
            className="h-[290px] w-[620px]"
            aria-label={`A full circle with ${data.selectedParts} of ${data.partitionCount} equal turns isolated in a magnified inset`}
        >
            <circle cx="175" cy="140" r="98" fill="#f8fafc" stroke="#64748b" strokeWidth="4" />
            <path d={counterclockwiseArcPath(175, 140, 98, data.geometry.startDegrees, data.geometry.endDegrees)} fill="none" stroke="#0d9488" strokeWidth="12" strokeLinecap="round" />
            <line x1="175" y1="140" x2={mainStart.x} y2={mainStart.y} stroke="#334155" strokeWidth="3" />
            <line x1="175" y1="140" x2={mainEnd.x} y2={mainEnd.y} stroke="#334155" strokeWidth="3" />
            <circle cx={mainStart.x} cy={mainStart.y} r="8" fill="#0d9488" />
            <path d="M 281 129 C 320 102, 335 83, 363 78" fill="none" stroke="#0f766e" strokeWidth="3" strokeDasharray="7 6" />
            <path d="M 281 151 C 320 179, 335 201, 363 210" fill="none" stroke="#0f766e" strokeWidth="3" strokeDasharray="7 6" />

            <circle cx="455" cy="145" r="92" fill="#ecfeff" stroke="#99f6e4" strokeWidth="3" />
            <path d={`M ${insetStart.x} ${insetStart.y} A 82 82 0 0 0 ${insetEnd.x} ${insetEnd.y} L 455 145 Z`} fill="#ccfbf1" stroke="none" />
            <line x1="455" y1="145" x2={insetStart.x} y2={insetStart.y} stroke="#334155" strokeWidth="4" />
            <line x1="455" y1="145" x2={insetEnd.x} y2={insetEnd.y} stroke="#334155" strokeWidth="4" />
            <path d={counterclockwiseArcPath(455, 145, 82, -14, 14)} fill="none" stroke="#0d9488" strokeWidth="10" strokeLinecap="round" />
            <text x="423" y="105" textAnchor="middle" className="fill-teal-900 text-[16px] font-extrabold">magnified sliver</text>
            <text x="423" y="129" textAnchor="middle" className="fill-slate-700 text-[14px] font-bold">{data.selectedParts} of {data.partitionCount} equal turns</text>
            {isSolutionView && (
                <text x="423" y="178" textAnchor="middle" className="fill-emerald-700 text-[22px] font-extrabold">{data.degreeMeasure}°</text>
            )}
            <text x="175" y="277" textAnchor="middle" className="fill-slate-600 text-[15px] font-bold">one full turn</text>
        </svg>
    );
}

function IterationDiagram({data}: {data: InterpretDegreeIterationProblem}) {
    const start = pointOnCircle(155, 120, 92, data.geometry.startDegrees);
    const end = pointOnCircle(155, 120, 92, data.geometry.endDegrees);

    return (
        <div className="flex h-[290px] w-[620px] flex-col items-center">
            <svg
                viewBox="0 0 620 220"
                className="h-[220px] w-[620px]"
                aria-label="An accumulated counterclockwise turn with one boundary mark for every one-degree interval"
            >
                <circle cx="155" cy="120" r="92" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
                <path d={counterclockwiseArcPath(155, 120, 92, data.geometry.startDegrees, data.geometry.endDegrees)} fill="none" stroke="#0d9488" strokeWidth="12" strokeLinecap="round" />
                <line x1="155" y1="120" x2={start.x} y2={start.y} stroke="#334155" strokeWidth="4" />
                <line x1="155" y1="120" x2={end.x} y2={end.y} stroke="#334155" strokeWidth="4" />
                <g aria-hidden="true">
                    {data.geometry.tickDegrees.map(degrees => {
                        const inner = pointOnCircle(155, 120, 84, degrees);
                        const outer = pointOnCircle(155, 120, 101, degrees);
                        return <line key={degrees} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#0f766e" strokeWidth="2" />;
                    })}
                </g>
                <circle cx="155" cy="120" r="6" fill="#1e293b" />
                <text x="300" y="73" className="fill-slate-700 text-[17px] font-extrabold">accumulated turn</text>
                <path d="M 288 82 C 265 88, 253 92, 238 101" fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#iteration-arrow)" />
                <defs>
                    <marker id="iteration-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L7,3 z" fill="#64748b" />
                    </marker>
                </defs>
            </svg>
            <div className="-mt-2 flex h-[58px] items-stretch justify-center gap-1" aria-label={`${data.iterationCount} repeated one-degree intervals`}>
                {data.geometry.tickDegrees.slice(1).map(degrees => (
                    <div key={degrees} className="flex w-[34px] items-center justify-center rounded-md border-2 border-teal-500 bg-teal-50 text-[0.82rem] font-extrabold text-teal-800">
                        {data.unitDegree}°
                    </div>
                ))}
            </div>
        </div>
    );
}

function SolutionPanel({relation, answerStatement, explanation}: {
    relation: string;
    answerStatement: string;
    explanation: string;
}) {
    return (
        <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
            <div className="font-mono text-[1.08rem] font-extrabold">{relation}</div>
            <div className="mt-1 text-[1.02rem] font-extrabold">{answerStatement}</div>
            <div className="mt-1 text-[0.88rem] font-semibold leading-snug text-slate-700">{explanation}</div>
        </div>
    );
}

const GeometryAngleConceptsCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData('geometry-angle-concepts', problem.data, [
        'task',
        'prompt',
        'geometry',
        'answer',
        'answerStatement',
        'explanation'
    ]);
    const data = problem.data;
    const expectedAbility = data.task === 'derive-one-degree'
        ? Ability.ConceptDerivation
        : Ability.Interpretation;
    if (config.abilityMode !== expectedAbility) {
        throw new ViewValidationError(
            'geometry-angle-concepts',
            'The resolved ability mode must agree with the rendered angle task.'
        );
    }
    if (data.task === 'recognize-angle-from-arc') {
        validateProblemData('geometry-angle-concepts', data, [
            'arcFraction',
            'questionRelation',
            'solutionRelation',
            'rayStatement'
        ]);
    } else if (data.task === 'derive-one-degree') {
        validateProblemData('geometry-angle-concepts', data, [
            'partitionCount',
            'selectedParts',
            'unitFraction',
            'degreeMeasure',
            'questionRelation',
            'solutionRelation',
            'fractionStatement'
        ]);
    } else if (data.task === 'interpret-degree-iteration') {
        validateProblemData('geometry-angle-concepts', data, [
            'unitDegree',
            'iterationCount',
            'angleMeasure',
            'questionRelation',
            'solutionRelation',
            'unitStatement'
        ]);
    }
    if (!isValidAngleConceptProblem(data)) {
        throw new ViewValidationError(
            'geometry-angle-concepts',
            'The angle geometry, unit evidence, and supplied relations must agree exactly.'
        );
    }

    return (
        <div className="w-[700px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[54px] items-center justify-center px-5 text-center text-[1.22rem] font-bold leading-snug text-slate-700">
                {data.prompt}
            </div>
            <div className="mt-3 flex h-[310px] items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                {data.task === 'recognize-angle-from-arc' && <RecognitionDiagram data={data} />}
                {data.task === 'derive-one-degree' && <OneDegreeDiagram data={data} isSolutionView={isSolutionView} />}
                {data.task === 'interpret-degree-iteration' && <IterationDiagram data={data} />}
            </div>
            {!isSolutionView && (
                <div className="mt-3 flex min-h-[58px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 text-center font-mono text-[1.05rem] font-extrabold text-slate-700">
                    {data.questionRelation}
                </div>
            )}
            {isSolutionView && (
                <div className="mt-3">
                    <SolutionPanel
                        relation={data.solutionRelation}
                        answerStatement={data.answerStatement}
                        explanation={data.explanation}
                    />
                </div>
            )}
        </div>
    );
};

export const GeometryAngleConcepts = withConfig(
    GeometryAngleConceptsViewSchema,
    GeometryAngleConceptsCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-angle-concepts'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<GeometryAngleConcepts payload={payload} />);
    }
};
