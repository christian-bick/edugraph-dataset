import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsAddSubtractStrategyView} from '../operations-add-subtract-strategy-view.tsx';
import {
    OperationsCountingOnOperationDerivationViewConfig,
    OperationsCountingOnOperationDerivationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-counting-on-operation-derivation';

interface CoreProps {
    config: OperationsCountingOnOperationDerivationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsAddSubtractStrategyView
        mode="counting-derivation"
        expectedCountingStrategy="addition-counting-on"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const OperationsCountingOnOperationDerivation = withConfig(
    OperationsCountingOnOperationDerivationViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsCountingOnOperationDerivation payload={payload} />);
};
