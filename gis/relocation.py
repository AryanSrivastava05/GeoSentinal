"""Ranked population allocation onto accepted sites. Never hide unallocated people.

Strategy (modular): greedy fill of ranked sites, then per-village assignment by
descending risk_score. Replace allocate_ranked() later with a route-aware solver.
"""

from __future__ import annotations

from typing import Any


def allocate_ranked(
    affected_villages: list[dict[str, Any]],
    ranked_sites: list[dict[str, Any]],
) -> dict[str, Any]:
    remaining = {s["site_id"]: int(s.get("capacity") or 0) for s in ranked_sites}
    site_meta = {s["site_id"]: s for s in ranked_sites}

    villages = sorted(
        affected_villages,
        key=lambda v: (-float(v.get("risk_score") or 0), str(v.get("village_id"))),
    )

    by_village: list[dict[str, Any]] = []
    by_site: dict[str, int] = {s["site_id"]: 0 for s in ranked_sites}
    unallocated_total = 0
    unallocated_villages: list[dict[str, Any]] = []

    for village in villages:
        pop = int(village.get("population") or 0)
        left = pop
        for site in ranked_sites:
            if left <= 0:
                break
            sid = site["site_id"]
            take = min(left, remaining[sid])
            if take <= 0:
                continue
            remaining[sid] -= take
            by_site[sid] += take
            by_village.append(
                {
                    "village_id": village.get("village_id"),
                    "village_name": village.get("village_name"),
                    "village_population": pop,
                    "assigned_site": sid,
                    "assigned_site_name": site.get("name"),
                    "assigned_population": take,
                    "distance_km": site.get("distance_by_village", {}).get(
                        village.get("village_id"), site.get("distance_km")
                    ),
                }
            )
            left -= take
        if left > 0:
            unallocated_total += left
            unallocated_villages.append(
                {
                    "village_id": village.get("village_id"),
                    "village_name": village.get("village_name"),
                    "unallocated_population": left,
                }
            )

    site_rows = []
    for site in ranked_sites:
        sid = site["site_id"]
        allocated = by_site[sid]
        cap = int(site.get("capacity") or 0)
        if allocated > cap:
            raise RuntimeError(f"Allocation exceeded capacity for {sid}")
        site_rows.append(
            {
                "site_id": sid,
                "name": site.get("name"),
                "capacity": cap,
                "allocated": allocated,
                "remaining_capacity": cap - allocated,
            }
        )

    affected = sum(int(v.get("population") or 0) for v in villages)
    return {
        "affected_population": affected,
        "allocated_population": affected - unallocated_total,
        "unallocated_population": unallocated_total,
        "by_site": site_rows,
        "by_village": by_village,
        "unallocated_villages": unallocated_villages,
        "site_meta": site_meta,
    }
