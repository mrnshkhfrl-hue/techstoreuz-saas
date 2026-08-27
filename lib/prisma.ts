import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * List of Prisma model names that belong to a tenant (have a `shopId` field).
 * Only these models get automatic shopId injection via getTenantPrisma().
 * Global models (User, ShopAdmin, etc.) are NEVER filtered.
 */
const TENANT_MODELS = [
  "NewProductTemplate",
  "UsedProduct",
  "Booking",
] as const;

/**
 * Generic handler that injects `shopId` into a Prisma query operation.
 * Used internally by getTenantPrisma to create per-model overrides.
 */
function tenantQueryHandler(shopId: string) {
  return async function handleAllOperations({
    operation,
    args,
    query,
  }: {
    model: string;
    operation: string;
    args: any;
    query: (args: any) => Promise<any>;
  }) {
    const a = (args ?? {}) as Record<string, any>;

    // Operations that filter via `where`
    const whereOps = [
      "findMany",
      "findFirst",
      "findFirstOrThrow",
      "findUnique",
      "findUniqueOrThrow",
      "count",
      "aggregate",
      "groupBy",
      "update",
      "updateMany",
      "delete",
      "deleteMany",
    ];

    if (whereOps.includes(operation)) {
      a.where = { ...(a.where || {}), shopId };
      return query(a);
    }

    if (operation === "create") {
      a.data = { ...(a.data || {}), shopId };
      return query(a);
    }

    if (operation === "createMany") {
      if (Array.isArray(a.data)) {
        a.data = a.data.map((item: any) => ({ ...item, shopId }));
      } else if (a.data) {
        a.data = { ...a.data, shopId };
      }
      return query(a);
    }

    if (operation === "upsert") {
      a.where = { ...(a.where || {}), shopId };
      a.create = { ...(a.create || {}), shopId };
      return query(a);
    }

    // Fallback — no injection (e.g. $queryRaw, $executeRaw)
    return query(args);
  };
}

/**
 * Returns an extended Prisma Client that enforces tenant isolation.
 *
 * shopId is injected ONLY into tenant-scoped models:
 * NewProductTemplate, UsedProduct, Booking.
 *
 * Global models (Shop, User, ShopAdmin, Branch, ProductVariant)
 * are NOT affected.
 *
 * @param shopId — The unique identifier of the tenant shop.
 * @throws Error if shopId is empty or falsy.
 */
export function getTenantPrisma(shopId?: string | null) {
  if (!shopId) {
    return prisma;
  }

  const handler = tenantQueryHandler(shopId);

  return prisma.$extends({
    query: {
      newProductTemplate: {
        async $allOperations(params: any) {
          return handler(params);
        },
      },
      usedProduct: {
        async $allOperations(params: any) {
          return handler(params);
        },
      },
      booking: {
        async $allOperations(params: any) {
          return handler(params);
        },
      },
    },
  });
}

export default prisma;

