"use strict";

import NativeScrollEdgeBlur from './ScrollEdgeBlurViewNativeComponent';
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Progressive edge blur for content scrolling under a header or tab bar.
 *
 * A separate component from `<LiquidGlassView>` on purpose: it takes no
 * children, has no silhouette, tint or interaction, and is `pointerEvents:
 * none` so the content underneath stays scrollable. Position it absolutely
 * over the edge you want treated.
 *
 * On Android it reads the same per-root backdrop capture the glass views
 * share, so adding one to a screen that already has glass costs no extra
 * capture.
 */
export function ScrollEdgeBlurView({
  edge = 'top',
  maxBlurRadius = 24,
  falloff = 1,
  ...rest
}) {
  return /*#__PURE__*/_jsx(NativeScrollEdgeBlur, {
    edge: edge,
    maxBlurRadius: maxBlurRadius,
    falloff: falloff
    // Never intercept touches: the whole point is that content scrolls
    // underneath it.
    ,
    pointerEvents: "none",
    ...rest
  });
}
//# sourceMappingURL=ScrollEdgeBlurView.native.js.map