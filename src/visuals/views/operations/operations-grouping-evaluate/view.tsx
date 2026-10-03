import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumericalExpressionView} from '../operations-numerical-expression-view.tsx';
import {OperationsGroupingEvaluateViewConfig, OperationsGroupingEvaluateViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-grouping-evaluate';

interface CoreProps {
    config: OperationsGroupingEvaluateViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsNumericalExpressionView mode="grouping-evaluate" payload={payload} viewId={VIEW_ID} />
);

export const OperationsGroupingEvaluate = withConfig(OperationsGroupingEvaluateViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsGroupingEvaluate payload={payload} />);
};
