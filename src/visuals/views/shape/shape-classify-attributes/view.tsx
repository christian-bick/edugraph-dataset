import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    PlaneShapeName,
    RightTriangleCategoryProblem,
    ShapeAngleClassificationProblem,
    ShapeAttributeClassificationProblem,
    ShapeClassificationCoordinate,
    ShapeClassificationFigure,
    ShapeClassificationMarker,
    ShapeClassificationStroke,
    ShapeCountAttribute,
    ShapeCountOption,
    ShapeLineRelationClassificationProblem,
    ShapeSubsumptionProblem
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {
    countClassificationMatchesRenderedPolygons,
    getShapeAppearance,
    ShapeAppearance
} from '../helpers.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    ShapeClassifyAttributesViewConfig,
    ShapeClassifyAttributesViewSchema
} from './spec.ts';
import {isValidGrade4ShapeClassificationProblem} from './helpers.ts';
import '../../../../tailwind.css';

const SUPPORTED_SHAPES: readonly PlaneShapeName[] = [
    'circle',
    'triangle',
    'rhombus',
    'square',
    'rectangle',
    'hexagon'
];

const markerPoint = (
    center: ShapeClassificationCoordinate,
    radius: number,
    degrees: number
): ShapeClassificationCoordinate => {
    const radians = degrees * Math.PI / 180;
    return {
        x: center.x + radius * Math.cos(radians),
        y: center.y + radius * Math.sin(radians)
    };
};

