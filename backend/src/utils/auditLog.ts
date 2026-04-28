import { prisma } from './prisma';

/**
 * Fire-and-forget audit log entry. Never throws — audit logging
 * must never break the main request flow.
 */
export const logAudit = (
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  changes?: Record<string, unknown>
): void => {
  void prisma.auditLog
    .create({
      data: {
        userId: actorId,
        action,
        entity,
        entityId,
        changes: changes ? JSON.stringify(changes) : null,
      },
    })
    .catch(() => {
      // Swallow — audit log failure should not affect the response
    });
};
