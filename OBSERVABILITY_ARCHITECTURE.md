# Observability Architecture

**Document type:** Platform-wide monitoring, logging, and alerting (no code)  
**Audience:** Architects, backend leads, DevOps, SRE  
**Context:** Aligns with PLATFORM_MASTER_ARCHITECTURE.md, INFRASTRUCTURE_ARCHITECTURE.md, API_ARCHITECTURE.md, and PLATFORM_EVENT_ARCHITECTURE.md. Defines how the platform is observed: metrics, logs, traces, alerting, and dashboards.

---

## STEP 1 — OBSERVABILITY PRINCIPLES

### 1.1 What observability is

Observability is the ability to **infer internal state and behavior** of the system from **external outputs**: metrics, logs, and traces. Together they answer: Is the platform healthy? Where did a request or job fail? Why is latency high? Is a queue backing up?

### 1.2 Metrics

- **Definition:** **Numeric measurements** over time: counters (e.g. requests total, errors total), gauges (e.g. queue size, active connections), and histograms or summaries (e.g. request duration p50/p95/p99). Metrics are **aggregated** (per endpoint, per service, per queue) and **sampled** at intervals so they remain low-cardinality and cheap to store and query.
- **Why required:** Metrics drive **alerting** (e.g. error rate &gt; 5% → page) and **dashboards** (e.g. API latency, order throughput). They answer “how much” and “how fast” at a glance. Without metrics, outages and degradation are discovered only when users complain.

### 1.3 Logs

- **Definition:** **Timestamped, structured records** of discrete events: request start/end, job start/fail, error, audit action. Logs carry **context** (request_id, user_id, job_id, level, message, optional structured fields). They are **not aggregated** by default; they are stored and searched for debugging and audit.
- **Why required:** Logs answer “what happened” and “why it failed”: stack trace, payload excerpt, user action. They support incident investigation, compliance (audit trail), and debugging. Without centralized, structured logs, diagnosing failures across API, workers, and events is slow and incomplete.

### 1.4 Traces

- **Definition:** **Distributed traces** record the path of a **request or workflow** across services and processes: API → internal call → worker → external gateway. Each step is a **span** with name, start/end time, and optional attributes (e.g. endpoint, status). Spans are linked by a **trace_id** (and optionally parent_span_id) so one trace shows the full journey.
- **Why required:** Traces answer “where did time go?” and “which service or step failed?” in a multi-step flow (e.g. checkout: API → payment gateway → event → email worker). Without tracing, latency and failures in workers or external calls are hard to attribute.

### 1.5 Relationship to platform architecture

- **API_ARCHITECTURE:** Observability covers all API domains (public, buyer, seller, admin, crm, internal, webhooks): latency and errors per domain and per endpoint; rate-limit hits; auth failures.
- **INFRASTRUCTURE_ARCHITECTURE:** Observability covers jobs, job_attempts, job_failures, queues (parser, events, email), workers (parser, event, email), schedulers, Redis, search index, and file storage: queue depth, job duration, failure rate, worker liveness.
- **PLATFORM_EVENT_ARCHITECTURE:** Observability covers domain_events, event_subscribers, event_handlers, and event_deliveries: event publish rate, delivery latency, handler success/failure, dead-letter volume.
- **PLATFORM_MASTER_ARCHITECTURE:** Observability supports the full marketplace flow: catalog and product availability, order and payment throughput, delivery and returns, so that business and ops can see health end-to-end.

---

## STEP 2 — LOGGING

### 2.1 Structured logs

- **Principle:** Logs are **structured** (e.g. JSON) so that they can be queried and aggregated by field. Each log line is one record with a **timestamp**, **level** (e.g. debug, info, warn, error), **message** (short human-readable summary), and **context** (key-value or nested object).
- **Required context fields (conceptual):** **request_id** or **correlation_id** (to group logs for one request or workflow); **service** or **component** (api, parser_worker, event_worker, email_worker, scheduler); **environment** (e.g. production, staging). Optional: **user_id**, **seller_id**, **order_id**, **job_id**, **event_id** — only non-PII identifiers; **duration_ms**; **endpoint** or **job_type**; **status_code** or **result**.
- **Rules:** Use a **consistent schema** across API and workers so that log aggregation can filter by component, request_id, or level. Avoid free-form long text in the message when it can be a structured field (e.g. error_code, exception_class).

