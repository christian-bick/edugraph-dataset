import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionLineView} from '../fraction-line-view.tsx';
import {
    NumbersFractionLineFormalizationViewConfig,
    NumbersFractionLineFormalizationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: NumbersFractionLineFormalizationViewConfig;
    payload: ViewRenderPayload<'numbers-fraction-line-formalization'>;
}

const Core = ({payload}: CoreProps) => (
    <FractionLineView mode="formalization" payload={payload} />
);

export const NumbersFractionLineFormalization = withConfig(
    NumbersFractionLineFormalizationViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-fraction-line-formalization'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersFractionLineFormalization payload={payload} />);
    }
};
