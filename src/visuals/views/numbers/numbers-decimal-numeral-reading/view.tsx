import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {DecimalSourceCard, DecimalWritingFrame} from '../decimal-writing-components.tsx';
import {assertDecimalWritingProblem, decimalReadingChoices} from '../decimal-writing-helpers.ts';
import {NumbersDecimalNumeralReadingViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-numeral-reading';
const LETTERS = ['A', 'B', 'C', 'D'] as const;

export const NumbersDecimalNumeralReadingCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'base', 'wholePart', 'valueInThousandths', 'canonicalNumeral', 'fractionalPart']);
    assertDecimalWritingProblem(VIEW_ID, data);
    const choices = decimalReadingChoices(data, payload.seed);

    return <DecimalWritingFrame
        eyebrow="Read a decimal numeral"
        title="Which words match this numeral?"
        prompt="Read the decimal and choose its exact written meaning."
    >
        <DecimalSourceCard label="Decimal numeral" numeral>{data.canonicalNumeral}</DecimalSourceCard>
        <div className="mt-5 grid gap-3">
            {choices.map((choice, index) => {
                const selected = payload.isSolutionView && choice.correct;
                return <div key={choice.valueInThousandths} className={`flex items-center gap-4 rounded-xl border-2 px-4 py-3 text-lg ${selected ? 'border-emerald-400 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-800'}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{LETTERS[index]}</span>
                    <span className="flex-1">{choice.name}</span>
                    {selected && <span className="text-xl font-bold text-emerald-700">✓</span>}
                </div>;
            })}
        </div>
    </DecimalWritingFrame>;
};

export const NumbersDecimalNumeralReading = withConfig(
    NumbersDecimalNumeralReadingViewSchema,
    NumbersDecimalNumeralReadingCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersDecimalNumeralReading payload={payload} />);
    }
};
