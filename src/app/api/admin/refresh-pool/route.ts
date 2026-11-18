import prisma from "@/lib/prisma";
import {
  createPresentationNeeds,
  PRESENTATION_NEEDS_PER_REFRESH,
} from "@/lib/presentation-needs";

const contributionsAed = [
  500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500,
  500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500,
  1000, 1000, 1000,
];

const fallbackProfiles = [
  { id: "presentation-refugee-01", name: "Demo profile 01", externalId: "RB-DEMO-001" },
  { id: "presentation-refugee-02", name: "Demo profile 02", externalId: "RB-DEMO-002" },
  { id: "presentation-refugee-03", name: "Demo profile 03", externalId: "RB-DEMO-003" },
  { id: "presentation-refugee-04", name: "Demo profile 04", externalId: "RB-DEMO-004" },
  { id: "presentation-refugee-05", name: "Demo profile 05", externalId: "RB-DEMO-005" },
  { id: "presentation-refugee-06", name: "Demo profile 06", externalId: "RB-DEMO-006" },
];

export async function POST() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const removed = await tx.donation.deleteMany({ where: { status: "PENDING" } });
      await tx.need.deleteMany({
        where: {
          id: { startsWith: "presentation-need-" },
          fundedAed: 0,
          allocations: { none: {} },
        },
      });

      const refugees = await tx.refugee.findMany({ select: { id: true } });
      if (refugees.length === 0) {
        const demoNgo = await tx.ngo.upsert({
          where: { id: "presentation-demo-ngo" },
          update: {},
          create: {
            id: "presentation-demo-ngo",
            name: "Presentation Demo Network",
            country: "Demo",
            verified: true,
          },
        });

        for (const profile of fallbackProfiles) {
          const refugee = await tx.refugee.upsert({
            where: { id: profile.id },
            update: {},
            create: {
              ...profile,
              ngoId: demoNgo.id,
              age: 30,
              gender: "Unspecified",
            },
          });
          refugees.push({ id: refugee.id });
        }
      }

      const needs = createPresentationNeeds(refugees.map(({ id }) => id));
      await tx.need.createMany({ data: needs });

      for (const [index, amountAed] of contributionsAed.entries()) {
        const name = `Presentation Supporter ${String(index + 1).padStart(2, "0")}`;
        const email = `presentation-supporter-${String(index + 1).padStart(2, "0")}@example.test`;
        const donor = await tx.donor.upsert({
          where: { email },
          update: { name },
          create: { name, email },
        });
        await tx.donation.create({
          data: { donorId: donor.id, amountAed, status: "PENDING" },
        });
      }

      return {
        replacedCount: removed.count,
        addedCount: contributionsAed.length,
        totalAed: contributionsAed.reduce((sum, amount) => sum + amount, 0),
        addedNeedsCount: PRESENTATION_NEEDS_PER_REFRESH,
      };
    });

    return Response.json(result);
  } catch (error) {
    console.error("Failed to refresh the presentation donation pool:", error);
    return Response.json({ error: "Unable to refresh the presentation pool right now." }, { status: 500 });
  }
}
