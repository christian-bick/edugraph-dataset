import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsAddSubtractStrategyView} from '../operations-add-subtract-strategy-view.tsx';
import {
    OperationsCountingBackOperationDerivationViewConfig,
    OperationsCountingBackOperationDerivationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-counting-back-operation-derivation';

interface CoreProps {
    config: OperationsCountingBackOperationDerivationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsAddSubtractStrategyView
        mode="counting-derivation"
        expectedCountingStrategy="subtraction-counting-back"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const OperationsCountingBackOperationDerivation = withConfig(
    OperationsCountingBackOperationDerivationViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsCountingBackOperationDerivation payload={payload} />);
};
