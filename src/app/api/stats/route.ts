import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [
      donationTotals,
      donationCount,
      distributedTotals,
      pendingTotals,
      ngoCount,
      refugeeCount,
      openNeedCount,
    ] = await Promise.all([
      prisma.donation.aggregate({ _sum: { amountAed: true } }),
      prisma.donation.count(),
      prisma.donation.aggregate({
        where: { status: "DISTRIBUTED" },
        _sum: { amountAed: true },
      }),
      prisma.donation.aggregate({
        where: { status: "PENDING" },
        _sum: { amountAed: true },
      }),
      prisma.ngo.count(),
      prisma.refugee.count(),
      prisma.need.count({ where: { status: "OPEN" } }),
    ]);

    const totalDonatedAed = donationTotals._sum.amountAed ?? 0;

    return Response.json({
      totalDonatedAed,
      donationCount,
      averageDonationAed: donationCount === 0 ? 0 : totalDonatedAed / donationCount,
      ngoCount,
      refugeeCount,
      openNeedCount,
      totalDistributedAed: distributedTotals._sum.amountAed ?? 0,
      totalPendingAed: pendingTotals._sum.amountAed ?? 0,
    });
  } catch (error) {
    console.error("Failed to load platform stats:", error);
    return Response.json({ error: "Unable to load platform statistics right now." }, { status: 500 });
  }
}
