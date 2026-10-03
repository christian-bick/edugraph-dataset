import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumericalExpressionView} from '../operations-numerical-expression-view.tsx';
import {OperationsGroupingWriteViewConfig, OperationsGroupingWriteViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-grouping-write';

interface CoreProps {
    config: OperationsGroupingWriteViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsNumericalExpressionView mode="grouping-write" payload={payload} viewId={VIEW_ID} />
);

export const OperationsGroupingWrite = withConfig(OperationsGroupingWriteViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsGroupingWrite payload={payload} />);
};
