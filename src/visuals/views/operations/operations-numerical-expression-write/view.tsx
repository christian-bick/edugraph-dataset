import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumericalExpressionView} from '../operations-numerical-expression-view.tsx';
import {
    OperationsNumericalExpressionWriteViewConfig,
    OperationsNumericalExpressionWriteViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-numerical-expression-write';

interface CoreProps {
    config: OperationsNumericalExpressionWriteViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsNumericalExpressionView mode="expression-write" payload={payload} viewId={VIEW_ID} />
);

export const OperationsNumericalExpressionWrite = withConfig(
    OperationsNumericalExpressionWriteViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsNumericalExpressionWrite payload={payload} />);
};
