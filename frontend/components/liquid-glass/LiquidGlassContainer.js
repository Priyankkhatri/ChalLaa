"use strict";

import { View } from 'react-native';
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Web / unsupported-platform fallback: a plain container.
 *
 * There is no glass to merge here, so this is not a degradation so much as the
 * absence of an enhancement — children still lay out identically.
 */
export function LiquidGlassContainer({
  spacing: _spacing,
  ...rest
}) {
  return /*#__PURE__*/_jsx(View, {
    ...rest
  });
}
//# sourceMappingURL=LiquidGlassContainer.js.map