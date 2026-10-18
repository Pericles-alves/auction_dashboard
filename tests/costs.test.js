import test from 'node:test';
import assert from 'node:assert/strict';
import { estimate } from '../web/costs.js';
const scenario = { bid: 20000, commission: 5, tax: 0, transport: 1000, docs: 750, repairs: 1500, other: 0, resale: 34000, selling: 1000, target: 20 };
test('includes fixed costs and selling expenses', () => {
  const r = estimate(scenario); assert.equal(r.total, 24250); assert.equal(r.profit, 8750); assert.ok(Math.abs(r.roi - 36.0824742268) < 1e-8);
});
test('maximum bid achieves target ROI', () => {
  const r = estimate({ ...scenario, bid: estimate(scenario).maxBid }); assert.ok(r.roi >= 20 && r.roi < 20.001);
});
test('unaffordable fixed costs produce no feasible bid', () => { assert.equal(estimate({ ...scenario, repairs: 40000 }).maxBid, null); });
test('zero acquisition cost has no ROI', () => { assert.equal(estimate({ ...scenario, bid: 0, transport: 0, docs: 0, repairs: 0 }).roi, null); });
test('rejects invalid values', () => { for (const bid of [-1, NaN, Infinity, '20000', undefined]) assert.throws(() => estimate({ ...scenario, bid }), RangeError); });