const angleMarkerPath = (
    center: ShapeClassificationCoordinate,
    radius: number,
    startDegrees: number,
    endDegrees: number
): string => {
    const start = markerPoint(center, radius, startDegrees);
    const end = markerPoint(center, radius, endDegrees);
    const large = Math.abs(endDegrees - startDegrees) > 180 ? 1 : 0;
    const sweep = endDegrees >= startDegrees ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} ${sweep} ${end.x} ${end.y}`;
};

function EvidenceMarker({marker}: {marker: ShapeClassificationMarker | null}) {
    if (marker === null) return null;
    if (marker.kind === 'angle-arc') {
        return (
            <path
                d={angleMarkerPath(marker.center, marker.radius, marker.startDegrees, marker.endDegrees)}
                fill="none"
                stroke="#d97706"
                strokeWidth="2.8"
                strokeLinecap="round"
            />
        );
    }
    if (marker.kind === 'right-angle') {
        return (
            <polyline
                points={marker.points.map(point => `${point.x},${point.y}`).join(' ')}
                fill="none"
                stroke="#d97706"
                strokeWidth="2.8"
                strokeLinejoin="round"
            />
        );
    }
    return (
        <g stroke="#d97706" strokeWidth="2.8" strokeLinecap="round">
            {marker.strokes.map((stroke, index) => (
                <line
                    key={index}
                    x1={stroke.start.x}
                    y1={stroke.start.y}
                    x2={stroke.end.x}
                    y2={stroke.end.y}
                />
            ))}
        </g>
    );
}

function ClassificationFigure({
    figure,
    evidence,
    marker,
    solvedPositive
}: {
    figure: ShapeClassificationFigure;
    evidence: [ShapeClassificationStroke, ShapeClassificationStroke];
    marker: ShapeClassificationMarker | null;
    solvedPositive: boolean;
}) {
    const points = figure.vertices.map(point => `${point.x},${point.y}`).join(' ');
    const evidenceColor = solvedPositive ? '#047857' : '#4f46e5';
    return (
        <svg viewBox="0 0 100 100" className="h-[118px] w-[150px]" aria-hidden="true">
            <polygon points={points} fill="#eff6ff" stroke="#334155" strokeWidth="2.8" strokeLinejoin="round" />
            {evidence.map((stroke, index) => (
                <line
                    key={index}
                    x1={stroke.start.x}
                    y1={stroke.start.y}
                    x2={stroke.end.x}
                    y2={stroke.end.y}
                    stroke={evidenceColor}
                    strokeWidth="4.2"
                    strokeLinecap="round"
                />
            ))}
            <EvidenceMarker marker={marker} />
            {figure.vertices.map((point, index) => (
                <circle key={index} cx={point.x} cy={point.y} r="2.1" fill="#ffffff" stroke="#334155" strokeWidth="1.4" />
            ))}
        </svg>
    );
}

type Grade4Option =
    | ShapeLineRelationClassificationProblem['options'][number]
    | ShapeAngleClassificationProblem['options'][number]
    | RightTriangleCategoryProblem['options'][number];

function MembershipOption({
    option,
    evidence,
    marker,
    positiveLabel,
    negativeLabel,
    isSolutionView
}: {
    option: Grade4Option;
    evidence: [ShapeClassificationStroke, ShapeClassificationStroke];
    marker: ShapeClassificationMarker | null;
    positiveLabel: string;
    negativeLabel: string;
    isSolutionView: boolean;
}) {
    const solutionClass = !isSolutionView
        ? 'border-slate-200 bg-slate-50'
        : option.satisfies
            ? 'border-emerald-600 bg-emerald-50'
            : 'border-rose-300 bg-rose-50';
    return (
        <div
            className={`relative flex h-[190px] flex-col items-center justify-center rounded-xl border-2 px-3 pb-2 pt-4 ${solutionClass}`}
            role="img"
            aria-label={`Figure ${option.id}, ${option.figure.vertices.length}-sided polygon with two highlighted sides and ${
                option.marker === null
                    ? 'no geometric marker'
                    : option.marker.kind === 'parallel'
                        ? 'two matching marks across the highlighted sides'
                        : option.marker.kind === 'right-angle'
                            ? 'a small square corner marker'
                            : 'a curved angle marker'
            }${
                isSolutionView ? `, ${option.satisfies ? positiveLabel : negativeLabel}` : ', membership not revealed'
            }`}
        >
            <div className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold text-white ${
                isSolutionView && option.satisfies ? 'bg-emerald-700' : 'bg-slate-700'
            }`}>
                {option.id}
            </div>
            {isSolutionView && (
                <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.66rem] font-extrabold uppercase tracking-wide ${
                    option.satisfies ? 'bg-emerald-700 text-white' : 'bg-rose-100 text-rose-800'
                }`}>
                    {option.satisfies ? positiveLabel : negativeLabel}
                </div>
            )}
            <ClassificationFigure
                figure={option.figure}
                evidence={evidence}
                marker={marker}
                solvedPositive={isSolutionView && option.satisfies}
            />
            <div className="mt-1 text-[0.82rem] font-bold text-slate-700">Figure {option.id}</div>
        </div>
    );
}

function Grade4ClassificationLayout({
    data,
    isSolutionView
}: {
    data: ShapeLineRelationClassificationProblem | ShapeAngleClassificationProblem | RightTriangleCategoryProblem;
    isSolutionView: boolean;
}) {
    const isRightTriangle = data.task === 'classify-right-triangle-category';
    const options: readonly Grade4Option[] = data.options;
    return (
        <div className="w-[700px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[54px] items-center justify-center px-4 text-center text-[1.2rem] font-extrabold leading-snug text-slate-700">
                {data.prompt}
            </div>
            {isRightTriangle && (
                <div className="mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2 text-center">
                    {data.attributes.map(attribute => (
                        <span key={attribute} className="rounded-full border border-blue-200 bg-white px-3 py-1 text-[0.78rem] font-bold text-blue-800">
                            {attribute}
                        </span>
                    ))}
                    <span className="ml-2 text-[0.84rem] font-extrabold text-blue-800">{data.categoryStatement}</span>
                </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
                {options.map(option => (
                    <MembershipOption
                        key={option.id}
                        option={option}
                        evidence={'evidenceStrokes' in option ? option.evidenceStrokes : option.evidenceRays}
                        marker={option.marker}
                        positiveLabel={data.positiveLabel}
                        negativeLabel={data.negativeLabel}
                        isSolutionView={isSolutionView}
                    />
                ))}
            </div>
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="text-[0.98rem] font-extrabold">{data.answerStatement}</div>
                    <div className="mt-1 text-[0.84rem] font-semibold leading-snug text-slate-700">{data.explanation}</div>
                </div>
            )}
        </div>
    );
}

function ShapeExample({shape, appearance}: {shape: PlaneShapeName; appearance: ShapeAppearance}) {
    const common = {
        fill: appearance.color,
        stroke: '#334155',
        strokeWidth: 3
    };
    const style = {
        transform: `rotate(${appearance.rotation}deg) scale(${appearance.scale})`,
        transformOrigin: 'center'
    };

    return (
        <svg width="76" height="76" viewBox="0 0 100 100" className="overflow-visible" style={style}>
            {shape === 'circle' && <circle cx="50" cy="50" r="37" {...common} />}
            {shape === 'triangle' && <polygon points="50,10 90,88 10,88" {...common} />}
            {shape === 'rhombus' && <polygon points="50,8 91,50 50,92 9,50" {...common} />}
            {shape === 'square' && <rect x="13" y="13" width="74" height="74" rx="3" {...common} />}
            {shape === 'rectangle' && <rect x="8" y="25" width="84" height="50" rx="3" {...common} />}
            {shape === 'hexagon' && <polygon points="50,8 87,29 87,71 50,92 13,71 13,29" {...common} />}
        </svg>
    );
}

function titleCase(value: string): string {
    return value[0].toUpperCase() + value.slice(1);
}

function validateSubsumptionProblem(data: ShapeSubsumptionProblem) {
    if (!['rhombus', 'rectangle', 'square'].includes(data.shape)) {
        throw new ViewValidationError('shape-classify-attributes', `Unsupported hierarchy shape: ${data.shape}`);
    }
    if (!Array.isArray(data.attributes) || data.attributes.length < 2) {
        throw new ViewValidationError('shape-classify-attributes', 'Hierarchy attributes must be visible and complete.');
    }
    if (!Array.isArray(data.options) || data.options.length !== 4) {
        throw new ViewValidationError('shape-classify-attributes', 'Exactly four category options are required.');
    }
    const ids = new Set(data.options.map(option => option.id));
    const satisfying = data.options.filter(option => option.satisfies);
    if (
        ids.size !== 4
        || satisfying.length !== 1
        || satisfying[0].category !== data.category
        || satisfying[0].id !== data.answer
    ) {
        throw new ViewValidationError('shape-classify-attributes', 'The answer must identify quadrilateral as the larger category.');
    }
}

function ShapeSubsumptionLayout({
    data,
    isSolutionView,
    seed
}: {
    data: ShapeSubsumptionProblem;
    isSolutionView: boolean;
    seed: number;
}) {
    const appearances = Array.from({length: 3}, (_, index) => getShapeAppearance(seed, index));
    const shapeName = titleCase(data.shape);

    return (
        <div className="w-[680px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.3rem] font-bold text-slate-700">
                Which larger shape category includes every {data.shape}?
            </div>
            <div className="mt-4 rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                <div className="text-center text-[1.05rem] font-extrabold text-blue-700">{shapeName}</div>
                <div className="mt-2 flex h-[106px] items-center justify-center gap-12">
                    {appearances.map((appearance, index) => (
                        <ShapeExample key={index} shape={data.shape} appearance={appearance} />
                    ))}
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {data.attributes.map(attribute => (
                        <span key={attribute} className="rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-bold text-blue-700">
                            {attribute}
                        </span>
                    ))}
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
                {data.options.map(option => {
                    const correct = option.id === data.answer;
                    return (
                        <div
                            key={option.id}
                            className={`rounded-lg border-2 px-4 py-3 text-center font-semibold ${
                                isSolutionView && correct
                                    ? 'border-green-600 bg-green-50 text-green-700'
                                    : 'border-slate-200 bg-white text-slate-700'
                            }`}
                        >
                            <span className="mr-2 font-bold text-slate-500">{option.id}</span>
                            {titleCase(option.category)}
                        </div>
                    );
                })}
            </div>
            <div className={`mt-4 min-h-[52px] rounded-lg px-4 py-3 text-center font-bold ${
                isSolutionView ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-600'
            }`}>
                {isSolutionView
                    ? `A ${data.shape} is a quadrilateral because it has 4 straight sides.`
                    : `Use the shared attribute: 4 straight sides.`}
            </div>
        </div>
    );
}

const VERTICES: Readonly<Record<string, readonly [number, number][]>> = {
    triangle: [[50, 10], [90, 88], [10, 88]],
    quadrilateral: [[18, 18], [87, 12], [75, 88], [10, 72]],
    pentagon: [[50, 8], [90, 38], [75, 88], [25, 88], [10, 38]],
    hexagon: [[50, 8], [87, 29], [87, 71], [50, 92], [13, 71], [13, 29]]
};

function angleArcPath(
    vertex: readonly [number, number],
    previous: readonly [number, number],
    next: readonly [number, number]
): string {
    const pointOnRay = (end: readonly [number, number]) => {
        const dx = end[0] - vertex[0];
        const dy = end[1] - vertex[1];
        const length = Math.hypot(dx, dy);
        return [vertex[0] + dx / length * 14, vertex[1] + dy / length * 14] as const;
    };
    const start = pointOnRay(previous);
    const end = pointOnRay(next);
    return `M ${start[0]} ${start[1]} Q ${vertex[0]} ${vertex[1]} ${end[0]} ${end[1]}`;
}

function PolygonCountShape({
    shape,
    attribute
}: {
    shape: ShapeCountOption['shape'];
    attribute: Extract<ShapeCountAttribute, 'vertices' | 'angles'>;
}) {
    const vertices = VERTICES[shape];
    if (!vertices) {
        throw new ViewValidationError('shape-classify-attributes', `Unsupported polygon-count shape: ${shape}`);
    }
    const points = vertices.map(([x, y]) => `${x},${y}`).join(' ');
    return (
        <svg width="82" height="82" viewBox="0 0 100 100" aria-label={`Polygon with countable ${attribute}`}>
            <polygon points={points} fill="#dbeafe" stroke="#2563eb" strokeWidth="4" />
            {attribute === 'vertices'
                ? vertices.map(([x, y], index) => (
                    <circle key={index} cx={x} cy={y} r="5" fill="#f43f5e" stroke="#9f1239" strokeWidth="1.5" />
                ))
                : vertices.map((vertex, index) => (
                    <path
                        key={index}
                        d={angleArcPath(
                            vertex,
                            vertices[(index - 1 + vertices.length) % vertices.length],
                            vertices[(index + 1) % vertices.length]
                        )}
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                ))}
        </svg>
    );
}

function FaceNet({shape}: {shape: ShapeCountOption['shape']}) {
    const common = {fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 2};
    return (
        <svg width="108" height="82" viewBox="0 0 120 90" aria-label={`${shape} face net`}>
            {shape === 'cube' && (
                <>
                    <rect x="41" y="3" width="19" height="19" {...common} />
                    <rect x="41" y="22" width="19" height="19" {...common} />
                    <rect x="22" y="41" width="19" height="19" {...common} />
                    <rect x="41" y="41" width="19" height="19" {...common} />
                    <rect x="60" y="41" width="19" height="19" {...common} />
                    <rect x="41" y="60" width="19" height="19" {...common} />
                </>
            )}
            {shape === 'rectangular-prism' && (
                <>
                    <rect x="39" y="3" width="25" height="14" {...common} />
                    <rect x="39" y="17" width="25" height="19" {...common} />
                    <rect x="20" y="36" width="19" height="25" {...common} />
                    <rect x="39" y="36" width="25" height="25" {...common} />
                    <rect x="64" y="36" width="19" height="25" {...common} />
                    <rect x="39" y="61" width="25" height="14" {...common} />
                </>
            )}
            {shape === 'triangular-prism' && (
                <>
                    <rect x="22" y="29" width="25" height="30" {...common} />
                    <rect x="47" y="29" width="25" height="30" {...common} />
                    <rect x="72" y="29" width="25" height="30" {...common} />
                    <polygon points="22,29 47,29 34.5,8" {...common} />
                    <polygon points="72,59 97,59 84.5,81" {...common} />
                </>
            )}
            {shape === 'square-pyramid' && (
                <>
                    <rect x="42" y="31" width="34" height="34" {...common} />
                    <polygon points="42,31 76,31 59,5" {...common} />
                    <polygon points="76,31 76,65 105,48" {...common} />
                    <polygon points="42,65 76,65 59,87" {...common} />
                    <polygon points="42,31 42,65 13,48" {...common} />
                </>
            )}
        </svg>
    );
}

function countOptionName(shape: ShapeCountOption['shape']): string {
    return shape.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}

function validateCountClassificationProblem(data: Extract<ShapeAttributeClassificationProblem, {task: 'classify-count'}>) {
    if (!Array.isArray(data.options) || data.options.length !== 4) {
        throw new ViewValidationError('shape-classify-attributes', 'Exactly four shape options are required.');
    }
    const ids = new Set(data.options.map(option => option.id));
    const satisfying = data.options.filter(option => option.satisfies);
    if (ids.size !== 4 || satisfying.length !== 1 || satisfying[0].id !== data.answer) {
        throw new ViewValidationError('shape-classify-attributes', 'The answer must identify one satisfying shape.');
    }
    if (
        (data.attribute === 'vertices' || data.attribute === 'angles')
        && data.options.some(option => !VERTICES[option.shape])
    ) {
        throw new ViewValidationError('shape-classify-attributes', 'Polygon-count options must be supported polygons.');
    }
    if (!countClassificationMatchesRenderedPolygons(
        data,
        shape => VERTICES[shape]?.length ?? null
    )) {
        throw new ViewValidationError(
            'shape-classify-attributes',
            'Each polygon count and membership must match the rendered shape.'
        );
    }
}

function CountClassificationLayout({
    data,
    isSolutionView
}: {
    data: Extract<ShapeAttributeClassificationProblem, {task: 'classify-count'}>;
    isSolutionView: boolean;
}) {
    const prompt = data.attribute === 'vertices'
        ? `Which shape has ${data.requiredCount} vertices?`
        : data.attribute === 'angles'
            ? `Which shape has ${data.requiredCount} angles?`
        : `Which shape has ${data.requiredCount} equal faces?`;

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit mx-auto font-sans">
            <div className="flex flex-col items-center w-[520px]">
                <div className="h-[58px] flex items-start justify-center text-[1.3rem] font-bold text-slate-700 text-center leading-normal">
                    {prompt}
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                    {data.options.map(option => {
                        const isCorrect = option.id === data.answer;
                        const solutionClass = isSolutionView && isCorrect
                            ? 'border-green-600 bg-green-50 shadow-[0_0_10px_rgba(22,163,74,0.2)]'
                            : 'border-slate-200 bg-white';
                        return (
                            <div
                                key={option.id}
                                className={`relative h-[164px] border-2 rounded-xl flex flex-col items-center justify-center gap-1 ${solutionClass}`}
                            >
                                <div className="absolute left-3 top-3 flex size-7 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                                    {option.id}
                                </div>
                                {data.attribute === 'vertices' || data.attribute === 'angles'
                                    ? <PolygonCountShape shape={option.shape} attribute={data.attribute} />
                                    : <FaceNet shape={option.shape} />}
                                <div className="text-[0.9rem] font-semibold text-slate-700">
                                    {countOptionName(option.shape)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function validateClassificationProblem(
    data: Extract<ShapeAttributeClassificationProblem, {task?: undefined}>
) {
    if (!SUPPORTED_SHAPES.includes(data.shape)) {
        throw new ViewValidationError('shape-classify-attributes', `Unsupported shape: ${data.shape}`);
    }
    if (!Array.isArray(data.options) || data.options.length !== 4) {
        throw new ViewValidationError('shape-classify-attributes', 'Exactly four attribute options are required.');
    }
    const ids = new Set(data.options.map(option => option.id));
    if (ids.size !== 4 || data.options.some(option => option.text.trim().length === 0)) {
        throw new ViewValidationError('shape-classify-attributes', 'Attribute options must have unique IDs and non-empty text.');
    }
    const definingOptions = data.options.filter(option => option.kind === 'defining');
    if (definingOptions.length !== 1 || definingOptions[0].id !== data.answer) {
        throw new ViewValidationError('shape-classify-attributes', 'The answer must identify the single defining option.');
    }
}

interface CoreProps {
    config: ShapeClassifyAttributesViewConfig;
    payload: ViewRenderPayload<'shape-classify-attributes'>;
}

const ShapeClassifyAttributesCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView, seed} = payload;
    const data = problem.data;

    if (data.task === 'classify-line-relation'
        || data.task === 'classify-angle-size'
        || data.task === 'classify-right-triangle-category') {
        const requiredFields = [
            'task',
            'prompt',
            'positiveLabel',
            'negativeLabel',
            'options',
            'answerIds',
            'answerStatement',
            'explanation'
        ];
        validateProblemData('shape-classify-attributes', data, data.task === 'classify-right-triangle-category'
            ? [...requiredFields, 'attributes', 'category', 'categoryStatement']
            : [...requiredFields, 'criterion']);
        if (!isValidGrade4ShapeClassificationProblem(data, config.visualRecognition)) {
            throw new ViewValidationError(
                'shape-classify-attributes',
                'Grade 4 classification geometry, evidence, membership, and prose must agree.'
            );
        }
        return <Grade4ClassificationLayout data={data} isSolutionView={isSolutionView} />;
    }

    if (data.task === 'classify-quadrilateral-subcategory') {
        validateProblemData('shape-classify-attributes', data, [
            'task',
            'shape',
            'attributes',
            'category',
            'options',
            'answer'
        ]);
        validateSubsumptionProblem(data);
        return (
            <ShapeSubsumptionLayout
                data={data}
                isSolutionView={isSolutionView}
                seed={seed}
            />
        );
    }

    if (data.task === 'classify-count') {
        validateProblemData('shape-classify-attributes', data, [
            'task',
            'attribute',
            'requiredCount',
            'options',
            'answer'
        ]);
        validateCountClassificationProblem(data);
        return <CountClassificationLayout data={data} isSolutionView={isSolutionView} />;
    }

    if (!('shape' in data)) {
        throw new ViewValidationError('shape-classify-attributes', 'A defining-attribute problem requires a shape.');
    }
    validateProblemData('shape-classify-attributes', data, ['shape', 'definition', 'options', 'answer']);
    validateClassificationProblem(data);

    const appearances = Array.from({length: 4}, (_, index) => getShapeAppearance(seed, index));

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit mx-auto font-sans">
            <div className="flex flex-col items-center w-[520px]">
                <div className="h-[58px] flex items-start justify-center text-[1.3rem] font-bold text-slate-700 text-center leading-normal">
                    {!isSolutionView && 'Which statement always describes this shape?'}
                </div>

                <div className="flex justify-around items-center w-[460px] h-[132px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[22px] px-[18px] box-border">
                    {appearances.map((appearance, index) => (
                        <div key={index} className="flex items-center justify-center w-[90px] h-[96px]">
                            <ShapeExample shape={data.shape} appearance={appearance} />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                    {data.options.map(option => {
                        const isCorrect = option.id === data.answer;
                        const solutionClass = isSolutionView && isCorrect
                            ? 'border-green-600 bg-green-50 text-green-700 font-bold shadow-[0_0_10px_rgba(22,163,74,0.2)]'
                            : 'border-slate-200 bg-white text-slate-700';
                        return (
                            <div
                                key={option.id}
                                className={`min-h-[68px] py-3 px-4 border-2 rounded-lg flex items-center gap-3 text-[0.98rem] leading-snug ${solutionClass}`}
                            >
                                <span className="font-bold text-slate-500">{option.id}</span>
                                <span>{option.text}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const ShapeClassifyAttributes = withConfig(
    ShapeClassifyAttributesViewSchema,
    ShapeClassifyAttributesCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-classify-attributes'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeClassifyAttributes payload={payload} />);
    }
};