### 2.2 Log levels

- **Definition:** **Error:** Failure that affects the outcome (e.g. payment gateway error, job exception). **Warn:** Recoverable or degraded condition (e.g. retry, fallback used, rate limit approaching). **Info:** Normal but notable events (e.g. order created, payment captured, job completed). **Debug:** Detailed flow for troubleshooting (e.g. request params, internal state); typically disabled or sampled in production.
- **Rules:** Do not log at a more severe level than the event (e.g. do not log “user not found” as error if it is an expected case). In production, default to **info** or **warn** for application logs; **error** for failures. **Debug** is enabled only when troubleshooting or at low sampling rate to control volume and cost.

### 2.3 Centralized log storage

- **Principle:** Logs from **all components** (API servers, parser workers, event workers, email workers, schedulers) are shipped to a **centralized store** (e.g. log aggregation service or object storage with index). This allows a single place to search by request_id, job_id, time range, or error.
- **Flow (conceptual):** Each process writes logs to **stdout** (or a local file); a **log shipper** (agent or sidecar) collects and forwards to the central store. Alternatively, the application sends logs directly to the aggregation API. **Retention** is defined by policy (e.g. 30 days hot, 90 days archive); access to logs is restricted (ops, support with need).
- **Rules:** **No secrets in logs:** Do not log passwords, tokens, API keys, or webhook secrets. Do not log request/response body that might contain credentials or card data. **No PII in logs:** Do not log full email, phone, or address in plain form; if needed for audit, use a dedicated audit log with access control and redaction; in application logs use **user_id** or **order_id** only. See SECURITY_ARCHITECTURE.md (data protection, access logs).

### 2.4 Logging by component

- **API:** Log request start (request_id, method, path, client_ip); request end (request_id, status_code, duration_ms); errors (request_id, exception, status_code). Do not log full body or headers that may contain Authorization.
- **Workers:** Log job start (job_id, job_type, queue); job end (job_id, duration_ms, status); job failure (job_id, error_message, attempt_number). Do not log full job payload if it contains PII; log job_id and type only.
- **Event system:** Log event published (event_id, event_type); handler start/end (event_id, subscriber_id, duration_ms, status). Optional: event_deliveries table already records status; logs add searchability and correlation with request_id.
- **Scheduler:** Log each schedule run (task name, jobs enqueued, next_run_at).

---

## STEP 3 — METRICS

### 3.1 API metrics

- **Latency:** Request duration per **API domain** (public, buyer, seller, admin, crm, internal) and per **endpoint** (or route group). Expose **histogram** or **summary** with percentiles (p50, p95, p99) and optionally by status (2xx, 4xx, 5xx). Enables detection of slow endpoints and degradation.
- **Throughput:** Request count per second (or per minute) per domain and per endpoint; optionally by status. Enables traffic patterns and capacity planning.
- **Error rate:** Count or ratio of responses with status 5xx (and optionally 4xx for auth or validation) per domain and endpoint. Enables alerting on “API failure” (e.g. 5xx rate above threshold).

### 3.2 Queue and job metrics

- **Queue size:** Gauge of **pending** (or available) jobs per **queue name** (parser, events, email, default). Enables “queue backlog” alerting when a queue grows beyond a threshold.
- **Job throughput:** Counter of jobs **completed** and **failed** per queue and per **job_type** (e.g. ParseCategoryJob, HandleDomainEventJob, SendEmailJob). Enables visibility into worker productivity and failure rate by type.
- **Job duration:** Histogram of job execution time per job_type (or per queue). Enables detection of slow jobs and worker capacity.
- **Job failures:** Counter of jobs that reached **max_attempts** and moved to **job_failures** (or dead letter) per queue and job_type. Enables “worker failure” and “poison message” detection.

### 3.3 Worker health

- **Liveness:** Each worker process (or pool) reports that it is **alive** (e.g. heartbeat or “last job processed at”). If no heartbeat for N minutes, the worker is considered down. Enables “worker failure” alerting.
- **Concurrency:** Gauge of **reserved** or **processing** jobs per worker pool (optional). Enables seeing if workers are saturated.

### 3.4 Order and business metrics

- **Order throughput:** Count of **orders created** per time window (e.g. per hour); optionally by status (created, paid, shipped). Enables business dashboards and anomaly detection (e.g. drop in orders).
- **Checkout funnel:** Counts at each step: cart created, checkout started, order placed, payment captured. Enables conversion and drop-off analysis.

