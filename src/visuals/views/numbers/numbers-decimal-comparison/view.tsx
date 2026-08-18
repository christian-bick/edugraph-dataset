import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    DecimalComparisonOperand,
    DecimalComparisonProblem,
    TenthsHundredthsGridModel
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidDecimalComparisonProblem} from './helpers.ts';
import {
    NumbersDecimalComparisonViewConfig,
    NumbersDecimalComparisonViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-comparison';

interface CoreProps {
    config: NumbersDecimalComparisonViewConfig;
    payload: ViewRenderPayload<'numbers-decimal-comparison'>;
}

const DecimalGrid = ({
    model,
    operand,
    side
}: {
    model: TenthsHundredthsGridModel;
    operand: DecimalComparisonOperand;
    side: 'Left' | 'Right';
}) => (
    <div
        className="rounded-xl border-2 border-slate-200 bg-white p-3"
        role="img"
        aria-label={`${side} decimal ${operand.decimalNotation} on an identical hundred-part model of the shared whole.`}
    >
        <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-extrabold uppercase tracking-[0.1em] text-slate-600">
                {side}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-lg font-black text-slate-800">
                {operand.decimalNotation}
            </span>
        </div>
        <div
            className="relative mx-auto h-[280px] w-[280px] overflow-hidden rounded-lg border-[3px] border-slate-800 bg-white"
            aria-hidden="true"
        >
            {model.cells.map(cell => (
                <div
                    key={cell.index}
                    className={`absolute border-slate-500 ${cell.shaded ? 'bg-sky-300' : 'bg-white'}`}
                    style={{
                        left: `${cell.xPercent}%`,
                        top: `${cell.yPercent}%`,
                        width: `${cell.widthPercent}%`,
                        height: `${cell.heightPercent}%`,
                        borderLeftWidth: cell.column === 0 ? 0 : 2,
                        borderTopWidth: cell.row === 0 ? 0 : 1,
                        backgroundImage: cell.shaded
                            ? 'repeating-linear-gradient(135deg, transparent 0, transparent 6px, rgba(3,105,161,0.2) 6px, rgba(3,105,161,0.2) 8px)'
                            : 'none'
                    }}
                />
            ))}
        </div>
        <div className="mt-2 text-center text-xs font-bold text-slate-500">
            One whole · 100 equal parts
        </div>
    </div>
);

const PlaceValueRow = ({
    operand,
    highlight,
    side
}: {
    operand: DecimalComparisonOperand;
    highlight: DecimalComparisonProblem['firstDecidingPlace'] | null;
    side: 'Left' | 'Right';
}) => {
    const columns = [
        {key: 'ones', label: 'Ones', value: operand.placeValueRow.ones},
        {key: 'tenths', label: 'Tenths', value: operand.placeValueRow.tenths},
        {key: 'hundredths', label: 'Hundredths', value: operand.placeValueRow.hundredths}
    ] as const;
    return (
        <div
            className="overflow-hidden rounded-lg border-2 border-slate-200"
            role="img"
            aria-label={`${side} decimal ${operand.decimalNotation} aligned in ones, tenths, and hundredths columns.`}
        >
            <div className="grid grid-cols-3 bg-slate-100 text-center text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-slate-600">
                {columns.map(column => (
                    <div key={column.key} className="border-r border-slate-300 px-2 py-1.5 last:border-r-0">
                        {column.label}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-3 bg-white text-center font-mono text-2xl font-black text-slate-800">
                {columns.map(column => (
                    <div
                        key={column.key}
                        className={`border-r border-t border-slate-300 px-2 py-2 last:border-r-0 ${
                            highlight === column.key
                                ? 'bg-amber-100 text-amber-950 ring-2 ring-inset ring-amber-500'
                                : highlight === 'equal'
                                    ? 'bg-emerald-50 text-emerald-950'
                                    : ''
                        }`}
                    >
                        {column.value}
                    </div>
                ))}
            </div>
        </div>
    );
};

const OperandPanel = ({
    operand,
    side,
    decidingPlace
}: {
    operand: DecimalComparisonOperand;
    side: 'Left' | 'Right';
    decidingPlace: DecimalComparisonProblem['firstDecidingPlace'] | null;
}) => (
    <div className="space-y-3">
        <DecimalGrid model={operand.model} operand={operand} side={side} />
        <PlaceValueRow operand={operand} highlight={decidingPlace} side={side} />
    </div>
);

export const NumbersDecimalComparisonCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'task',
        'sharedWhole',
        'relation',
        'symbol',
        'left',
        'right',
        'firstDecidingPlace',
        'prompt',
        'questionEquation',
        'solutionEquation',
        'answer',
        'answerStatement',
        'explanation'
    ]);
    if (!isValidDecimalComparisonProblem(data)) {
        throw new ViewValidationError(
            VIEW_ID,
            'Expected a coherent supplied decimal comparison on one shared whole.'
        );
    }

    const decidingPlace = isSolutionView ? data.firstDecidingPlace : null;
    return (
        <div className="w-[930px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.4rem] font-extrabold text-slate-800">
                {data.prompt}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 font-mono text-3xl font-black text-slate-900">
                <span>{data.left.decimalNotation}</span>
                <span className={`flex h-12 w-14 items-center justify-center rounded-lg border-2 ${
                    isSolutionView
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-dashed border-slate-400 bg-slate-50 text-slate-400'
                }`}>
                    {isSolutionView ? data.symbol : '?'}
                </span>
                <span>{data.right.decimalNotation}</span>
            </div>

            <div
                className="mt-5 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4"
                role="group"
                aria-label={isSolutionView
                    ? `The left and right decimals use identical hundred-part models of one shared whole. The supplied comparison is ${data.solutionEquation}.`
                    : `The given decimals ${data.left.decimalNotation} and ${data.right.decimalNotation} use identical hundred-part models of one shared whole. The comparison symbol and deciding place are withheld.`}
            >
                <div className="mb-3 text-center text-sm font-bold text-slate-600">
                    Identical models represent the same whole
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <OperandPanel operand={data.left} side="Left" decidingPlace={decidingPlace} />
                    <OperandPanel operand={data.right} side="Right" decidingPlace={decidingPlace} />
                </div>
            </div>

            <div className={`mt-5 min-h-[122px] rounded-xl border-2 px-5 py-4 text-center ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView ? (
                    <>
                        <div className="text-sm font-extrabold uppercase tracking-[0.1em] text-emerald-800">
                            {data.firstDecidingPlace === 'equal'
                                ? `Equal after writing hundredths: ${data.left.normalizedHundredthsNotation} = ${data.right.normalizedHundredthsNotation}`
                                : `First deciding place: ${data.firstDecidingPlace}`}
                        </div>
                        <div className="mt-2 text-lg font-extrabold">{data.answerStatement}</div>
                        <div className="mt-1 text-sm font-semibold leading-snug">{data.explanation}</div>
                    </>
                ) : (
                    <div className="flex min-h-[88px] items-center justify-center font-mono text-xl font-bold">
                        {data.questionEquation}
                    </div>
                )}
            </div>
        </div>
    );
};

export const NumbersDecimalComparison = withConfig(
    NumbersDecimalComparisonViewSchema,
    NumbersDecimalComparisonCore
);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'numbers-decimal-comparison'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<NumbersDecimalComparison payload={payload} />);
        }
    };
}
