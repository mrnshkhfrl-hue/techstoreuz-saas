/**
 * Simple admin action logger.
 * Since AdminLog model was removed from the Prisma schema,
 * we log actions to console. This can be replaced with a proper
 * logging service (Sentry, Datadog, etc.) in production.
 */
export async function logAdminAction(action: string, details: string, adminId?: string) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[ADMIN_LOG] ${timestamp} | action=${action} | admin=${adminId || "unknown"} | ${details}`);
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
}
