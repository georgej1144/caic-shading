FORECAST_INTERPRETER
- act on standard object


CAIC_API_REQUEST
- request caic zone endpoint and forecast endpoint
- get lat/lon and use to find regionID
- select regionID from full forecast list
- parse forecast object into standard form
- run interp on standard forecast form

NAC_API_REQUEST
- request map-layer for zone geometies
- get lat/lon and use to find centerID and zoneID
- if LATEST
    - request product?type=forecast&center_id=&zone_id=
- if HISTORIC
    - request products?avalanche_center_id=&date_start=2024-12-31&date_end=2025-01-1
- parse forecast object into standard form
- run interp on standard forecast form

## product?type=forecast&center_id=[center_id]&zone_id=[zone_id]

cannot specify date range, only returns latest report

type can be `forecast` or `weather`

needs zone_id and center_id
https://api.avalanche.org/v2/public/product?type=forecast&center_id=BTAC&zone_id=2121

---

## products?avalanche_center_id=

specify center_id to get all reports from that center
```
https://api.avalanche.org/v2/public/products?avalanche_center_id=BTAC
```

filter date range \(date_start,date_end\]
```
&date_start=2025-01-01&date_end=2025-02-1
```

---

## products/map-layer?day=

if day empty, returns latest

takes day in YYYY-MM-DD

doesnt have crested butte??

empty day returns latest

```
https://api.avalanche.org/v2/public/products/map-layer?day=
```

---

## products/map-layer/[zone_id]?day=

must request `CBAC` from this to get CB data, because!

CB zone geometry is likely? static. we can probably cache the boundry and only request if needed?

filter date WORKS YYYY-MM-DD
