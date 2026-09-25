/** Generates a reasonably unique employee id for UI-driven "add" flows. Consumers calling core/mutations directly are free to supply their own ids. */
export function generateEmployeeId(): string {
  return `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
