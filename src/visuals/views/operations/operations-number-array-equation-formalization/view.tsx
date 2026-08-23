import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumberArrayView} from '../operations-number-array-view.tsx';
import {
    OperationsNumberArrayEquationFormalizationViewConfig,
    OperationsNumberArrayEquationFormalizationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-number-array-equation-formalization';

interface CoreProps {
    config: OperationsNumberArrayEquationFormalizationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsNumberArrayView mode="formalization" payload={payload} viewId={VIEW_ID} />
);

export const OperationsNumberArrayEquationFormalization = withConfig(
    OperationsNumberArrayEquationFormalizationViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsNumberArrayEquationFormalization payload={payload} />);
};
