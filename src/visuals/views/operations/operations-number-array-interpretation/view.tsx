import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumberArrayView} from '../operations-number-array-view.tsx';
import {
    OperationsNumberArrayInterpretationViewConfig,
    OperationsNumberArrayInterpretationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-number-array-interpretation';

interface CoreProps {
    config: OperationsNumberArrayInterpretationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsNumberArrayView mode="interpretation" payload={payload} viewId={VIEW_ID} />
);

export const OperationsNumberArrayInterpretation = withConfig(
    OperationsNumberArrayInterpretationViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsNumberArrayInterpretation payload={payload} />);
};
