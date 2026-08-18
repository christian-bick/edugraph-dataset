import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    PlaceValueArithmeticProblem,
    PlaceValueDigits,
    PlaceValueRegroupingEvidence
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidPlaceValueArithmeticProblem} from '../helpers.ts';
import {operationSymbol, writtenDigits} from './helpers.ts';
import {
    PlaceValueArithmeticModelViewConfig,
    PlaceValueArithmeticModelViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueArithmeticModelViewConfig;
    payload: ViewRenderPayload<'place-value-arithmetic-model'>;
}

const VIEW_ID = 'place-value-arithmetic-model';

function Hundreds({count, removed = false}: {count: number; removed?: boolean}) {
    return (
        <div className="mx-auto flex w-full flex-nowrap justify-center gap-0.5" aria-label={`${count} hundreds`}>
            {Array.from({length: count}, (_, index) => (
                <span key={index} className={`size-3 shrink-0 border-2 ${
                    removed ? 'border-rose-500 bg-rose-100 opacity-65' : 'border-indigo-500 bg-indigo-100'
                }`} />
            ))}
        </div>
    );
}

function Tens({count, removed = false}: {count: number; removed?: boolean}) {
    return (
        <div className="mx-auto flex w-full flex-nowrap items-end justify-center gap-0.5" aria-label={`${count} tens`}>
            {Array.from({length: count}, (_, index) => (
                <span key={index} className={`h-9 w-1.5 shrink-0 border-2 ${
                    removed ? 'border-rose-500 bg-rose-100 opacity-65' : 'border-sky-500 bg-sky-100'
                }`} />
            ))}
        </div>
    );
}

function Ones({count, removed = false}: {count: number; removed?: boolean}) {
    return (
        <div className="mx-auto flex w-full max-w-20 flex-wrap justify-center gap-1" aria-label={`${count} ones`}>
            {Array.from({length: count}, (_, index) => (
                <span key={index} className={`size-3 rounded-sm border ${
                    removed ? 'border-rose-600 bg-rose-200 opacity-65' : 'border-amber-600 bg-amber-200'
                }`} />
            ))}
        </div>
    );
}

function PlaceBlocks({digits, label, zeroLabel, removed = false, omitEmptyCounts = false}: {
    digits: PlaceValueDigits;
    label: string;
    zeroLabel?: string;
    removed?: boolean;
    omitEmptyCounts?: boolean;
}) {
    const isZero = digits.hundreds === 0 && digits.tens === 0 && digits.ones === 0;
    return (
        <div className={`min-w-0 rounded-xl border p-4 ${
            removed ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
        }`}>
            <div className={`mb-3 text-center text-sm font-bold ${removed ? 'text-rose-700' : 'text-slate-600'}`}>{label}</div>
            {isZero ? (
                <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-sm font-semibold text-slate-500">
                    {zeroLabel ?? '0 — no blocks'}
                </div>
            ) : (
                <div className="grid min-h-24 grid-cols-[130px_70px_70px] items-end justify-center gap-2">
                    {omitEmptyCounts && digits.hundreds === 0
                        ? <div aria-label="empty hundreds place" />
                        : <Hundreds count={digits.hundreds} removed={removed} />}
                    {omitEmptyCounts && digits.tens === 0
                        ? <div aria-label="empty tens place" />
                        : <Tens count={digits.tens} removed={removed} />}
                    {omitEmptyCounts && digits.ones === 0
                        ? <div aria-label="empty ones place" />
                        : <Ones count={digits.ones} removed={removed} />}
                </div>
            )}
            <div className="mt-3 grid grid-cols-[130px_70px_70px] justify-center gap-2 text-center text-xs font-bold text-slate-600">
                <span>{omitEmptyCounts && digits.hundreds === 0 ? 'hundreds' : `${digits.hundreds} hundreds`}</span>
                <span>{omitEmptyCounts && digits.tens === 0 ? 'tens' : `${digits.tens} tens`}</span>
                <span>{omitEmptyCounts && digits.ones === 0 ? 'ones' : `${digits.ones} ones`}</span>
            </div>
        </div>
    );
}

