export function estimate(input) {
  const { bid, commission, tax, transport, docs, repairs, other, resale, selling, target } = input;
  for (const value of [bid, commission, tax, transport, docs, repairs, other, resale, selling, target]) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new RangeError('Informe valores finitos e não negativos.');
  }
  const fixed = transport + docs + repairs + other;
  const total = bid * (1 + commission / 100 + tax / 100) + fixed;
  const profit = resale - total - selling;
  const ceiling = ((resale - selling) / (1 + target / 100) - fixed) / (1 + commission / 100 + tax / 100);
  return { total, profit, roi: total ? profit / total * 100 : null, maxBid: ceiling < 0 ? null : Math.floor(ceiling * 100) / 100 };
}
