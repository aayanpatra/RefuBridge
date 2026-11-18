import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const demoAmounts = [25, 50, 75, 100, 150, 250, 500];

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const amountAed = demoAmounts[Math.floor(Math.random() * demoAmounts.length)];
    const donor = await prisma.donor.create({
      data: {
        name: "Demo Supporter",
        email: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`,
      },
    });
    const donation = await prisma.donation.create({
      data: { donorId: donor.id, amountAed, status: "PENDING" },
      select: { id: true, amountAed: true },
    });

    return Response.json({ donation }, { status: 201 });
  } catch (error) {
    console.error("Failed to simulate donation:", error);
    return Response.json({ error: "Unable to simulate a donation right now." }, { status: 500 });
  }
}
