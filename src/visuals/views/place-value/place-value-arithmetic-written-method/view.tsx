import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PlaceValueArithmeticModelCore} from '../place-value-arithmetic-model-view.tsx';
import {
    PlaceValueArithmeticWrittenMethodViewConfig,
    PlaceValueArithmeticWrittenMethodViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'place-value-arithmetic-written-method';

interface CoreProps {
    config: PlaceValueArithmeticWrittenMethodViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <PlaceValueArithmeticModelCore mode="written-method" payload={payload} viewId={VIEW_ID} />
);

export const PlaceValueArithmeticWrittenMethod = withConfig(
    PlaceValueArithmeticWrittenMethodViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<PlaceValueArithmeticWrittenMethod payload={payload} />);
};
