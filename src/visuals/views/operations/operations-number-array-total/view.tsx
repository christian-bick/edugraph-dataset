import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumberArrayView} from '../operations-number-array-view.tsx';
import {
    OperationsNumberArrayTotalViewConfig,
    OperationsNumberArrayTotalViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-number-array-total';

interface CoreProps {
    config: OperationsNumberArrayTotalViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsNumberArrayView mode="execution" payload={payload} viewId={VIEW_ID} />
);

export const OperationsNumberArrayTotal = withConfig(
    OperationsNumberArrayTotalViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsNumberArrayTotal payload={payload} />);
};
