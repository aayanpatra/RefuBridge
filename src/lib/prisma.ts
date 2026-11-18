import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl?.startsWith("libsql://") || databaseUrl?.startsWith("https://")) {
    return new PrismaClient({
      adapter: new PrismaLibSQL({
        url: databaseUrl,
        authToken: process.env.DATABASE_AUTH_TOKEN,
      }),
    });
  }

  return new PrismaClient();
};

declare const globalThis: typeof global & {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
};

let productionPrisma: ReturnType<typeof prismaClientSingleton> | undefined;

function getPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  const isRemoteDatabase =
    databaseUrl?.startsWith("libsql://") || databaseUrl?.startsWith("https://");

  if (process.env.VERCEL && !isRemoteDatabase) {
    throw new Error("Set DATABASE_URL to a persistent Turso/libSQL URL in Vercel.");
  }
  if (isRemoteDatabase && !process.env.DATABASE_AUTH_TOKEN) {
    throw new Error("Set DATABASE_AUTH_TOKEN to connect to the Turso/libSQL database.");
  }

  if (process.env.NODE_ENV === "production") {
    productionPrisma ??= prismaClientSingleton();
    return productionPrisma;
  }

  globalThis.prismaGlobal ??= prismaClientSingleton();
  return globalThis.prismaGlobal;
}

const prisma = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
