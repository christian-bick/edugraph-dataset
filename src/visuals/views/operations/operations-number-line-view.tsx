import {createElement, Fragment, ReactNode} from 'react';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {ArithmeticPairProblem, WritingProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

const WIDTH = 760;
const HEIGHT = 210;
const LEFT = 48;
const RIGHT = 712;
const AXIS_Y = 122;

export type OperationsNumberLineMode = 'representation' | 'arithmetic';
export type OperationsNumberLineViewId =
    | 'operations-number-line-representation'
    | 'operations-number-line-arithmetic';

interface Props {
    mode: OperationsNumberLineMode;
    payload: ViewRenderPayload<OperationsNumberLineViewId>;
    viewId: OperationsNumberLineViewId;
}

const isWritingProblem = (
    data: WritingProblem | ArithmeticPairProblem
): data is WritingProblem => 'number' in data;

const roundedMaximum = (largestValue: number) =>
    Math.max(10, Math.ceil(largestValue / 10) * 10);

const validateRepresentation = (
    data: WritingProblem | ArithmeticPairProblem,
    viewId: OperationsNumberLineViewId
): WritingProblem => {
    if (!isWritingProblem(data)) {
        throw new ViewValidationError(viewId, 'Representation requires a writing payload.');
    }
    validateProblemData(viewId, data, ['number']);
    if (!Number.isInteger(data.number) || data.number < 0 || data.number > 100) {
        throw new ViewValidationError(
            viewId,
            'The represented number must be an integer from 0 through 100.'
        );
    }
    return data;
};

const validateArithmetic = (
    data: WritingProblem | ArithmeticPairProblem,
    viewId: OperationsNumberLineViewId
): ArithmeticPairProblem => {
    if (isWritingProblem(data)) {
        throw new ViewValidationError(viewId, 'Arithmetic requires an arithmetic-pair payload.');
    }
    validateProblemData(viewId, data, ['num1', 'num2', 'answer', 'operation']);
    if (data.operation !== 'addition' && data.operation !== 'subtraction') {
        throw new ViewValidationError(viewId, `Unsupported operation: ${data.operation}`);
    }
    const expected = data.operation === 'addition'
        ? data.num1 + data.num2
        : data.num1 - data.num2;
    if (
        [data.num1, data.num2, data.answer].some(value =>
            !Number.isInteger(value) || value < 0 || value > 100
        ) || data.answer !== expected
    ) {
        throw new ViewValidationError(
            viewId,
            'Operands and answer must be coherent integers from 0 through 100.'
        );
    }
    return data;
};

export const OperationsNumberLineView = ({mode, payload, viewId}: Props) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data as WritingProblem | ArithmeticPairProblem;
    const representation = mode === 'representation';
    const resolved = representation
        ? validateRepresentation(data, viewId)
        : validateArithmetic(data, viewId);

    const largestValue = representation
        ? (resolved as WritingProblem).number
        : Math.max(
            (resolved as ArithmeticPairProblem).num1,
            (resolved as ArithmeticPairProblem).num2,
            (resolved as ArithmeticPairProblem).answer
        );
    const maximum = roundedMaximum(largestValue);
    const toX = (value: number) => LEFT + (value / maximum) * (RIGHT - LEFT);
    const ticks = Array.from({length: 11}, (_, index) => (maximum / 10) * index);

    const writing = representation ? resolved as WritingProblem : null;
    const arithmetic = representation ? null : resolved as ArithmeticPairProblem;
    const start = writing ? 0 : arithmetic!.num1;
    const end = writing ? writing.number : arithmetic!.answer;
    const symbol = arithmetic?.operation === 'addition' ? '+' : '−';
    const prompt = writing
        ? `Mark ${writing.number} as a length from 0.`
        : `Use the number line: ${arithmetic!.num1} ${symbol} ${arithmetic!.num2} = ${isSolutionView ? arithmetic!.answer : '□'}`;
    const startX = toX(start);
    const endX = toX(end);
    const arcWidth = Math.abs(endX - startX);
    const arcHeight = Math.min(64, 24 + arcWidth * 0.18);
    const arcPath = `M ${startX} ${AXIS_Y - 10} Q ${(startX + endX) / 2} ${AXIS_Y - arcHeight} ${endX} ${AXIS_Y - 10}`;

    const tickNodes: ReactNode[] = ticks.map(value => {
        const x = toX(value);
        return createElement('g', {key: value},
            createElement('line', {
                x1: x,
                y1: AXIS_Y - 9,
                x2: x,
                y2: AXIS_Y + 9,
                stroke: '#475569',
                strokeWidth: 2
            }),
            createElement('text', {
                x,
                y: AXIS_Y + 34,
                textAnchor: 'middle',
                className: 'fill-slate-700 text-[15px] font-medium'
            }, value)
        );
    });

    return (
        <div className="w-[820px] rounded-2xl bg-white p-6 font-sans shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="mb-2 text-center text-[1.55rem] font-semibold text-slate-800">{prompt}</div>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[210px] w-full" role="img" aria-label="Number line beginning at zero">
                <defs>
                    <marker id="number-line-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                        <path d="M 0 0 L 8 4 L 0 8 z" fill="#2563eb" />
                    </marker>
                </defs>
                <line x1={LEFT} y1={AXIS_Y} x2={RIGHT} y2={AXIS_Y} stroke="#334155" strokeWidth="3" />
                {tickNodes}
                {arithmetic && (
                    <Fragment>
                        <circle cx={startX} cy={AXIS_Y} r="7" fill="#0f172a" />
                        <text x={startX} y={AXIS_Y + 58} textAnchor="middle" className="fill-slate-900 text-[16px] font-bold">start {start}</text>
                    </Fragment>
                )}
                {isSolutionView && writing && (
                    <Fragment>
                        <line x1={LEFT} y1={AXIS_Y - 2} x2={endX} y2={AXIS_Y - 2} stroke="#059669" strokeWidth="7" strokeLinecap="round" />
                        <circle cx={endX} cy={AXIS_Y} r="9" fill="#059669" />
                        <text x={endX} y={AXIS_Y - 24} textAnchor="middle" className="fill-emerald-700 text-[18px] font-bold">{writing.number}</text>
                    </Fragment>
                )}
                {isSolutionView && arithmetic && (
                    <Fragment>
                        <path d={arcPath} fill="none" stroke="#2563eb" strokeWidth="4" markerEnd="url(#number-line-arrow)" />
                        <text x={(startX + endX) / 2} y={AXIS_Y - arcHeight - 8} textAnchor="middle" className="fill-blue-700 text-[17px] font-bold">
                            {symbol}{arithmetic.num2}
                        </text>
                        <circle cx={endX} cy={AXIS_Y} r="9" fill="#059669" />
                        <text x={endX} y={AXIS_Y - 24} textAnchor="middle" className="fill-emerald-700 text-[18px] font-bold">{arithmetic.answer}</text>
                    </Fragment>
                )}
            </svg>
        </div>
    );
};
