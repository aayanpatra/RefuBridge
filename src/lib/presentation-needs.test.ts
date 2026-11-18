import assert from "node:assert/strict";
import test from "node:test";
import {
  createPresentationNeeds,
  PRESENTATION_NEEDS_PER_REFRESH,
} from "./presentation-needs";

test("creates open, unfunded demo needs attached to existing profiles", () => {
  let value = 0;
  const random = () => {
    value = (value + 0.381966) % 1;
    return value;
  };
  const refugeeIds = ["refugee-1", "refugee-2", "refugee-3"];

  const needs = createPresentationNeeds(refugeeIds, random);

  assert.equal(needs.length, PRESENTATION_NEEDS_PER_REFRESH);
  assert.equal(new Set(needs.map((need) => need.id)).size, needs.length);
  for (const need of needs) {
    assert.ok(refugeeIds.includes(need.refugeeId));
    assert.ok(["FOOD", "MEDICINE", "SHELTER"].includes(need.category));
    assert.ok(need.item.length > 0);
    assert.ok(need.costAed > 0);
    assert.ok(need.stockLeft > 0);
    assert.ok(need.dailyUse > 0);
    assert.equal(need.fundedAed, 0);
    assert.equal(need.status, "OPEN");
  }
});

test("requires at least one profile for demo needs", () => {
  assert.throws(() => createPresentationNeeds([]), RangeError);
});
