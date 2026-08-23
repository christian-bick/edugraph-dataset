import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumbersDecimalNotationView} from '../numbers-decimal-notation-view.tsx';
import {
    NumbersDecimalToFractionViewConfig,
    NumbersDecimalToFractionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-to-fraction';

interface CoreProps {
    config: NumbersDecimalToFractionViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <NumbersDecimalNotationView
        direction="decimal-to-fraction"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const NumbersDecimalToFraction = withConfig(
    NumbersDecimalToFractionViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersDecimalToFraction payload={payload} />);
};
