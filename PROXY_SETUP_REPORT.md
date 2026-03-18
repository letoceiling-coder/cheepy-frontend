# Proxy Setup Report

Date: 2026-03-14

## Target

- Proxy gateway server: `89.169.39.244`
- Parser server: `85.117.235.93`
- Proxy port: `3128`

## Actions Completed

1. Connected to `root@89.169.39.244`.
2. Verified port `3128` was free before setup.
3. `3proxy` package was not available via `apt`, so installed from source:
   - repository: `https://github.com/3proxy/3proxy`
   - binary installed to `/usr/local/bin/3proxy`
4. Created config file:
   - `/etc/3proxy/3proxy.cfg`
   - auth: `none`
   - allowed source: `85.117.235.93`
   - listener: `proxy -p3128`
5. Created systemd service:
   - `/etc/systemd/system/3proxy.service`
6. Enabled and started service.

## Service Status

- `systemctl status 3proxy` -> `active (running)`
- process path: `/usr/local/bin/3proxy /etc/3proxy/3proxy.cfg`

## Port Check

- `ss -tulnp` confirms:
  - `LISTEN ... 0.0.0.0:3128 ... users:(("3proxy",...))`

## Access/IP Restriction

- Config allows only parser server source IP:
  - `allow * 85.117.235.93`

## Connectivity Test From Parser Server

Command:

```bash
curl -x http://89.169.39.244:3128 -I https://sadovodbaza.ru --max-time 30
```

Result:

- `HTTP/1.0 200 Connection established`
- upstream response `HTTP/1.1 200 OK`

Conclusion: proxy gateway is operational and reachable from parser server.

## Notes

- No changes made to:
  - `/etc/nginx`
  - `/etc/letsencrypt`
  - nginx service/system config
  - site firewall rules
