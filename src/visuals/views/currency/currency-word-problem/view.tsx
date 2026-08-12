import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {CurrencyAmount, CurrencyArithmeticProblem, CurrencyItem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {currencyStory, formatCurrency} from './helpers.ts';
import {CurrencyWordProblemViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    payload: ViewRenderPayload<'currency-word-problem'>;
}

function validateAmount(amount: CurrencyAmount) {
    if (!Array.isArray(amount.items) || amount.items.length === 0) {
        throw new ViewValidationError('currency-word-problem', 'Every amount needs visible currency items.');
    }
    for (const item of amount.items) {
        if (!['coin', 'banknote'].includes(item.kind)
            || !Number.isInteger(item.denominationCents)
            || item.denominationCents <= 0
            || !Number.isInteger(item.count)
            || item.count <= 0) {
            throw new ViewValidationError('currency-word-problem', 'Currency item data is invalid.');
        }
    }
    const representedTotal = amount.items.reduce(
        (sum, item) => sum + item.denominationCents * item.count,
        0
    );
    if (representedTotal !== amount.totalCents) {
        throw new ViewValidationError('currency-word-problem', 'Visible currency items do not equal their amount.');
    }
}

function CurrencyPiece({item}: {item: CurrencyItem}) {
    const label = formatCurrency(item.denominationCents, item.kind === 'banknote');
    const style = item.kind === 'coin'
        ? 'h-12 w-12 rounded-full border-[3px] border-amber-500 bg-amber-100 text-amber-900'
        : 'h-12 w-[78px] rounded-md border-[3px] border-emerald-600 bg-emerald-50 text-emerald-800';

    return (
        <div className={`flex items-center justify-center font-mono text-lg font-extrabold shadow-sm ${style}`}>
            {label}
        </div>
    );
}

function AmountCard({amount, label}: {amount: CurrencyAmount; label: string}) {
    const forceDollars = amount.items.some(item => item.kind === 'banknote');
    return (
        <div className="flex min-h-[132px] flex-1 flex-col rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
                <span className="font-mono text-xl font-extrabold text-slate-800">
                    {formatCurrency(amount.totalCents, forceDollars)}
                </span>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                {amount.items.flatMap((item, itemIndex) =>
                    Array.from({length: item.count}, (_, countIndex) => (
                        <CurrencyPiece key={`${itemIndex}-${countIndex}`} item={item} />
                    ))
                )}
            </div>
        </div>
    );
}

function validateProblem(problem: CurrencyArithmeticProblem) {
    validateProblemData('currency-word-problem', problem, ['operation', 'amounts', 'answerCents']);
    if (!['addition', 'subtraction'].includes(problem.operation) || problem.amounts.length !== 2) {
        throw new ViewValidationError('currency-word-problem', 'Unsupported currency operation or operand count.');
    }
    problem.amounts.forEach(validateAmount);
    const expected = problem.operation === 'addition'
        ? problem.amounts[0].totalCents + problem.amounts[1].totalCents
        : problem.amounts[0].totalCents - problem.amounts[1].totalCents;
    if (expected !== problem.answerCents || expected < 0) {
        throw new ViewValidationError('currency-word-problem', 'Currency arithmetic is inconsistent.');
    }
}

const CurrencyWordProblemCore = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblem(data);

    const forceDollars = data.amounts.some(amount => amount.items.some(item => item.kind === 'banknote'));
    const symbol = data.operation === 'addition' ? '+' : '−';

    return (
        <div className="w-[760px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Money story</div>
            <div className="mt-2 rounded-xl border-l-4 border-emerald-500 bg-slate-50 px-5 py-4 text-xl font-semibold leading-relaxed text-slate-700">
                {currencyStory(data)}
            </div>

            <div className="mt-5 flex gap-4">
                <AmountCard amount={data.amounts[0]} label="Amount 1" />
                <AmountCard amount={data.amounts[1]} label="Amount 2" />
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 font-mono text-[1.65rem] font-extrabold text-slate-700">
                <span>{formatCurrency(data.amounts[0].totalCents, forceDollars)}</span>
                <span className="text-slate-400">{symbol}</span>
                <span>{formatCurrency(data.amounts[1].totalCents, forceDollars)}</span>
                <span className="text-slate-400">=</span>
                <span className={`flex min-w-[92px] items-center justify-center rounded-lg border-2 px-3 py-2 ${
                    isSolutionView
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-dashed border-slate-400 bg-white text-slate-400'
                }`}>
                    {isSolutionView ? formatCurrency(data.answerCents, forceDollars) : '?'}
                </span>
            </div>
        </div>
    );
};

export const CurrencyWordProblem = withConfig(CurrencyWordProblemViewSchema, CurrencyWordProblemCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'currency-word-problem'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CurrencyWordProblem payload={payload} />);
};
