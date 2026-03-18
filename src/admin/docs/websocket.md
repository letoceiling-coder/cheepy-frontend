# WebSocket Real-Time Updates

## Overview

Admin receives live parser updates via Laravel Reverb (WebSocket) or EventSource (SSE fallback).

## Reverb

- Config: src/lib/echo.ts
- Env: VITE_REVERB_APP_KEY, VITE_REVERB_HOST, VITE_REVERB_PORT, VITE_REVERB_SCHEME
- Channel: parser

## Events

ParserStarted, ParserProgressUpdated, ProductParsed, ParserFinished, ParserError

## useParserChannel

Subscribes to parser channel, invalidates parser-status, parser-stats, dashboard, logs on events.

## SSE Fallback

ParserPage uses EventSource(parserApi.progressUrl(jobId)) for job progress. Token in query param.
