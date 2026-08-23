import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumberLineView} from '../operations-number-line-view.tsx';
import {
    OperationsNumberLineRepresentationViewConfig,
    OperationsNumberLineRepresentationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-number-line-representation';

interface CoreProps {
    config: OperationsNumberLineRepresentationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <OperationsNumberLineView mode="representation" payload={payload} viewId={VIEW_ID} />
);

export const OperationsNumberLineRepresentation = withConfig(
    OperationsNumberLineRepresentationViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsNumberLineRepresentation payload={payload} />);
};
