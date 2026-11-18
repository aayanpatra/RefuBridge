import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createPresentationNeeds,
  PRESENTATION_NEEDS_PER_REFRESH,
} from "@/lib/presentation-needs";

export const maxDuration = 30;

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

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

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

      const presentationDonors = contributionsAed.map((amountAed, index) => ({
        amountAed,
        name: `Presentation Supporter ${String(index + 1).padStart(2, "0")}`,
        email: `presentation-supporter-${String(index + 1).padStart(2, "0")}@example.test`,
      }));
      const donorEmails = presentationDonors.map(({ email }) => email);
      const existingDonors = await tx.donor.findMany({
        where: { email: { in: donorEmails } },
        select: { email: true },
      });
      const existingEmails = new Set(existingDonors.map(({ email }) => email));
      const newDonors = presentationDonors
        .filter(({ email }) => !existingEmails.has(email))
        .map(({ name, email }) => ({ name, email }));
      if (newDonors.length > 0) {
        await tx.donor.createMany({ data: newDonors });
      }

      const donors = await tx.donor.findMany({
        where: { email: { in: donorEmails } },
        select: { id: true, email: true },
      });
      const donorIdsByEmail = new Map<string, string>();
      for (const donor of donors) {
        donorIdsByEmail.set(donor.email, donor.id);
      }
      const donations = presentationDonors.map(({ amountAed, email }) => {
        const donorId = donorIdsByEmail.get(email);
        if (!donorId) throw new Error(`Missing presentation donor ${email}.`);
        return { donorId, amountAed, status: "PENDING" };
      });
      await tx.donation.createMany({ data: donations });

      return {
        replacedCount: removed.count,
        addedCount: contributionsAed.length,
        totalAed: contributionsAed.reduce((sum, amount) => sum + amount, 0),
        addedNeedsCount: PRESENTATION_NEEDS_PER_REFRESH,
      };
    }, { timeout: 30_000 });

    return Response.json(result);
  } catch (error) {
    console.error("Failed to refresh the presentation donation pool:", error);
    return Response.json({ error: "Unable to refresh the presentation pool right now." }, { status: 500 });
  }
}