### 3.5 Payment metrics

- **Payment success rate:** Ratio or count of **successful** vs **failed** payment attempts (capture) per time window; optionally by gateway. Enables “payment failure” alerting when success rate drops.
- **Payment latency:** Time from “place order” to “payment captured” (or gateway response time if measured at API). Enables detection of gateway slowness.

### 3.6 Search metrics

- **Search latency:** Request duration for **search** (or product listing) endpoints; p95/p99. Enables detection of search engine or DB slowness.
- **Search error rate:** Count of search requests returning 5xx or timeout. Enables “search down” alerting.
- **Search throughput:** Queries per second (optional). Enables capacity and caching effectiveness.

### 3.7 Database and cache metrics

- **Database latency:** Query duration or connection pool usage (if exposed by DB or driver). Enables “database latency” alerting.
- **Redis:** Hit rate, memory usage, connected clients (if available). Enables cache and session store health.

### 3.8 Metric collection

- **Exposition:** Application and workers expose metrics in a standard format (e.g. Prometheus scrape endpoint or statsd push). Schedulers and queues may expose metrics from DB (e.g. SELECT COUNT(*) FROM jobs WHERE status = 'pending' AND queue = 'events') via a small exporter or cron.
- **Storage and retention:** Metrics are stored in a **time-series store** (e.g. Prometheus, VictoriaMetrics, or cloud metrics) with retention (e.g. 15 days raw, longer for aggregates). Low cardinality (avoid per-user or per-order in high-volume metrics) to keep cost and query speed acceptable.

---

## STEP 4 — TRACING

### 4.1 Purpose of distributed tracing

- **Goal:** One **trace_id** ties together: (1) the HTTP request to the API, (2) any internal API or DB calls, (3) enqueued jobs and the worker that processes them, (4) outbound calls (payment gateway, email provider). This allows “follow the request” across services and async boundaries.

### 4.2 Tracing the API

- **Incoming request:** When a request hits the API, generate or accept **trace_id** (and **span_id**). Create a **root span** (name = method + path or route, start = now). Add attributes: endpoint, method, optionally user_id (no PII).
- **Outgoing:** For any outbound call (DB, Redis, internal_api, payment gateway), create a **child span** (parent_span_id = current span). On response, end span with duration and optional status/error. Propagate **trace_id** and **span_id** in headers (e.g. X-Trace-Id, X-Span-Id, or W3C Trace Context) so downstream can attach to the same trace.
- **Response:** Before sending response, end root span; ensure trace_id is in response header (optional) for client-side correlation.

### 4.3 Tracing workers

- **Job payload:** When a job is enqueued, **inject trace_id** (and optionally span_id or parent_span_id) into the job payload or metadata. When the worker starts the job, it **creates a new span** with that trace_id and parent_span_id (or a “queue” span as parent), so the trace shows: API span → “enqueue” span → worker span.
- **Worker span:** Span name = job_type (e.g. HandleDomainEventJob); attributes = job_id, queue, event_type (if applicable). Child spans for: load event, call handler, call external service (e.g. SMTP, search index API). On completion or failure, end span with result.

### 4.4 Tracing events

- **Publish:** When writing to **domain_events**, include **trace_id** (and optionally causation_id) in metadata. When the event dispatcher enqueues handler jobs, pass **trace_id** in the job payload so event handler execution is part of the same trace as the originating action (e.g. order creation).
- **Handler:** Event worker starts a span with trace_id from job; span name = subscriber name or event_type; attributes = event_id, event_type, subscriber_id. Enables “order_created → send email” in one trace.

### 4.5 Tracing external services

- **Outbound calls:** For payment gateway, email provider, carrier API, or search engine, create a **child span** (name = “gateway_name” or “http POST /capture”). Record duration and status (success, timeout, error). Do not record full request/response body in span; only status and duration (and optional error message). Propagate trace_id to the external service only if the provider supports it (e.g. custom header); otherwise keep trace local.

### 4.6 Trace storage and sampling

- **Storage:** Traces (spans) are sent to a **tracing backend** (e.g. Jaeger, Tempo, or cloud tracing). Retention is typically shorter than logs (e.g. 7 days) due to volume.
- **Sampling:** In high-traffic environments, **sample** traces (e.g. 1 in 100, or 100% of errors and 1% of success) to control cost. Sampling decision should be consistent per trace_id (sample all spans of the same trace or none).

