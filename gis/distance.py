"""Prototype geographic distance.

Uses WGS84 geodesic (metres) via pyproj — not planar degrees.
This is a straight-line (great-circle) prototype measure, NOT road-network travel distance.
Swap DistanceEngine implementations later for OSM routing / travel time.
"""

from __future__ import annotations

from typing import Protocol

from pyproj import Geod

_GEOD = Geod(ellps="WGS84")


class DistanceEngine(Protocol):
    def distance_km(self, lon1: float, lat1: float, lon2: float, lat2: float) -> float:
        ...


class GeodesicDistanceEngine:
    """Straight-line geodesic distance on the WGS84 ellipsoid."""

    def distance_km(self, lon1: float, lat1: float, lon2: float, lat2: float) -> float:
        # inv returns forward azimuth, back azimuth, distance in metres
        _az12, _az21, metres = _GEOD.inv(lon1, lat1, lon2, lat2)
        return metres / 1000.0


_DEFAULT = GeodesicDistanceEngine()


def distance_km(lon1: float, lat1: float, lon2: float, lat2: float, engine: DistanceEngine | None = None) -> float:
    impl = engine or _DEFAULT
    return impl.distance_km(lon1, lat1, lon2, lat2)
