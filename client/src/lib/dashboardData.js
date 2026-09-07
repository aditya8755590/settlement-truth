export function deriveAuditView(metrics, records = []) {
  const hasAudit = Boolean(metrics && Number.isFinite(metrics.totalRecords));
  const total = metrics?.totalRecords || 0;
  const autoMatched = metrics?.autoMatched || 0;
  const byType = records.filter((r) => r.status === "Anomaly").reduce((map, record) => {
    const name = record.type || "Unclassified exception";
    map.set(name, (map.get(name) || 0) + 1);
    return map;
  }, new Map());
  const categories = [...byType].map(([name, count]) => ({ name, count }));
  return {
    hasAudit,
    total,
    autoMatched,
    matchRate: total ? Math.round((autoMatched / total) * 100) : 0,
    cashAtRisk: metrics?.cashAtRisk || 0,
    exceptions: metrics?.exceptionQueueCount || 0,
    categories,
  };
}