function ComposeTenModel({regrouping}: {regrouping: PlaceValueRegroupingEvidence}) {
    return (
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-white px-4 py-3">
            <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Combined ones</div>
                <div className="mt-2 flex min-h-12 items-center justify-center"><Ones count={regrouping.onesBefore} /></div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{regrouping.onesBefore} ones</div>
            </div>
            <div className="text-2xl font-bold text-amber-700">→</div>
            <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Compose one ten</div>
                <div className="mt-2 flex min-h-12 items-end justify-center gap-3"><Tens count={1} /><Ones count={regrouping.onesAfter} /></div>
                <div className="mt-1 text-sm font-semibold text-slate-700">1 ten and {regrouping.onesAfter} ones</div>
            </div>
        </div>
    );
}

function DecomposeTenModel({regrouping, removedOnes}: {
    regrouping: PlaceValueRegroupingEvidence;
    removedOnes: number;
}) {
    return (
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-lg bg-white px-3 py-3 text-center">
            <div>
                <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Exchange</div>
                <div className="mt-2 flex min-h-12 items-end justify-center"><Tens count={1} /></div>
                <div className="mt-1 text-sm font-semibold text-slate-700">1 ten</div>
            </div>
            <div className="text-2xl font-bold text-amber-700">→</div>
            <div>
                <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Available</div>
                <div className="mt-2 flex min-h-12 items-center justify-center"><Ones count={regrouping.onesAfter} /></div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{regrouping.onesAfter} ones</div>
            </div>
            <div className="text-2xl font-bold text-rose-600">−</div>
            <div>
                <div className="text-xs font-bold uppercase tracking-wide text-rose-700">Remove</div>
                <div className="mt-2 flex min-h-12 items-center justify-center"><Ones count={removedOnes} removed /></div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{removedOnes} ones; {regrouping.onesAfter - removedOnes} remain</div>
            </div>
        </div>
    );
}

function TensRemovalModel({data}: {data: PlaceValueArithmeticProblem}) {
    const startingTens = data.num1 / 10;
    const removedTens = data.num2 / 10;
    const remainingTens = data.answer / 10;
    return (
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-lg bg-white px-3 py-3 text-center">
            <div>
                <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Start</div>
                <div className="mt-2 flex min-h-12 items-end justify-center"><Tens count={startingTens} /></div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{startingTens} tens</div>
            </div>
            <div className="text-sm font-bold text-slate-500">match</div>
            <div>
                <div className="text-xs font-bold uppercase tracking-wide text-rose-700">Remove</div>
                <div className="mt-2 flex min-h-12 items-end justify-center"><Tens count={removedTens} removed /></div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{removedTens} tens</div>
            </div>
            <div className="text-2xl font-bold text-slate-500">→</div>
            <div>
                <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Remain</div>
                <div className="mt-2 flex min-h-12 items-end justify-center">
                    {remainingTens === 0 ? <span className="text-3xl font-extrabold text-slate-500">0</span> : <Tens count={remainingTens} />}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{remainingTens} tens</div>
            </div>
        </div>
    );
}

function SolutionProcess({data, omitEmptyCounts}: {
    data: PlaceValueArithmeticProblem;
    omitEmptyCounts: boolean;
}) {
    const showSeparateResult = data.regrouping.kind !== 'none'
        || data.operandProfile === 'multiples-of-ten';
    return (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
            <div className="text-center text-xs font-bold uppercase tracking-wide text-amber-800">Place-value operation</div>
            {data.operandProfile === 'multiples-of-ten' && data.operation === 'subtraction' ? (
                <TensRemovalModel data={data} />
            ) : data.regrouping.kind === 'compose-ten' ? (
                <ComposeTenModel regrouping={data.regrouping} />
            ) : data.regrouping.kind === 'decompose-ten' ? (
                <DecomposeTenModel regrouping={data.regrouping} removedOnes={data.operands[1].ones} />
            ) : (
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-white px-4 py-3">
                    <PlaceBlocks
                        digits={data.operands[1]}
                        label={data.operation === 'addition' ? `Combine ${data.num2}` : `Match and remove ${data.num2}`}
                        removed={data.operation === 'subtraction'}
                        omitEmptyCounts={omitEmptyCounts}
                    />
                    <span className="text-3xl font-bold text-amber-700">→</span>
                    <PlaceBlocks digits={data.result} label={`Result ${data.answer}`} zeroLabel="0 — all blocks were removed" omitEmptyCounts={omitEmptyCounts} />
                </div>
            )}
            <div className="mt-3 text-center font-semibold text-amber-950">
                {data.operandProfile === 'multiples-of-ten' && data.answer > 0
                    ? 'The ones places are empty, so subtract the tens directly.'
                    : data.regrouping.statement}
            </div>
            {showSeparateResult && (
                <div className="mt-3">
                    <PlaceBlocks digits={data.result} label={`Result ${data.answer}`} zeroLabel="0 — all blocks were removed" omitEmptyCounts={omitEmptyCounts} />
                </div>
            )}
        </div>
    );
}

