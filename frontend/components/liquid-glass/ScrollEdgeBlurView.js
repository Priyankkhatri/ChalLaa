"use strict";

import { View } from 'react-native';

/** Which edge the blur is anchored to. */
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Web / unsupported-platform fallback.
 *
 * There is no honest way to fake a backdrop blur here, and a translucent scrim
 * would be worse than nothing over content — a header already has its own
 * background. So this renders an inert, transparent view that occupies the
 * same space, and a cross-platform tree keeps its layout.
 */
export function ScrollEdgeBlurView({
  edge: _edge,
  maxBlurRadius: _maxBlurRadius,
  falloff: _falloff,
  ...rest
}) {
  return /*#__PURE__*/_jsx(View, {
    ...rest,
    pointerEvents: "none"
  });
}
//# sourceMappingURL=ScrollEdgeBlurView.js.map