import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionLineView} from '../fraction-line-view.tsx';
import {
    NumbersFractionLineClassificationViewConfig,
    NumbersFractionLineClassificationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: NumbersFractionLineClassificationViewConfig;
    payload: ViewRenderPayload<'numbers-fraction-line-classification'>;
}

const Core = ({payload}: CoreProps) => (
    <FractionLineView mode="classification" payload={payload} />
);

export const NumbersFractionLineClassification = withConfig(
    NumbersFractionLineClassificationViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-fraction-line-classification'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersFractionLineClassification payload={payload} />);
    }
};
