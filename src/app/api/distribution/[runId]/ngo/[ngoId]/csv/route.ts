import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ runId: string; ngoId: string }>;
};

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(request: Request, { params }: RouteContext) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { runId, ngoId } = await params;

  try {
    const [run, ngo, allocations] = await Promise.all([
      prisma.distributionRun.findUnique({ where: { id: runId }, select: { id: true } }),
      prisma.ngo.findUnique({ where: { id: ngoId }, select: { id: true } }),
      prisma.allocation.findMany({
        where: { distributionRunId: runId, ngoId },
        include: { need: { include: { refugee: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!run || !ngo) {
      return Response.json({ error: "Distribution run or NGO not found." }, { status: 404 });
    }

    const rows = [
      ["refugee externalId", "refugee name", "category", "item", "amountAed", "note"],
      ...allocations.map(({ need, amountAed }) => [
        need.refugee.externalId,
        need.refugee.name,
        need.category,
        need.item,
        String(amountAed),
        `Reserved toward ${need.item}`,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="distribution.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export NGO distribution:", error);
    return Response.json({ error: "Unable to export the NGO distribution right now." }, { status: 500 });
  }
}
