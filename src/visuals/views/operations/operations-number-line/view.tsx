import {Ability} from 'edugraph-ts';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ArithmeticPairProblem, WritingProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumberLineViewConfig, OperationsNumberLineViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const WIDTH = 760;
const HEIGHT = 210;
const LEFT = 48;
const RIGHT = 712;
const AXIS_Y = 122;

interface CoreProps {
    config: OperationsNumberLineViewConfig;
    payload: ViewRenderPayload<'operations-number-line'>;
}

const isWritingProblem = (data: WritingProblem | ArithmeticPairProblem): data is WritingProblem =>
    'number' in data;

const roundedMaximum = (largestValue: number) => Math.max(10, Math.ceil(largestValue / 10) * 10);

const OperationsNumberLineCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    const representation = isWritingProblem(data);

    if (representation) {
        validateProblemData('operations-number-line', data, ['number']);
        if (config.responseMode !== Ability.VisualArticulation) {
            throw new ViewValidationError('operations-number-line', 'Writing payloads require visual articulation mode.');
        }
        if (!Number.isInteger(data.number) || data.number < 0 || data.number > 100) {
            throw new ViewValidationError('operations-number-line', 'The represented number must be an integer from 0 through 100.');
        }
    } else {
        validateProblemData('operations-number-line', data, ['num1', 'num2', 'answer', 'operation']);
        if (config.responseMode !== Ability.ProcedureExecution) {
            throw new ViewValidationError('operations-number-line', 'Arithmetic payloads require procedure execution mode.');
        }
        if (data.operation !== 'addition' && data.operation !== 'subtraction') {
            throw new ViewValidationError('operations-number-line', `Unsupported operation: ${data.operation}`);
        }
        const expected = data.operation === 'addition' ? data.num1 + data.num2 : data.num1 - data.num2;
        if ([data.num1, data.num2, data.answer].some(value => !Number.isInteger(value) || value < 0 || value > 100)
            || data.answer !== expected) {
            throw new ViewValidationError('operations-number-line', 'Operands and answer must be coherent integers from 0 through 100.');
        }
    }

    const largestValue = representation
        ? data.number
        : Math.max(data.num1, data.num2, data.answer);
    const maximum = roundedMaximum(largestValue);
    const toX = (value: number) => LEFT + (value / maximum) * (RIGHT - LEFT);
    const ticks = Array.from({length: 11}, (_, index) => (maximum / 10) * index);

    const start = representation ? 0 : data.num1;
    const end = representation ? data.number : data.answer;
    const symbol = representation ? '' : data.operation === 'addition' ? '+' : '−';
    const prompt = representation
        ? `Mark ${data.number} as a length from 0.`
        : `Use the number line: ${data.num1} ${symbol} ${data.num2} = ${isSolutionView ? data.answer : '□'}`;
    const startX = toX(start);
    const endX = toX(end);
    const arcWidth = Math.abs(endX - startX);
    const arcHeight = Math.min(64, 24 + arcWidth * 0.18);
    const arcPath = `M ${startX} ${AXIS_Y - 10} Q ${(startX + endX) / 2} ${AXIS_Y - arcHeight} ${endX} ${AXIS_Y - 10}`;

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
                {ticks.map(value => {
                    const x = toX(value);
                    return (
                        <g key={value}>
                            <line x1={x} y1={AXIS_Y - 9} x2={x} y2={AXIS_Y + 9} stroke="#475569" strokeWidth="2" />
                            <text x={x} y={AXIS_Y + 34} textAnchor="middle" className="fill-slate-700 text-[15px] font-medium">{value}</text>
                        </g>
                    );
                })}

                {!representation && (
                    <>
                        <circle cx={startX} cy={AXIS_Y} r="7" fill="#0f172a" />
                        <text x={startX} y={AXIS_Y + 58} textAnchor="middle" className="fill-slate-900 text-[16px] font-bold">start {start}</text>
                    </>
                )}

                {isSolutionView && representation && (
                    <>
                        <line x1={LEFT} y1={AXIS_Y - 2} x2={endX} y2={AXIS_Y - 2} stroke="#059669" strokeWidth="7" strokeLinecap="round" />
                        <circle cx={endX} cy={AXIS_Y} r="9" fill="#059669" />
                        <text x={endX} y={AXIS_Y - 24} textAnchor="middle" className="fill-emerald-700 text-[18px] font-bold">{data.number}</text>
                    </>
                )}

                {isSolutionView && !representation && (
                    <>
                        <path d={arcPath} fill="none" stroke="#2563eb" strokeWidth="4" markerEnd="url(#number-line-arrow)" />
                        <text x={(startX + endX) / 2} y={AXIS_Y - arcHeight - 8} textAnchor="middle" className="fill-blue-700 text-[17px] font-bold">
                            {symbol}{data.num2}
                        </text>
                        <circle cx={endX} cy={AXIS_Y} r="9" fill="#059669" />
                        <text x={endX} y={AXIS_Y - 24} textAnchor="middle" className="fill-emerald-700 text-[18px] font-bold">{data.answer}</text>
                    </>
                )}
            </svg>
        </div>
    );
};

export const OperationsNumberLine = withConfig(OperationsNumberLineViewSchema, OperationsNumberLineCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-number-line'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsNumberLine payload={payload} />);
    }
};
