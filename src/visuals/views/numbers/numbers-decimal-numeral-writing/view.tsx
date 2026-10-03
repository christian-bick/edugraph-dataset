import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {DecimalAnswerCard, DecimalSourceCard, DecimalWritingFrame} from '../decimal-writing-components.tsx';
import {assertDecimalWritingProblem, decimalNumberName, decimalResponseDigits} from '../decimal-writing-helpers.ts';
import {NumbersDecimalNumeralWritingViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-numeral-writing';
const PLACE_LABELS = ['whole', 'decimal point', 'tenths', 'hundredths', 'thousandths'] as const;

export const NumbersDecimalNumeralWritingCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'base', 'wholePart', 'valueInThousandths', 'canonicalNumeral', 'fractionalPart']);
    assertDecimalWritingProblem(VIEW_ID, data);
    const digits = decimalResponseDigits(data);
    const isSolution = payload.isSolutionView;

    return <DecimalWritingFrame
        eyebrow="Write a decimal numeral"
        title="Write the number name in digits"
        prompt="Place every digit and the decimal point. Include zero placeholders where they are needed."
    >
        <DecimalSourceCard label="Number name">{decimalNumberName(data)}</DecimalSourceCard>
        <div className="mt-6 flex items-start justify-center gap-2">
            {digits.map((digit, index) => <div key={index} className={`text-center ${index === 1 ? 'w-24' : 'w-28'}`}>
                <div className={`flex h-20 items-center justify-center rounded-xl border-2 font-mono text-4xl font-bold ${isSolution ? 'border-emerald-400 bg-emerald-50 text-emerald-950' : 'border-dashed border-slate-300 bg-white text-slate-500'}`}>
                    {isSolution ? digit : ''}
                </div>
                <div className="mt-2 text-xs font-bold uppercase leading-tight tracking-wide text-slate-500">{PLACE_LABELS[index]}</div>
            </div>)}
        </div>
        <DecimalAnswerCard isSolutionView={isSolution} placeholder="Write the complete decimal numeral here.">
            <span className="font-mono text-4xl">{data.canonicalNumeral}</span>
        </DecimalAnswerCard>
    </DecimalWritingFrame>;
};

export const NumbersDecimalNumeralWriting = withConfig(
    NumbersDecimalNumeralWritingViewSchema,
    NumbersDecimalNumeralWritingCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersDecimalNumeralWriting payload={payload} />);
    }
};
