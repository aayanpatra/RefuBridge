import prisma from "@/lib/prisma";

export type DistributableNeed = {
  id: string;
  category: string;
  costAed: number | null;
  fundedAed: number;
  stockLeft: number;
  dailyUse: number;
  ngoId: string;
};

export type PlannedFunding = {
  needId: string;
  ngoId: string;
  amountAed: number;
  urgencyScore: number;
  fundingOrder: number;
};

type FundedNeedSummary = {
  needId: string;
  refugeeExternalId: string;
  refugeeName: string;
  category: string;
  item: string;
  amountAed: number;
  urgencyScore: number;
  fundingOrder: number;
};

const categoryWeights: Record<string, number> = {
  MEDICINE: 1.15,
  FOOD: 1.1,
  SHELTER: 1,
};

function urgencyScore(need: DistributableNeed): number {
  const daysLeft = Math.max(0, need.stockLeft) / Math.max(need.dailyUse, 1);
  const weight = categoryWeights[need.category] ?? 1;
  return weight / (daysLeft + 1);
}

export function planDistribution(
  needs: DistributableNeed[],
  poolAed: number,
): PlannedFunding[] {
  if (!Number.isFinite(poolAed) || poolAed < 0) {
    throw new RangeError("The distribution pool must be a finite, non-negative amount.");
  }

  const rankedNeeds = needs
    .filter(
      (need): need is DistributableNeed & { costAed: number } =>
        need.costAed !== null &&
        Number.isFinite(need.costAed) &&
        need.costAed > 0 &&
        need.costAed > need.fundedAed,
    )
    .map((need) => ({
      need,
      urgencyScore: urgencyScore(need),
      remainingAed: need.costAed - need.fundedAed,
    }))
    .sort(
      (left, right) =>
        right.urgencyScore - left.urgencyScore ||
        left.need.costAed - right.need.costAed ||
        left.need.id.localeCompare(right.need.id),
    );

  let remainingPoolAed = poolAed;
  const funding: PlannedFunding[] = [];

  for (const candidate of rankedNeeds) {
    if (remainingPoolAed <= 0) {
      break;
    }

    const amountAed = Math.min(candidate.remainingAed, remainingPoolAed);
    if (amountAed <= 0) {
      continue;
    }

    funding.push({
      needId: candidate.need.id,
      ngoId: candidate.need.ngoId,
      amountAed,
      urgencyScore: candidate.urgencyScore,
      fundingOrder: funding.length + 1,
    });
    remainingPoolAed -= amountAed;
  }

  return funding;
}

export async function runDistribution() {
  return prisma.$transaction(async (tx) => {
    const [donations, openNeeds] = await Promise.all([
      tx.donation.findMany({
        where: { status: "PENDING" },
        select: { id: true, amountAed: true },
      }),
      tx.need.findMany({
        where: { status: "OPEN" },
        include: {
          refugee: {
            select: {
              name: true,
              externalId: true,
              ngo: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    const poolAed = donations.reduce((total, donation) => {
      if (!Number.isFinite(donation.amountAed) || donation.amountAed < 0) {
        throw new Error(`Donation ${donation.id} has an invalid amount.`);
      }
      return total + donation.amountAed;
    }, 0);
    const needsById = new Map(openNeeds.map((need) => [need.id, need]));
    const funding = planDistribution(
      openNeeds.map((need) => ({
        id: need.id,
        category: need.category,
        costAed: need.costAed,
        fundedAed: need.fundedAed,
        stockLeft: need.stockLeft,
        dailyUse: need.dailyUse,
        ngoId: need.refugee.ngo.id,
      })),
      poolAed,
    );
    const totalDistributedAed = funding.reduce((total, item) => total + item.amountAed, 0);
    const run = await tx.distributionRun.create({
      data: {
        totalDistributedAed,
        totalDonationsCount: donations.length,
      },
    });

    const fundedNeeds: FundedNeedSummary[] = [];
    const allocationsByNgo = new Map<
      string,
      { ngoId: string; ngoName: string; needs: FundedNeedSummary[] }
    >();

    for (const item of funding) {
      const need = needsById.get(item.needId);
      if (!need || need.costAed === null) {
        throw new Error(`Need ${item.needId} changed while the distribution was running.`);
      }

      await tx.allocation.create({
        data: {
          needId: need.id,
          ngoId: item.ngoId,
          amountAed: item.amountAed,
          distributionRunId: run.id,
        },
      });
      await tx.need.update({
        where: { id: need.id },
        data: {
          fundedAed: { increment: item.amountAed },
          status: need.fundedAed + item.amountAed >= need.costAed ? "FUNDED" : "OPEN",
        },
      });

      const fundedNeed: FundedNeedSummary = {
        needId: need.id,
        refugeeExternalId: need.refugee.externalId,
        refugeeName: need.refugee.name,
        category: need.category,
        item: need.item,
        amountAed: item.amountAed,
        urgencyScore: item.urgencyScore,
        fundingOrder: item.fundingOrder,
      };
      fundedNeeds.push(fundedNeed);

      const ngoAllocations = allocationsByNgo.get(item.ngoId) ?? {
        ngoId: item.ngoId,
        ngoName: need.refugee.ngo.name,
        needs: [],
      };
      ngoAllocations.needs.push(fundedNeed);
      allocationsByNgo.set(item.ngoId, ngoAllocations);
    }

    if (funding.length > 0 && donations.length > 0) {
      await tx.donation.updateMany({
        where: { id: { in: donations.map((donation) => donation.id) }, status: "PENDING" },
        data: { status: "DISTRIBUTED" },
      });
    }

    return {
      runId: run.id,
      poolAed,
      totalDistributedAed,
      unallocatedAed: poolAed - totalDistributedAed,
      donationsProcessed: funding.length > 0 ? donations.length : 0,
      fundedNeeds,
      ngos: [...allocationsByNgo.values()],
    };
  });
}
