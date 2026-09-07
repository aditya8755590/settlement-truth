export const DEFAULT_GATEWAY_RATE = 0.02;
const MAX_GATEWAY_RATE = 0.2;

/**
 * A gateway rate is a financial control, not a presentation preference. Keep
 * the accepted range deliberately narrow and reject coercible input so an
 * ambiguous request cannot silently change reconciliation evidence.
 */
export function validateReconciliationOptions(input = {}) {
  const gatewayRate = input.gatewayRate ?? DEFAULT_GATEWAY_RATE;

  if (typeof gatewayRate !== "number" || !Number.isFinite(gatewayRate)) {
    throw new TypeError("gatewayRate must be a finite number.");
  }
  if (gatewayRate < 0 || gatewayRate > MAX_GATEWAY_RATE) {
    throw new RangeError("gatewayRate must be between 0% and 20%.");
  }

  return { gatewayRate };
}
