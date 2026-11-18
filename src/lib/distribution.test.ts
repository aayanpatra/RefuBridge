import assert from "node:assert/strict";
import test from "node:test";
import { planDistribution } from "./distribution";

test("funds Sam's more urgent medicine need before Bob's", () => {
  const funding = planDistribution(
    [
      {
        id: "bob",
        ngoId: "ngo-1",
        category: "MEDICINE",
        costAed: 5,
        fundedAed: 0,
        stockLeft: 5,
        dailyUse: 1,
      },
      {
        id: "sam",
        ngoId: "ngo-2",
        category: "MEDICINE",
        costAed: 6,
        fundedAed: 0,
        stockLeft: 2,
        dailyUse: 1,
      },
    ],
    10,
  );

  assert.deepEqual(
    funding.map(({ needId, amountAed, fundingOrder }) => ({
      needId,
      amountAed,
      fundingOrder,
    })),
    [
      { needId: "sam", amountAed: 6, fundingOrder: 1 },
      { needId: "bob", amountAed: 4, fundingOrder: 2 },
    ],
  );
  assert.ok(funding[0].urgencyScore > funding[1].urgencyScore);
});

test("prefers the cheaper need when urgency is tied", () => {
  const funding = planDistribution(
    [
      {
        id: "expensive",
        ngoId: "ngo-1",
        category: "FOOD",
        costAed: 20,
        fundedAed: 0,
        stockLeft: 4,
        dailyUse: 1,
      },
      {
        id: "cheap",
        ngoId: "ngo-2",
        category: "FOOD",
        costAed: 10,
        fundedAed: 0,
        stockLeft: 4,
        dailyUse: 1,
      },
    ],
    10,
  );

  assert.equal(funding[0].needId, "cheap");
});
