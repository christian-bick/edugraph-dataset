import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsAddSubtractStrategyView} from '../operations-add-subtract-strategy-view.tsx';
import {
    OperationsAddSubtractStrategyUnderstandingViewConfig,
    OperationsAddSubtractStrategyUnderstandingViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-add-subtract-strategy-understanding';

interface CoreProps {
    config: OperationsAddSubtractStrategyUnderstandingViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsAddSubtractStrategyView
        mode="understanding"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const OperationsAddSubtractStrategyUnderstanding = withConfig(
    OperationsAddSubtractStrategyUnderstandingViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsAddSubtractStrategyUnderstanding payload={payload} />);
};
