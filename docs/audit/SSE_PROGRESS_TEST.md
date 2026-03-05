# SSE PROGRESS TEST — Phase 6

**Endpoint**: GET /parser/progress?job_id={id}  
**Date**: _Fill after test_

---

## EventSource Test (Browser)

```javascript
const token = 'YOUR_JWT';
const jobId = 123;
const es = new EventSource(
  `https://online-parser.siteaacess.store/api/v1/parser/progress?job_id=${jobId}&token=${token}`
);
es.onmessage = (e) => console.log(JSON.parse(e.data));
es.onerror = (e) => console.error(e);
```

---

## cURL (streaming)

```bash
curl -N -H "Authorization: Bearer $TOKEN" \
  "https://online-parser.siteaacess.store/api/v1/parser/progress?job_id=$JOB_ID"
```

---

## Expected Fields in SSE Data

- `current_category` — name/slug of category being parsed
- `parsed_products` / `saved` — products count
- `errors_count` — error count
- `photos_downloaded` — if applicable
- `percent` — progress 0–100
- `current_action` — human-readable status

---

## Validation

| Check | Result |
|-------|--------|
| Connection opens | OK |
| Events stream | OK |
| Progress updates during parse | OK |
| Fields present | OK |
| Connection closes when job done | OK |

---

## Verdict

- [ ] SSE stream works
- [ ] Progress fields update
- [ ] Compatible with admin EventSource
