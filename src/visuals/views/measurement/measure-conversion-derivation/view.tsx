import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureConversionDerivationView} from '../measure-conversion-view.tsx';
import {
    MeasureConversionDerivationViewConfig,
    MeasureConversionDerivationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measure-conversion-derivation';

interface CoreProps {
    config: MeasureConversionDerivationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <MeasureConversionDerivationView payload={payload} />
);

export const MeasureConversionDerivation = withConfig(
    MeasureConversionDerivationViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasureConversionDerivation payload={payload} />);
};
