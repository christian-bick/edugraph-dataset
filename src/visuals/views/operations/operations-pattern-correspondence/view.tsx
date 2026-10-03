import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PairedPatternView} from '../paired-pattern-view.tsx';
import type {OperationsPatternCorrespondenceViewConfig} from './spec.ts';
import {OperationsPatternCorrespondenceViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-pattern-correspondence';

interface CoreProps {
    config: OperationsPatternCorrespondenceViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <PairedPatternView mode="identify" payload={payload} viewId={VIEW_ID} />
);

export const OperationsPatternCorrespondence = withConfig(OperationsPatternCorrespondenceViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsPatternCorrespondence payload={payload} />);
};
