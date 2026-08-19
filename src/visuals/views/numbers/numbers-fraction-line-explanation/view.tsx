import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionLineView} from '../fraction-line-view.tsx';
import {
    NumbersFractionLineExplanationViewConfig,
    NumbersFractionLineExplanationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: NumbersFractionLineExplanationViewConfig;
    payload: ViewRenderPayload<'numbers-fraction-line-explanation'>;
}

const Core = ({payload}: CoreProps) => (
    <FractionLineView mode="explanation" payload={payload} />
);

export const NumbersFractionLineExplanation = withConfig(
    NumbersFractionLineExplanationViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-fraction-line-explanation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersFractionLineExplanation payload={payload} />);
    }
};
