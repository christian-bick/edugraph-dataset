import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PairedPatternView} from '../paired-pattern-view.tsx';
import type {OperationsPatternCorrespondenceExplanationViewConfig} from './spec.ts';
import {OperationsPatternCorrespondenceExplanationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-pattern-correspondence-explanation';

interface CoreProps {
    config: OperationsPatternCorrespondenceExplanationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <PairedPatternView mode="explain" payload={payload} viewId={VIEW_ID} />
);

export const OperationsPatternCorrespondenceExplanation = withConfig(OperationsPatternCorrespondenceExplanationViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsPatternCorrespondenceExplanation payload={payload} />);
};
