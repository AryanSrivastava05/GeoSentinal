"""Site carrying capacity. Prototype assumption: area_per_person_m2 (default 25)."""

from __future__ import annotations

import math


def capacity_people(usable_area_m2: float, area_per_person_m2: float) -> int:
    """capacity_people = floor(usable_area_m2 / area_per_person_m2).

    Not a universal evacuation standard. Configurable in settings.json.
    """
    if area_per_person_m2 <= 0:
        raise ValueError("area_per_person_m2 must be positive.")
    if usable_area_m2 is None or usable_area_m2 <= 0:
        return 0
    return math.floor(float(usable_area_m2) / float(area_per_person_m2))
