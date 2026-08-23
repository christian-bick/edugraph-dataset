import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumberLineView} from '../operations-number-line-view.tsx';
import {
    OperationsNumberLineArithmeticViewConfig,
    OperationsNumberLineArithmeticViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-number-line-arithmetic';

interface CoreProps {
    config: OperationsNumberLineArithmeticViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsNumberLineView mode="arithmetic" payload={payload} viewId={VIEW_ID} />
);

export const OperationsNumberLineArithmetic = withConfig(
    OperationsNumberLineArithmeticViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsNumberLineArithmetic payload={payload} />);
};