---

## STEP 5 — ALERTING

### 5.1 Alert design principles

- **Actionable:** Each alert should imply a **clear action** (e.g. scale workers, fix deployment, check gateway). Avoid “everything is wrong” single alert; prefer alerts per component or symptom.
- **Severity:** **Critical:** User-facing or revenue impact (e.g. API down, payment failure spike). **Warning:** Degraded or at risk (e.g. queue backlog growing, latency p99 high). **Info:** For awareness (e.g. deployment completed).
- **Deduplication and grouping:** Group alerts by service or label so that one incident does not flood with hundreds of alerts. Use **alert aggregation** or **routing** so the on-call receives one notification per incident with a summary.

### 5.2 API failure

- **Condition:** **Error rate** (5xx) for **public_api** or **buyer_api** above threshold (e.g. &gt; 5% over 5 minutes) or **availability** below SLO (e.g. &lt; 99% successful requests in 10 minutes).
- **Severity:** Critical for buyer_api and public_api (storefront); high for admin_api and seller_api.
- **Action:** Page on-call; check deployment, DB, Redis, and recent releases; check logs by request_id for 5xx.

### 5.3 Worker failure

- **Condition:** **Worker liveness** lost (no heartbeat for N minutes) for parser, event, or email worker pool; or **job failure rate** (jobs moved to job_failures) above threshold for a queue (e.g. &gt; 10 failures in 15 minutes).
- **Severity:** Critical if no workers alive; warning if failure rate elevated (possible poison message or dependency down).
- **Action:** Restart workers; inspect job_failures and logs; fix payload or dependency (e.g. gateway, DB).

### 5.4 Payment failure

- **Condition:** **Payment success rate** below threshold (e.g. &lt; 90% over 15 minutes) or **payment gateway** returning errors (from logs or metrics).
- **Severity:** Critical (revenue and checkout blocked).
- **Action:** Check gateway status, credentials, and webhook endpoint; check logs for gateway errors.

### 5.5 Queue backlog

- **Condition:** **Queue size** (pending jobs) for **events** or **email** (or parser) above threshold (e.g. &gt; 1000 for events, &gt; 500 for email) for more than N minutes.
- **Severity:** Warning (orders and emails may be delayed); critical if backlog grows unbounded (workers down or too slow).
- **Action:** Scale workers; check job duration and failure rate; clear poison messages if needed.

### 5.6 Database latency

- **Condition:** **Database latency** (p95 or p99) above threshold (e.g. &gt; 2 s for p99) or **connection pool** exhausted.
- **Severity:** Warning or critical depending on impact on API latency.
- **Action:** Check slow queries, locks, and DB health; scale or optimize.

### 5.7 Optional alerts

- **Search down:** Search error rate above threshold or search latency p99 above threshold.
- **Redis down:** Redis unreachable or error rate high.
- **Disk or memory:** Host or container disk/memory above threshold (if metrics available).
- **Certificate expiry:** TLS certificate expiring within N days (if monitored).

### 5.8 Alert channel and runbook

- **Channel:** Alerts are sent to a **notification channel** (e.g. PagerDuty, Slack, email). Critical alerts page on-call; warning can be Slack-only or ticket.
- **Runbook:** Each alert (or alert group) should have a **runbook** (link or doc) with: what the alert means, how to verify, and common fixes (e.g. “Restart event workers: supervisorctl restart event-worker:*”).

---

## STEP 6 — DASHBOARDS

### 6.1 Platform health dashboard

- **Purpose:** Single view of “is the platform up and healthy?”
- **Contents:** **API:** Request rate and error rate (5xx) per domain (public, buyer, seller, admin); latency p95 per domain. **Workers:** Liveness (up/down) per worker type; queue size per queue. **DB and Redis:** Latency, connections or errors (if available). **Recent deployments or config changes** (optional).
- **Audience:** Ops, on-call.

### 6.2 Orders dashboard

- **Purpose:** Business and ops view of order flow.
- **Contents:** **Order throughput:** Orders created per hour/day; trend. **Order status mix:** Count by status (created, paid, shipped, delivered, cancelled). **Checkout funnel:** Cart → checkout started → order placed → payment captured (counts or conversion). **Errors:** Failed checkouts or order creation errors (from logs or metrics) over time.
- **Audience:** Ops, business, support.

