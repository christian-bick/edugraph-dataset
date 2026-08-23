import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumbersDecimalNotationView} from '../numbers-decimal-notation-view.tsx';
import {
    NumbersFractionToDecimalViewConfig,
    NumbersFractionToDecimalViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-fraction-to-decimal';

interface CoreProps {
    config: NumbersFractionToDecimalViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <NumbersDecimalNotationView
        direction="fraction-to-decimal"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const NumbersFractionToDecimal = withConfig(
    NumbersFractionToDecimalViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersFractionToDecimal payload={payload} />);
};
