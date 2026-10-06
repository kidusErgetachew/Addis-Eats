export function orderAnalytics(orders) {
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const counts = { pending: 0, preparing: 0, delivering: 0, delivered: 0 };
  const dishCounts = new Map();
  for (const order of orders) {
    counts[order.status] += 1;
    for (const item of order.items) {
      const previous = dishCounts.get(item.id) || {
        id: item.id,
        name: item.name,
        quantity: 0,
        revenue: 0,
      };
      dishCounts.set(item.id, {
        ...previous,
        quantity: previous.quantity + item.quantity,
        revenue: previous.revenue + item.price * item.quantity,
      });
    }
  }
  return {
    revenue,
    count: orders.length,
    average: orders.length ? revenue / orders.length : 0,
    counts,
    top: [...dishCounts.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  };
}