### 6.3 Payments dashboard

- **Purpose:** Payment gateway and capture health.
- **Contents:** **Payment success rate** over time (e.g. hourly); **failed captures** count; **payment latency** (if measured). Optional: breakdown by gateway or payment method.
- **Audience:** Ops, finance.

### 6.4 Search dashboard

- **Purpose:** Search and product listing health and performance.
- **Contents:** **Search request rate;** **search latency** (p50, p95, p99); **search error rate.** Optional: top slow queries or categories.
- **Audience:** Ops, backend.

### 6.5 Queues dashboard

- **Purpose:** Queue depth and worker productivity.
- **Contents:** **Queue size** (gauge) per queue (parser, events, email, default) over time. **Job completion rate** (and failure rate) per queue and per job_type. **Job duration** (p95) per job_type. **job_failures** count (or dead-letter size) per queue.
- **Audience:** Ops, backend.

### 6.6 Optional dashboards

- **Events:** Domain event publish rate by event_type; event_deliveries completed vs failed; handler duration.
- **Parser:** Parser jobs run, success/failure, categories parsed, products added (if such metrics exist).
- **Security/audit:** Failed login attempts, rate-limit hits, admin actions (if exposed as metrics or from audit log).

### 6.7 Dashboard placement and access

- **Tool:** Dashboards live in the same **observability stack** (e.g. Grafana, cloud console) that reads from the metrics and (optionally) trace store. Logs can be linked from dashboards (e.g. “view logs for this time range and service”).
- **Access:** Dashboard access is restricted (ops, SRE, designated backend); business dashboards (orders, payments) may be read-only for product or finance. No secrets or PII on dashboards; use aggregates and ids only.

---

## STEP 7 — FINAL DOCUMENT (SUMMARY)

### 7.1 Observability principles (recap)

- **Metrics:** Numeric measurements over time (latency, error rate, queue size, throughput); required for alerting and dashboards.
- **Logs:** Timestamped, structured records of events; required for debugging, audit, and incident investigation.
- **Traces:** Distributed tracing of request and workflow across API, workers, events, and external services; required to understand latency and failure location in a distributed system.

### 7.2 Logging (recap)

- **Structured logs** with level, message, and context (request_id, component, job_id, etc.); **centralized** storage; **no secrets** and **no PII** in logs; level policy (info/warn in production, error for failures, debug sampled or off).

### 7.3 Metrics (recap)

- **API:** Latency, error rate, throughput per domain and endpoint. **Queues:** Queue size, job completion/failure, job duration. **Workers:** Liveness. **Orders:** Order throughput, funnel. **Payments:** Success rate, latency. **Search:** Latency, error rate. **DB/Redis:** Latency, connections (if available).

### 7.4 Tracing (recap)

- **API:** Root span per request; child spans for DB, Redis, internal and external calls; propagate trace_id. **Workers:** trace_id in job payload; worker span with job_type and child spans for handler and external calls. **Events:** trace_id in event metadata and job payload so handlers attach to same trace. **External:** Child span per outbound call; no sensitive data in spans.

### 7.5 Alerting (recap)

- **API failure:** 5xx rate or availability SLO. **Worker failure:** Liveness lost, job failure rate high. **Payment failure:** Success rate low. **Queue backlog:** Pending jobs above threshold. **Database latency:** p95/p99 above threshold. Alerts are actionable, severity-based, and routed to on-call with runbooks.

### 7.6 Dashboards (recap)

- **Platform health:** API, workers, DB, Redis. **Orders:** Throughput, status mix, funnel, errors. **Payments:** Success rate, failures, latency. **Search:** Latency, errors, throughput. **Queues:** Queue size, job rate, duration, failures. Access restricted; no PII or secrets.

### 7.7 Dependencies

- **PLATFORM_MASTER_ARCHITECTURE:** Subsystems (catalog, order, financial, events, infrastructure) define the scope of what is observed.
- **API_ARCHITECTURE:** API domains and endpoints define API metrics and tracing boundaries.
- **INFRASTRUCTURE_ARCHITECTURE:** jobs, job_attempts, job_failures, queues, workers, schedulers define queue and worker metrics and logging.
- **PLATFORM_EVENT_ARCHITECTURE:** domain_events, subscribers, handlers, and event_deliveries define event metrics and tracing.

---

*End of Observability Architecture.*
