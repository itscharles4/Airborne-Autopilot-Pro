## GitHub Copilot Chat

- Extension: 0.38.2 (prod)
- VS Code: 1.110.1 (61b3d0ab13be7dda2389f1d3e60a119c7f660cc3)
- OS: win32 10.0.26200 x64
- GitHub Account: itscharles4

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 20.207.73.85 (88 ms)
- DNS ipv6 Lookup: Error (13 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (1 ms)
- Electron fetch (configured): HTTP 200 (4340 ms)
- Node.js https: HTTP 200 (334 ms)
- Node.js fetch: HTTP 200 (284 ms)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.113.22 (33 ms)
- DNS ipv6 Lookup: Error (9 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: None (2 ms)
- Electron fetch (configured): HTTP 200 (2951 ms)
- Node.js https: HTTP 200 (995 ms)
- Node.js fetch: HTTP 200 (975 ms)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: 52.175.140.176 (38 ms)
- DNS ipv6 Lookup: Error (6 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: None (9 ms)
- Electron fetch (configured): HTTP 200 (588 ms)
- Node.js https: HTTP 200 (436 ms)
- Node.js fetch: HTTP 200 (470 ms)

Connecting to https://mobile.events.data.microsoft.com: HTTP 404 (929 ms)
Connecting to https://dc.services.visualstudio.com: HTTP 404 (881 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (913 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (984 ms)
Connecting to https://default.exp-tas.com: HTTP 400 (246 ms)

Number of system certificates: 99

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).