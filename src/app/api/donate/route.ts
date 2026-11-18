import prisma from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return Response.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const amount = payload.amount;

  if (!name || name.length > 120) {
    return Response.json({ error: "Name is required and must be 120 characters or fewer." }, { status: 422 });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "A valid email address is required." }, { status: 422 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 1) {
    return Response.json({ error: "Amount must be a number of at least 1 AED." }, { status: 422 });
  }

  try {
    const donor = await prisma.donor.upsert({
      where: { email },
      update: { name },
      create: { name, email },
    });
    const donation = await prisma.donation.create({
      data: { donorId: donor.id, amountAed: amount, status: "PENDING" },
      include: { donor: true },
    });

    return Response.json({ donation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create donation:", error);
    return Response.json({ error: "Unable to process donation right now." }, { status: 500 });
  }
}
