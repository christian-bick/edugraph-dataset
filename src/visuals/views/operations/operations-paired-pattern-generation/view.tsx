import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PairedPatternView} from '../paired-pattern-view.tsx';
import type {OperationsPairedPatternGenerationViewConfig} from './spec.ts';
import {OperationsPairedPatternGenerationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-paired-pattern-generation';

interface CoreProps {
    config: OperationsPairedPatternGenerationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <PairedPatternView mode="generate" payload={payload} viewId={VIEW_ID} />
);

export const OperationsPairedPatternGeneration = withConfig(OperationsPairedPatternGenerationViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsPairedPatternGeneration payload={payload} />);
};
