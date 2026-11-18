import { scanForFraud } from "@/lib/fraud";

export async function POST() {
  try {
    const result = await scanForFraud();
    return Response.json(result);
  } catch (error) {
    console.error("Failed to scan for fraud:", error);
    return Response.json({ error: "Unable to scan for fraud right now." }, { status: 500 });
  }
}
