import { prisma } from "@/lib/prisma";

export async function getAppState() {
  return await prisma.appState.findUnique({
    where: { id: 'default' }
  });
}

export async function getContentVersion() {
  const appState = await getAppState();
  return appState?.contentVersion || 1;
}

export async function incrementContentVersion() {
  const currentVersion = await getContentVersion();
  return await prisma.appState.upsert({
    where: { id: 'default' },
    update: { contentVersion: currentVersion + 1 },
    create: { id: 'default', contentVersion: currentVersion + 1 }
  });
}
