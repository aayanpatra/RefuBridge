import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

type FraudCandidate = Pick<Prisma.FraudFlagCreateManyInput, "ngoId" | "refugeeId" | "type" | "note">;

function candidateKey(flag: FraudCandidate): string {
  const check = flag.note.split(":", 1)[0];
  const recordId = flag.note.match(/\b(?:need|allocation) ([^\s]+)/)?.[1] ?? "";
  return `${flag.type}|${flag.ngoId ?? ""}|${flag.refugeeId ?? ""}|${check}|${recordId}`;
}

export async function scanForFraud() {
  const flaggedBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const [ngos, refugees, needs, staleAllocations, existingFlags] = await Promise.all([
      tx.ngo.findMany({
        select: {
          id: true,
          name: true,
          verified: true,
          allocations: { select: { id: true } },
          refugees: { select: { id: true, needs: { select: { id: true } } } },
        },
      }),
      tx.refugee.findMany({
        select: { id: true, externalId: true },
      }),
      tx.need.findMany({
        select: { id: true, refugeeId: true, costAed: true },
      }),
      tx.allocation.findMany({
        where: { createdAt: { lt: flaggedBefore }, spentAed: 0 },
        select: {
          id: true,
          ngoId: true,
          need: { select: { id: true, refugeeId: true } },
        },
      }),
      tx.fraudFlag.findMany({
        select: { ngoId: true, refugeeId: true, type: true, note: true },
      }),
    ]);

    const candidates: FraudCandidate[] = [];

    for (const ngo of ngos) {
      if (!ngo.verified && ngo.allocations.length > 0) {
        candidates.push({
          ngoId: ngo.id,
          type: "UNUSUAL_PATTERN",
          note: `Background check: ${ngo.name} is unverified but holds ${ngo.allocations.length} allocation(s).`,
        });
      }
    }

    const refugeesByExternalId = new Map<string, typeof refugees>();
    for (const refugee of refugees) {
      const group = refugeesByExternalId.get(refugee.externalId) ?? [];
      group.push(refugee);
      refugeesByExternalId.set(refugee.externalId, group);
    }
    for (const [externalId, group] of refugeesByExternalId) {
      if (group.length > 1) {
        for (const refugee of group) {
          candidates.push({
            refugeeId: refugee.id,
            type: "DUPLICATE_RECORD",
            note: `Pattern recognition: external ID ${externalId} appears on ${group.length} refugee records.`,
          });
        }
      }
    }

    const ngoRatios = ngos
      .filter((ngo) => ngo.refugees.length > 0)
      .map((ngo) => ({
        ngo,
        ratio:
          ngo.refugees.reduce((count, refugee) => count + refugee.needs.length, 0) /
          ngo.refugees.length,
      }));
    const averageNeedsPerRefugee =
      ngoRatios.length === 0
        ? 0
        : ngoRatios.reduce((sum, entry) => sum + entry.ratio, 0) / ngoRatios.length;
    for (const { ngo, ratio } of ngoRatios) {
      if (averageNeedsPerRefugee > 0 && ratio > averageNeedsPerRefugee * 2) {
        candidates.push({
          ngoId: ngo.id,
          type: "UNUSUAL_PATTERN",
          note: `Pattern recognition: ${ngo.name} has ${ratio.toFixed(2)} needs per refugee, over 2x the NGO average of ${averageNeedsPerRefugee.toFixed(2)}.`,
        });
      }
    }

    for (const need of needs) {
      if (need.costAed === null || !Number.isFinite(need.costAed) || need.costAed <= 0) {
        candidates.push({
          refugeeId: need.refugeeId,
          type: "NO_PROOF_OF_NEED",
          note: `Proof of need: need ${need.id} has missing, zero, or invalid cost data.`,
        });
      }
    }

    for (const allocation of staleAllocations) {
      candidates.push({
        ngoId: allocation.ngoId,
        refugeeId: allocation.need.refugeeId,
        type: "NO_PROOF_OF_SPEND",
        note: `Proof of expenditure: allocation ${allocation.id} is over 7 days old with no recorded spending.`,
      });
    }

    const existingKeys = new Set(existingFlags.map(candidateKey));
    const newFlags: FraudCandidate[] = [];
    for (const candidate of candidates) {
      const key = candidateKey(candidate);
      if (!existingKeys.has(key)) {
        newFlags.push(candidate);
        existingKeys.add(key);
      }
    }
    if (newFlags.length > 0) {
      await tx.fraudFlag.createMany({ data: newFlags });
    }

    return { createdCount: newFlags.length, flags: newFlags };
  });
}
