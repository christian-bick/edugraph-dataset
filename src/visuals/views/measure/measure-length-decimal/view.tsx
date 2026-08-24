import {createRoot} from 'react-dom/client';
import {MeasureLengthCore} from '../measure-length/view.tsx';
import {MeasureLengthDecimalViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';

const MeasureLengthDecimalCore = ({payload}: {payload: any}) =>
    <MeasureLengthCore isReverse={false} payload={payload} />;

export const MeasureLengthDecimal = withConfig(MeasureLengthDecimalViewSchema, MeasureLengthDecimalCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: any) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<MeasureLengthDecimal payload={payload} />);
    }
};
