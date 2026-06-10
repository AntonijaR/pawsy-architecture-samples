## Candidate narrowing

Pawsy first filters at the user level instead of the dog level.

This keeps the matching query smaller because one dog owner may have multiple dogs. After eligible users are identified, the system fetches only the dogs belonging to those users and applies the compatibility scoring pipeline.

The geospatial filter uses a two-stage approach:

1. Bounding-box filters in the database
2. Exact Haversine distance checks in application code

The system also applies reciprocal visibility: both users must be inside each other's chosen visibility radius.