function DigitRow({digits, prefix, tone = 'text-slate-800', ariaLabel}: {
    digits: readonly [string, string, string];
    prefix: string;
    tone?: string;
    ariaLabel?: string;
}) {
    return (
        <div aria-label={ariaLabel} className={`grid grid-cols-[36px_repeat(3,52px)] items-center text-center font-mono text-3xl font-bold ${tone}`}>
            <span>{prefix}</span>
            {digits.map((digit, index) => <span key={index}>{digit}</span>)}
        </div>
    );
}

function VerticalWrittenMethod({data, isSolutionView}: {
    data: PlaceValueArithmeticProblem;
    isSolutionView: boolean;
}) {
    let annotation: readonly [string, string, string] = ['', '', ''];
    if (data.operation === 'addition') {
        const carryToTens = Math.floor(
            (data.operands[0].ones + data.operands[1].ones) / 10
        );
        const carryToHundreds = Math.floor(
            (data.operands[0].tens + data.operands[1].tens + carryToTens) / 10
        );
        annotation = [
            carryToHundreds > 0 ? String(carryToHundreds) : '',
            carryToTens > 0 ? String(carryToTens) : '',
            ''
        ];
    } else if (data.operation === 'subtraction') {
        let adjustedHundreds = data.operands[0].hundreds;
        let adjustedTens = data.operands[0].tens;
        let adjustedOnes = data.operands[0].ones;
        const onesBorrowed = adjustedOnes < data.operands[1].ones;
        if (onesBorrowed) {
            adjustedOnes += 10;
            adjustedTens -= 1;
        }
        const hundredsBorrowed = adjustedTens < data.operands[1].tens;
        if (hundredsBorrowed) {
            adjustedTens += 10;
            adjustedHundreds -= 1;
        }
        annotation = [
            hundredsBorrowed ? String(adjustedHundreds) : '',
            onesBorrowed || hundredsBorrowed ? String(adjustedTens) : '',
            onesBorrowed ? String(adjustedOnes) : ''
        ];
    }
    const hasAnnotation = annotation.some(digit => digit !== '');
    const annotationLabel = data.operation === 'addition' ? 'Carried values' : 'Regrouped top number';

    return (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-4">
            <div className="text-center text-xs font-bold uppercase tracking-wide text-indigo-700">Vertical written method</div>
            <div className="mx-auto mt-3 w-fit">
                <div className="grid grid-cols-[36px_repeat(3,52px)] text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                    <span /><span>H</span><span>T</span><span>O</span>
                </div>
                <div className="min-h-7">
                    {isSolutionView && hasAnnotation && (
                        <div className="text-center text-[0.7rem] font-bold uppercase tracking-wide text-rose-600">{annotationLabel}</div>
                    )}
                    {isSolutionView && hasAnnotation && (
                        <DigitRow
                            digits={annotation}
                            prefix=""
                            tone="text-xl text-rose-600"
                            ariaLabel={`${annotationLabel}: H ${annotation[0] || 'unchanged'}, T ${annotation[1] || 'unchanged'}, O ${annotation[2] || 'unchanged'}`}
                        />
                    )}
                </div>
                <DigitRow digits={writtenDigits(data.num1)} prefix="" ariaLabel={`First operand ${data.num1}`} />
                <DigitRow digits={writtenDigits(data.num2)} prefix={operationSymbol(data.operation)} ariaLabel={`Second operand ${data.num2}`} />
                <div className="ml-9 mt-1 border-t-2 border-slate-800" />
                {isSolutionView ? (
                    <DigitRow digits={writtenDigits(data.answer)} prefix="" tone="text-emerald-700" ariaLabel={`Written result ${data.answer}`} />
                ) : (
                    <div className="ml-9 mt-2 grid grid-cols-3 gap-2">
                        {[0, 1, 2].map(index => <span key={index} className="h-10 rounded border-2 border-dashed border-slate-400 bg-white" />)}
                    </div>
                )}
            </div>
        </div>
    );
}

