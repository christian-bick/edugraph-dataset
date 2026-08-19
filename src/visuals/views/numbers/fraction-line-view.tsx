import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {
    FractionNumberLineStep,
    ProperFractionEquivalenceProblem,
    TenthsToHundredthsProblem,
    WholeNumberFractionEquivalenceProblem
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {isValidTenthsToHundredthsProblem} from '../fractions/tenths-hundredths-grid.tsx';

const VIEW_ID = 'numbers-fraction-line';
const LEFT = 54;
const RIGHT = 786;
const AXIS_Y = 158;
const DENOMINATORS = [2, 3, 4, 6, 8];

export type FractionLineMode = 'articulation' | 'classification' | 'formalization' | 'explanation';

interface FractionLineViewProps {
    mode: FractionLineMode;
    payload: ViewRenderPayload<
        | 'numbers-fraction-line'
        | 'numbers-fraction-line-classification'
        | 'numbers-fraction-line-formalization'
        | 'numbers-fraction-line-explanation'
    >;
}

const TenthsHundredthsEquivalenceLine = ({
    data,
    isSolutionView,
    explainScaling
}: {
    data: TenthsToHundredthsProblem;
    isSolutionView: boolean;
    explainScaling: boolean;
}) => {
    const toX = (hundredths: number) => LEFT + hundredths / 100 * (RIGHT - LEFT);
    const pointX = toX(data.hundredths.numerator);
    const scaledPointLabel = isSolutionView
        ? data.hundredths.notation
        : '?/100';
    const hundredthTicks = Array.from({length: 101}, (_, index) => index);
    const scalingEquation = `${data.tenths.notation} = (${data.tenths.numerator} × 10)/(10 × 10) = ${data.hundredths.notation}`;
    const explanation = `Multiplying the numerator and denominator of ${data.tenths.notation} by 10 creates 10 times as many equal parts without changing the point, so ${data.hundredths.notation} has the same value.`;

    return (
        <div className="w-[900px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.42rem] font-bold text-slate-800">
                {explainScaling
                    ? 'Scale both the numerator and denominator by 10.'
                    : 'Complete the equivalent fraction.'}
            </div>
            <div className="mt-2 text-center text-[1.08rem] font-semibold text-slate-600">
                Complete <span className="font-extrabold text-blue-700">{data.tenths.notation} = ?/100</span> on one shared 0–1 scale{explainScaling ? ' and explain why the point stays fixed' : ''}.
            </div>

            <svg
                viewBox="0 0 840 310"
                className="mt-1 h-[310px] w-full"
                role="img"
                aria-label={isSolutionView
                    ? `${data.tenths.notation} and ${data.hundredths.notation} occupy the same point on one zero-to-one number line with refined equal partitions`
                    : `${data.tenths.notation} and an unknown scaled numerator occupy the same point on one zero-to-one number line; the scale factor is 10`}
            >
                <text x={LEFT} y="49" className="fill-blue-700 text-[15px] font-bold">
                    10 original equal parts
                </text>
                <text x={LEFT} y="268" className="fill-emerald-700 text-[15px] font-bold">
                    100 smaller equal parts
                </text>

                <line x1={LEFT} y1={AXIS_Y} x2={RIGHT} y2={AXIS_Y} stroke="#334155" strokeWidth="4" />

                {hundredthTicks.filter(index => index % 10 === 0).map(index => {
                    const x = toX(index);
                    const isEndpoint = index === 0 || index === 100;
                    return (
                        <g key={`tenths-${index}`}>
                            <line
                                x1={x}
                                y1={AXIS_Y - (isEndpoint ? 31 : 25)}
                                x2={x}
                                y2={AXIS_Y - 3}
                                stroke="#2563eb"
                                strokeWidth={isEndpoint ? 3 : 2.5}
                            />
                            {isEndpoint && (
                                <text x={x} y={AXIS_Y - 42} textAnchor="middle" className="fill-slate-700 text-[17px] font-bold">
                                    {index / 100}
                                </text>
                            )}
                        </g>
                    );
                })}

                {hundredthTicks.map(index => {
                    const x = toX(index);
                    const isOriginalBoundary = index % 10 === 0;
                    const isEndpoint = index === 0 || index === 100;
                    return (
                        <g key={`hundredths-${index}`}>
                            <line
                                x1={x}
                                y1={AXIS_Y + 3}
                                x2={x}
                                y2={AXIS_Y + (isEndpoint ? 31 : isOriginalBoundary ? 25 : 17)}
                                stroke={isOriginalBoundary ? '#059669' : '#64748b'}
                                strokeWidth={isEndpoint ? 3 : isOriginalBoundary ? 2.5 : 1.5}
                            />
                            {isEndpoint && (
                                <text x={x} y={AXIS_Y + 51} textAnchor="middle" className="fill-slate-700 text-[17px] font-bold">
                                    {index / 100}
                                </text>
                            )}
                        </g>
                    );
                })}

                <line
                    x1={pointX}
                    y1="64"
                    x2={pointX}
                    y2="245"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="6 5"
                />
                <circle cx={pointX} cy={AXIS_Y} r="13" fill="#dbeafe" stroke="#2563eb" strokeWidth="4" />
                <circle cx={pointX} cy={AXIS_Y} r="6" fill="#059669" />
                <text x={pointX - 14} y="82" textAnchor="end" className="fill-blue-700 text-[20px] font-bold">
                    {data.tenths.notation}
                </text>
                <text x={pointX + 14} y="82" textAnchor="start" className="fill-emerald-700 text-[20px] font-bold">
                    {scaledPointLabel}
                </text>
                <text x={pointX} y="238" textAnchor="middle" className="fill-slate-600 text-[15px] font-semibold">
                    same point
                </text>
            </svg>

            {explainScaling && (
                <div className="flex items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-[0.92rem] font-bold text-blue-800">
                    <span>{data.numeratorScale.from} × 10 = {isSolutionView ? data.numeratorScale.result : '?'}</span>
                    <span className="text-blue-300">•</span>
                    <span>{data.denominatorScale.equation}</span>
                </div>
            )}

            <div className={`mt-4 rounded-xl border-2 px-5 py-4 text-center ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView ? (
                    <>
                        {explainScaling && (
                            <div className="text-[1.08rem] font-extrabold">{scalingEquation}</div>
                        )}
                        <div className={`${explainScaling ? 'mt-2' : ''} text-[0.95rem] font-bold`}>{data.equation}.</div>
                        {explainScaling && (
                            <div className="mt-1 text-[0.88rem] font-semibold leading-snug text-slate-700">{explanation}</div>
                        )}
                    </>
                ) : (
                    <div className="text-[1.05rem] font-bold">{data.tenths.notation} = ?/100</div>
                )}
            </div>
        </div>
    );
};

const validateSteps = (steps: FractionNumberLineStep[], numerator: number) => {
    if (steps.length !== numerator) {
        throw new ViewValidationError(VIEW_ID, 'The explicit unit-fraction steps must reach the target numerator.');
    }

    steps.forEach((step, index) => {
        if (!Number.isInteger(step.fromNumerator)
            || !Number.isInteger(step.toNumerator)
            || step.fromNumerator !== index
            || step.toNumerator !== index + 1) {
            throw new ViewValidationError(VIEW_ID, 'Unit-fraction steps must be consecutive from zero to the target.');
        }
    });
};

const validateWholeFractionProblem = (data: WholeNumberFractionEquivalenceProblem) => {
    validateProblemData(VIEW_ID, data, [
        'task',
        'wholeNumber',
        'fraction',
        'relation',
        'equation'
    ]);

    const fraction = data.fraction;
    const coherent = data.task === 'represent-whole-as-fraction'
        && Number.isInteger(data.wholeNumber)
        && data.wholeNumber >= 1
        && data.wholeNumber <= 3
        && fraction
        && typeof fraction === 'object'
        && Number.isInteger(fraction.numerator)
        && Number.isInteger(fraction.denominator)
        && DENOMINATORS.includes(fraction.denominator)
        && fraction.numerator === data.wholeNumber * fraction.denominator
        && fraction.notation === `${fraction.numerator}/${fraction.denominator}`
        && data.relation === 'equal'
        && data.equation === `${data.wholeNumber} = ${fraction.notation}`;
    if (!coherent) {
        throw new ViewValidationError(VIEW_ID, 'Whole-number and fraction data must describe one coherent equality.');
    }
};

const WholeFractionEquivalenceLine = ({
    data,
    isSolutionView
}: {
    data: WholeNumberFractionEquivalenceProblem;
    isSolutionView: boolean;
}) => {
    validateWholeFractionProblem(data);

    const subdivisionCount = data.wholeNumber * data.fraction.denominator;
    const ticks = Array.from({length: subdivisionCount + 1}, (_, index) => index);
    const toX = (numeratorUnits: number) => LEFT
        + (numeratorUnits / subdivisionCount) * (RIGHT - LEFT);
    const endpointX = toX(data.fraction.numerator);
    const displayedFraction = isSolutionView
        ? data.fraction.notation
        : `?/${data.fraction.denominator}`;
    const groupWord = data.wholeNumber === 1 ? 'group' : 'groups';
    const explanation = `${data.fraction.notation} contains ${data.wholeNumber} ${groupWord} of ${data.fraction.denominator}/${data.fraction.denominator}, so it equals ${data.wholeNumber}.`;

    return (
        <div className="w-[900px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.45rem] font-bold text-slate-800">
                Complete {data.wholeNumber} = ?/{data.fraction.denominator}. Use the number line.
            </div>

            <svg
                viewBox="0 0 840 285"
                className="mt-2 h-[285px] w-full"
                role="img"
                aria-label={`Whole number ${data.wholeNumber} and an equal fraction at one point on a number line`}
            >
                <line x1={LEFT} y1={AXIS_Y} x2={RIGHT} y2={AXIS_Y} stroke="#334155" strokeWidth="4" />
                {ticks.map(index => {
                    const x = toX(index);
                    const isWhole = index % data.fraction.denominator === 0;
                    return (
                        <g key={index}>
                            <line
                                x1={x}
                                y1={AXIS_Y - (isWhole ? 16 : 9)}
                                x2={x}
                                y2={AXIS_Y + (isWhole ? 16 : 9)}
                                stroke="#334155"
                                strokeWidth={isWhole ? 3 : 2}
                            />
                            {isWhole && (
                                <text
                                    x={x}
                                    y={AXIS_Y + 43}
                                    textAnchor="middle"
                                    className="fill-slate-700 text-[18px] font-bold"
                                >
                                    {index / data.fraction.denominator}
                                </text>
                            )}
                        </g>
                    );
                })}

                <line
                    x1={endpointX}
                    y1={60}
                    x2={endpointX}
                    y2={AXIS_Y + 58}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="6 5"
                />
                <circle cx={endpointX} cy={AXIS_Y} r="13" fill="#dbeafe" stroke="#2563eb" strokeWidth="4" />
                <circle cx={endpointX} cy={AXIS_Y} r="6" fill="#059669" />
                <text x={endpointX - 14} y={80} textAnchor="end" className="fill-blue-700 text-[21px] font-bold">
                    {data.wholeNumber}
                </text>
                <text x={endpointX + 14} y={80} textAnchor="start" className="fill-emerald-700 text-[21px] font-bold">
                    {displayedFraction}
                </text>
                <text x={endpointX} y={AXIS_Y + 76} textAnchor="middle" className="fill-slate-600 text-[15px] font-semibold">
                    same point
                </text>
            </svg>

            <div className={`rounded-xl border-2 px-5 py-4 text-center text-lg font-semibold ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView
                    ? `${data.equation}. ${explanation}`
                    : `Count the 1/${data.fraction.denominator} steps from 0 to ${data.wholeNumber}.`}
            </div>
        </div>
    );
};

const validateEquivalenceProblem = (data: ProperFractionEquivalenceProblem) => {
    validateProblemData(VIEW_ID, data, [
        'task',
        'first',
        'second',
        'scaleFactor',
        'relation',
        'equation'
    ]);

    const fractions = [data.first, data.second];
    const validFractions = fractions.every(fraction =>
        Number.isInteger(fraction.numerator)
        && fraction.numerator > 0
        && Number.isInteger(fraction.denominator)
        && DENOMINATORS.includes(fraction.denominator)
        && fraction.numerator < fraction.denominator
        && fraction.notation === `${fraction.numerator}/${fraction.denominator}`
    );
    const coherent = validFractions
        && data.task === 'relate-equivalent-fractions'
        && (data.scaleFactor === 2 || data.scaleFactor === 3 || data.scaleFactor === 4)
        && data.second.numerator === data.first.numerator * data.scaleFactor
        && data.second.denominator === data.first.denominator * data.scaleFactor
        && data.relation === 'equal'
        && data.equation === `${data.first.notation} = ${data.second.notation}`;
    if (!coherent) {
        throw new ViewValidationError(VIEW_ID, 'Equivalent fractions must describe one coherent scaling relation.');
    }
};

const FractionEquivalenceLine = ({
    data,
    isSolutionView,
    isClassification,
    explainScaling
}: {
    data: ProperFractionEquivalenceProblem;
    isSolutionView: boolean;
    isClassification: boolean;
    explainScaling: boolean;
}) => {
    validateEquivalenceProblem(data);

    const ticks = Array.from({length: data.second.denominator + 1}, (_, index) => index);
    const toX = (numeratorUnits: number) => LEFT
        + (numeratorUnits / data.second.denominator) * (RIGHT - LEFT);
    const endpointUnits = data.second.numerator;
    const endpointX = toX(endpointUnits);
    const unknownNotation = `?/${data.second.denominator}`;
    const secondNotation = !isClassification && !isSolutionView
        ? unknownNotation
        : data.second.notation;
    const prompt = isClassification
        ? `Do ${data.first.notation} and ${data.second.notation} locate the same point?`
        : explainScaling
            ? `Complete ${data.first.notation} = ${unknownNotation}. Use the number line to explain why the value stays the same.`
            : `Complete ${data.first.notation} = ${unknownNotation}. Use the number line.`;
    const explanation = `${data.first.notation} and ${data.second.notation} locate the same point because both fraction terms are multiplied by ${data.scaleFactor}.`;

    return (
        <div className="w-[900px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.45rem] font-bold text-slate-800">{prompt}</div>

            <svg
                viewBox="0 0 840 285"
                className="mt-2 h-[285px] w-full"
                role="img"
                aria-label="Equivalent fractions at one point on a number line from zero to one"
            >
                <line x1={LEFT} y1={AXIS_Y} x2={RIGHT} y2={AXIS_Y} stroke="#334155" strokeWidth="4" />
                {ticks.map(index => {
                    const x = toX(index);
                    const isWhole = index === 0 || index === data.second.denominator;
                    return (
                        <g key={index}>
                            <line
                                x1={x}
                                y1={AXIS_Y - (isWhole ? 16 : 10)}
                                x2={x}
                                y2={AXIS_Y + (isWhole ? 16 : 10)}
                                stroke="#334155"
                                strokeWidth={isWhole ? 3 : 2}
                            />
                            {isWhole && (
                                <text x={x} y={AXIS_Y + 43} textAnchor="middle" className="fill-slate-700 text-[18px] font-bold">
                                    {index === 0 ? 0 : 1}
                                </text>
                            )}
                        </g>
                    );
                })}

                <line
                    x1={endpointX}
                    y1={62}
                    x2={endpointX}
                    y2={AXIS_Y + 58}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="6 5"
                />
                <circle cx={endpointX} cy={AXIS_Y} r="13" fill="#dbeafe" stroke="#2563eb" strokeWidth="4" />
                <circle cx={endpointX} cy={AXIS_Y} r="6" fill="#059669" />
                <text x={endpointX - 14} y={82} textAnchor="end" className="fill-blue-700 text-[20px] font-bold">
                    {data.first.notation}
                </text>
                <text x={endpointX + 14} y={82} textAnchor="start" className="fill-emerald-700 text-[20px] font-bold">
                    {secondNotation}
                </text>
                <text x={endpointX} y={AXIS_Y + 76} textAnchor="middle" className="fill-slate-600 text-[15px] font-semibold">
                    same point
                </text>
            </svg>

            <div className={`rounded-xl border-2 px-5 py-4 text-center text-lg font-semibold ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView
                    ? isClassification
                        ? `${data.equation}. The fractions are equivalent.`
                        : explainScaling
                            ? `${data.equation}. ${explanation}`
                            : data.equation
                    : isClassification
                        ? 'Equivalent or not equivalent?'
                        : `Count the equal parts to complete ${data.first.notation} = ${unknownNotation}.`}
            </div>
        </div>
    );
};

export const FractionLineView = ({mode, payload}: FractionLineViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, ['task']);
    if (data.task === 'tenths-to-hundredths') {
        validateProblemData(VIEW_ID, data, [
            'task',
            'tenths',
            'hundredths',
            'scaleFactor',
            'sharedWhole',
            'numeratorScale',
            'denominatorScale',
            'models',
            'relation',
            'equation'
        ]);
        const formalizationOnly = mode === 'formalization';
        const explainsProcedure = mode === 'explanation';
        if ((!formalizationOnly && !explainsProcedure)
            || !isValidTenthsToHundredthsProblem(data)) {
            throw new ViewValidationError(VIEW_ID, 'Grade 4 scaling requires Formalization, optionally with ProcedureUnderstanding, and one coherent shared-scale model.');
        }
        return (
            <TenthsHundredthsEquivalenceLine
                data={data}
                isSolutionView={isSolutionView}
                explainScaling={explainsProcedure}
            />
        );
    }
    if (data.task === 'represent-whole-as-fraction') {
        if (mode !== 'formalization') {
            throw new ViewValidationError(VIEW_ID, 'Whole-number equivalence requires Formalization.');
        }
        return <WholeFractionEquivalenceLine data={data} isSolutionView={isSolutionView} />;
    }
    if (data.task === 'relate-equivalent-fractions') {
        const isClassification = mode === 'classification';
        const formalizationOnly = mode === 'formalization';
        const explainsProcedure = mode === 'explanation';
        const requestsCompletion = formalizationOnly || explainsProcedure;
        if (!isClassification && !requestsCompletion) {
            throw new ViewValidationError(VIEW_ID, 'Proper-fraction equivalence requires classification or formalization, optionally with procedural explanation.');
        }
        return (
            <FractionEquivalenceLine
                data={data}
                isSolutionView={isSolutionView}
                isClassification={isClassification}
                explainScaling={explainsProcedure}
            />
        );
    }
    validateProblemData(VIEW_ID, data, [
        'task',
        'numerator',
        'denominator',
        'unitFraction',
        'targetFraction',
        'wholeCount',
        'steps',
        'answer'
    ]);

    if (data.task !== 'locate-fraction') {
        throw new ViewValidationError(VIEW_ID, 'Expected a fraction-location task.');
    }
    if (mode !== 'articulation') {
        throw new ViewValidationError(VIEW_ID, 'Fraction-location tasks require visual articulation.');
    }
    if (!Number.isInteger(data.numerator) || data.numerator < 1 || data.numerator > 15) {
        throw new ViewValidationError(VIEW_ID, 'The numerator must be an integer from 1 through 15.');
    }
    if (!Number.isInteger(data.denominator) || !DENOMINATORS.includes(data.denominator)) {
        throw new ViewValidationError(VIEW_ID, 'The denominator must be 2, 3, 4, 6, or 8.');
    }
    if ((data.wholeCount !== 1 && data.wholeCount !== 2)
        || data.wholeCount !== Math.ceil(data.numerator / data.denominator)) {
        throw new ViewValidationError(VIEW_ID, 'The number-line extent must end at the whole containing the target.');
    }
    if (data.unitFraction !== `1/${data.denominator}`
        || data.targetFraction !== `${data.numerator}/${data.denominator}`
        || data.answer !== data.targetFraction) {
        throw new ViewValidationError(VIEW_ID, 'Fraction labels and answer must agree with the numerator and denominator.');
    }
    validateSteps(data.steps, data.numerator);

    const subdivisionCount = data.denominator * data.wholeCount;
    const toX = (numeratorUnits: number) => LEFT
        + (numeratorUnits / subdivisionCount) * (RIGHT - LEFT);
    const subdivisionTicks = Array.from({length: subdivisionCount + 1}, (_, index) => index);
    const wholeTicks = Array.from({length: data.wholeCount + 1}, (_, index) => index);
    const endpointX = toX(data.numerator);

    return (
        <div className="w-[900px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.45rem] font-bold text-slate-800">
                Partition each whole into {data.denominator} equal parts. Then locate{' '}
                <span className="text-blue-700">{data.targetFraction}</span>.
            </div>

            <svg
                viewBox="0 0 840 270"
                className="mt-2 h-[270px] w-full"
                role="img"
                aria-label={`Number line from zero through ${data.wholeCount}`}
            >
                <defs>
                    <marker
                        id="fraction-step-arrow"
                        markerWidth="6"
                        markerHeight="6"
                        refX="5"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path d="M 0 0 L 6 3 L 0 6 z" fill="#2563eb" />
                    </marker>
                </defs>

                {isSolutionView && (
                    <line
                        x1={LEFT}
                        y1={AXIS_Y}
                        x2={endpointX}
                        y2={AXIS_Y}
                        stroke="#bfdbfe"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                )}
                <line x1={LEFT} y1={AXIS_Y} x2={RIGHT} y2={AXIS_Y} stroke="#334155" strokeWidth="4" />

                {(isSolutionView ? subdivisionTicks : wholeTicks.map(value => value * data.denominator)).map(index => {
                    const x = toX(index);
                    const isWhole = index % data.denominator === 0;
                    return (
                        <g key={index}>
                            <line
                                x1={x}
                                y1={AXIS_Y - (isWhole ? 16 : 10)}
                                x2={x}
                                y2={AXIS_Y + (isWhole ? 16 : 10)}
                                stroke="#334155"
                                strokeWidth={isWhole ? 3 : 2}
                            />
                            {isWhole && (
                                <text
                                    x={x}
                                    y={AXIS_Y + 43}
                                    textAnchor="middle"
                                    className="fill-slate-700 text-[18px] font-bold"
                                >
                                    {index / data.denominator}
                                </text>
                            )}
                        </g>
                    );
                })}

                {isSolutionView && data.steps.map((step, index) => {
                    const fromX = toX(step.fromNumerator);
                    const toStepX = toX(step.toNumerator);
                    const arcTop = AXIS_Y - 42 - (index % 2) * 8;
                    return (
                        <path
                            key={`${step.fromNumerator}-${step.toNumerator}`}
                            d={`M ${fromX + 2} ${AXIS_Y - 13} Q ${(fromX + toStepX) / 2} ${arcTop} ${toStepX - 3} ${AXIS_Y - 13}`}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="2.5"
                            markerEnd="url(#fraction-step-arrow)"
                        />
                    );
                })}

                {isSolutionView && (
                    <>
                        <text
                            x={(toX(0) + toX(1)) / 2}
                            y={AXIS_Y - 61}
                            textAnchor="middle"
                            className="fill-blue-700 text-[15px] font-bold"
                        >
                            {data.unitFraction} each step
                        </text>
                        <circle cx={endpointX} cy={AXIS_Y} r="10" fill="#059669" stroke="white" strokeWidth="3" />
                        <text
                            x={endpointX}
                            y={AXIS_Y - 72}
                            textAnchor="middle"
                            className="fill-emerald-700 text-[20px] font-bold"
                        >
                            {data.targetFraction}
                        </text>
                    </>
                )}
            </svg>

            <div className={`rounded-xl border-2 px-5 py-4 text-center text-lg font-semibold ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView
                    ? `Start at 0. Make ${data.numerator} equal steps of ${data.unitFraction}. The endpoint is ${data.answer}.`
                    : `Draw the equal partitions and mark ${data.targetFraction}.`}
            </div>
        </div>
    );
};
