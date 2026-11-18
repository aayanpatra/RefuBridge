import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [
      donations,
      donationAmounts,
      donationTotals,
      donationCount,
      pendingTotals,
      distributedTotals,
      needs,
      ngos,
      refugees,
      allocations,
      categoryAllocations,
      fraudFlags,
    ] = await Promise.all([
      prisma.donation.findMany({
        include: { donor: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.donation.findMany({ select: { amountAed: true } }),
      prisma.donation.aggregate({ _sum: { amountAed: true } }),
      prisma.donation.count(),
      prisma.donation.aggregate({
        where: { status: "PENDING" },
        _sum: { amountAed: true },
      }),
      prisma.donation.aggregate({
        where: { status: "DISTRIBUTED" },
        _sum: { amountAed: true },
      }),
      prisma.need.findMany({
        include: {
          refugee: {
            select: { id: true, name: true, externalId: true, ngo: { select: { name: true } } },
          },
        },
        orderBy: [{ status: "asc" }, { category: "asc" }],
      }),
      prisma.ngo.findMany({
        include: {
          _count: { select: { refugees: true } },
          allocations: {
            select: { amountAed: true, distributionRunId: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.refugee.findMany({
        include: {
          ngo: { select: { name: true } },
          needs: { select: { id: true, item: true, category: true, costAed: true, fundedAed: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.allocation.findMany({
        include: {
          ngo: { select: { name: true } },
          need: { include: { refugee: { select: { name: true, externalId: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.allocation.findMany({
        select: { amountAed: true, need: { select: { category: true } } },
      }),
      prisma.fraudFlag.findMany({
        include: {
          ngo: { select: { name: true } },
          refugee: { select: { name: true, externalId: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    const days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
        amountAed: 0,
      };
    });
    const dayIndex = new Map(days.map((day, index) => [day.date, index]));
    const recentDonations = await prisma.donation.findMany({
      where: { createdAt: { gte: start } },
      select: { amountAed: true, createdAt: true },
    });
    for (const donation of recentDonations) {
      const index = dayIndex.get(donation.createdAt.toISOString().slice(0, 10));
      if (index !== undefined) days[index].amountAed += donation.amountAed;
    }

    const brackets = [
      { label: "AED 1–99", min: 0, max: 100 },
      { label: "AED 100–249", min: 100, max: 250 },
      { label: "AED 250–499", min: 250, max: 500 },
      { label: "AED 500–999", min: 500, max: 1000 },
      { label: "AED 1,000+", min: 1000, max: Number.POSITIVE_INFINITY },
    ].map(({ label, min, max }) => ({
      label,
      count: donationAmounts.filter(({ amountAed }) => amountAed >= min && amountAed < max).length,
    }));

    const categoryAmounts = new Map<string, number>();
    for (const allocation of categoryAllocations) {
      categoryAmounts.set(
        allocation.need.category,
        (categoryAmounts.get(allocation.need.category) ?? 0) + allocation.amountAed,
      );
    }

    return Response.json({
      stats: {
        totalDonatedAed: donationTotals._sum.amountAed ?? 0,
        donationCount,
        averageDonationAed:
          donationCount === 0 ? 0 : (donationTotals._sum.amountAed ?? 0) / donationCount,
        pendingPoolAed: pendingTotals._sum.amountAed ?? 0,
        totalDistributedAed: distributedTotals._sum.amountAed ?? 0,
        openNeeds: needs.filter((need) => need.status === "OPEN").length,
        flaggedItems: fraudFlags.length,
      },
      timeseries: days,
      amountBrackets: brackets,
      categoryBreakdown: ["MEDICINE", "FOOD", "SHELTER"].map((category) => ({
        label: category,
        amountAed: categoryAmounts.get(category) ?? 0,
      })),
      ngoFunding: ngos.map((ngo) => ({
        id: ngo.id,
        name: ngo.name,
        amountAed: ngo.allocations.reduce((total, allocation) => total + allocation.amountAed, 0),
      })),
      donations: donations.map((donation) => ({
        id: donation.id,
        donor: donation.donor.name,
        email: donation.donor.email,
        amountAed: donation.amountAed,
        status: donation.status,
        createdAt: donation.createdAt,
      })),
      ngos: ngos.map((ngo) => ({
        id: ngo.id,
        name: ngo.name,
        country: ngo.country,
        verified: ngo.verified,
        refugees: ngo._count.refugees,
        allocatedAed: ngo.allocations.reduce((total, allocation) => total + allocation.amountAed, 0),
        latestRunId: ngo.allocations[0]?.distributionRunId ?? null,
      })),
      refugees: refugees.map((refugee) => ({
        id: refugee.id,
        name: refugee.name,
        externalId: refugee.externalId,
        ngo: refugee.ngo.name,
        needs: refugee.needs.length,
        openNeeds: refugee.needs.filter((need) => need.status === "OPEN").length,
        fundedAed: refugee.needs.reduce((total, need) => total + need.fundedAed, 0),
        requestedAed: refugee.needs.reduce((total, need) => total + (need.costAed ?? 0), 0),
      })),
      needs: needs.map((need) => ({
        id: need.id,
        refugee: need.refugee.name,
        externalId: need.refugee.externalId,
        ngo: need.refugee.ngo.name,
        item: need.item,
        category: need.category,
        costAed: need.costAed ?? 0,
        fundedAed: need.fundedAed,
        status: need.status,
      })),
      allocations: allocations.map((allocation) => ({
        id: allocation.id,
        ngo: allocation.ngo.name,
        refugee: allocation.need.refugee.name,
        externalId: allocation.need.refugee.externalId,
        item: allocation.need.item,
        category: allocation.need.category,
        amountAed: allocation.amountAed,
        spentAed: allocation.spentAed,
        createdAt: allocation.createdAt,
      })),
      fraudFlags: fraudFlags.map((flag) => ({
        id: flag.id,
        type: flag.type,
        note: flag.note,
        ngo: flag.ngo?.name ?? "—",
        refugee: flag.refugee?.name ?? "—",
        externalId: flag.refugee?.externalId ?? "",
        createdAt: flag.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to load admin dashboard:", error);
    return Response.json({ error: "Unable to load dashboard data right now." }, { status: 500 });
  }
}