function TensVerticalWrittenMethod({data, isSolutionView}: {
    data: PlaceValueArithmeticProblem;
    isSolutionView: boolean;
}) {
    const leftTens = data.num1 / 10;
    const rightTens = data.num2 / 10;
    const resultTens = data.answer / 10;
    return (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-4">
            <div className="text-center text-xs font-bold uppercase tracking-wide text-indigo-700">Tens-unit vertical method</div>
            <div className="mx-auto mt-4 w-fit font-mono text-2xl font-bold text-slate-800">
                <div className="grid grid-cols-[36px_70px_70px] items-center text-right" aria-label={`First operand ${leftTens} tens`}>
                    <span /><span>{leftTens}</span><span className="ml-2 text-left font-sans text-base">tens</span>
                </div>
                <div className="grid grid-cols-[36px_70px_70px] items-center text-right" aria-label={`Second operand ${rightTens} tens`}>
                    <span>{operationSymbol(data.operation)}</span><span>{rightTens}</span><span className="ml-2 text-left font-sans text-base">tens</span>
                </div>
                <div className="ml-9 mt-1 border-t-2 border-slate-800" />
                {isSolutionView ? (
                    <div className="grid grid-cols-[36px_70px_70px] items-center text-right text-emerald-700" aria-label={`Written result ${resultTens} tens`}>
                        <span /><span>{resultTens}</span><span className="ml-2 text-left font-sans text-base">tens</span>
                    </div>
                ) : (
                    <div className="ml-[106px] mt-2 h-10 w-16 rounded border-2 border-dashed border-slate-400 bg-white" aria-label="blank tens result" />
                )}
            </div>
        </div>
    );
}

export const PlaceValueArithmeticModelCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'num1', 'num2', 'answer', 'operation', 'operandProfile', 'operands', 'result',
        'regrouping', 'equation', 'strategySteps'
    ]);
    if (!isValidPlaceValueArithmeticProblem(data)) {
        throw new ViewValidationError(
            VIEW_ID,
            'Expected coherent place-value arithmetic with structured regrouping and exactly three typed strategy steps.'
        );
    }
    const omitEmptyCounts = data.operandProfile === 'multiples-of-ten' && data.answer > 0;

    return (
        <div className="w-[780px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Operate by place value</div>
                <div className="mt-2 text-xl font-semibold text-slate-700">Use the blocks to show {data.num1} {operationSymbol(data.operation)} {data.num2}.</div>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl bg-slate-50 p-4">
                <PlaceBlocks digits={data.operands[0]} label={`First operand: ${data.num1}`} omitEmptyCounts={omitEmptyCounts} />
                <span className="text-4xl font-bold text-slate-500">{operationSymbol(data.operation)}</span>
                <PlaceBlocks digits={data.operands[1]} label={`Second operand: ${data.num2}`} omitEmptyCounts={omitEmptyCounts} />
            </div>
            {isSolutionView ? (
                <SolutionProcess data={data} omitEmptyCounts={omitEmptyCounts} />
            ) : (
                <div className="mt-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-5 py-5 text-center font-semibold text-amber-900">
                    Show how the blocks combine, compose, match, or are removed. Then find the result.
                </div>
            )}
            {config.showWrittenMethod ? (
                data.operandProfile === 'multiples-of-ten' && data.answer > 0
                    ? <TensVerticalWrittenMethod data={data} isSolutionView={isSolutionView} />
                    : <VerticalWrittenMethod data={data} isSolutionView={isSolutionView} />
            ) : (
                <div className="mt-4 flex items-center justify-center gap-3 text-lg font-semibold text-slate-600">
                    <span>Result</span>
                    <span className="inline-flex min-h-12 min-w-20 items-center justify-center rounded-lg border-2 border-slate-700 px-3 font-mono text-2xl text-emerald-700">
                        {isSolutionView ? data.answer : ''}
                    </span>
                </div>
            )}
        </div>
    );
};

export const PlaceValueArithmeticModel = withConfig(
    PlaceValueArithmeticModelViewSchema,
    PlaceValueArithmeticModelCore
);

let root: ReturnType<typeof createRoot> | null = null;
if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'place-value-arithmetic-model'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<PlaceValueArithmeticModel payload={payload} />);
        }
    };
}
