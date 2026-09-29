# Montemurlo geographic extract

© OpenStreetMap contributors — https://www.openstreetmap.org/copyright

The geographic database in montemurlo.json is a derivative of OpenStreetMap data,
provided under Open Database License 1.0:
https://opendatacommons.org/licenses/odbl/1-0/

Source and retrieval date are embedded in the JSON. This file is distributed with
the application at /data/montemurlo.json. Source extraction code: scripts/import-osm.py.
Buildings preserve explicit OSM heights or levels × 3 m. Where possible, unrecorded heights are estimated from Regione Toscana DSM 2021 minus DTM 2008–2010 (CC BY 4.0); remaining values use an explicitly estimated 8 m. Derived-source attribution and limitations: [world/SOURCES.md](world/SOURCES.md).
The extract is incomplete: it is not cadastral data, and it is not the Cesium tileset.
Game signals, portals and interiors are fictional and are not OSM data.
