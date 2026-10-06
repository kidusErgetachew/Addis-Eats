export const deliveryAreas = {
  Bole: { fee: 50, estimate: "25–35 min" },
  Kazanchis: { fee: 60, estimate: "30–40 min" },
  Piassa: { fee: 70, estimate: "35–45 min" },
  "Arat Kilo": { fee: 70, estimate: "35–45 min" },
  CMC: { fee: 90, estimate: "40–55 min" },
  "Sar Bet": { fee: 60, estimate: "30–40 min" },
};
export function deliveryEstimate(area) {
  return Object.hasOwn(deliveryAreas, area) ? deliveryAreas[area] : null;
}
