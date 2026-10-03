import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {DecimalAnswerCard, DecimalSourceCard, DecimalWritingFrame} from '../decimal-writing-components.tsx';
import {assertDecimalWritingProblem, decimalNumberName} from '../decimal-writing-helpers.ts';
import {NumbersDecimalNameWritingViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-name-writing';

export const NumbersDecimalNameWritingCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'base', 'wholePart', 'valueInThousandths', 'canonicalNumeral', 'fractionalPart']);
    assertDecimalWritingProblem(VIEW_ID, data);
    const isSolution = payload.isSolutionView;

    return <DecimalWritingFrame
        eyebrow="Write a decimal number name"
        title="Write this numeral in words"
        prompt="Name both the whole part and the fractional part with its correct unit."
    >
        <DecimalSourceCard label="Decimal numeral" numeral>{data.canonicalNumeral}</DecimalSourceCard>
        <DecimalAnswerCard isSolutionView={isSolution} placeholder="Write the complete number name here.">
            {decimalNumberName(data)}
        </DecimalAnswerCard>
    </DecimalWritingFrame>;
};

export const NumbersDecimalNameWriting = withConfig(
    NumbersDecimalNameWritingViewSchema,
    NumbersDecimalNameWritingCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersDecimalNameWriting payload={payload} />);
    }
};
