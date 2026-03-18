# Anti-Blocking Integration

## 1. Config

Add to `.env`:

```env
PARSER_REQUEST_DELAY_MIN=400
PARSER_REQUEST_DELAY_MAX=800
PARSER_ERROR_RATE_THRESHOLD=0.1
PARSER_PAUSE_DURATION_SEC=60
```

Copy `config/parser_antiblocking.php` to Laravel project.

## 2. HttpClient Integration

In `App\Services\SadovodParser\HttpClient` (or equivalent):

```php
// Before each request
$this->antiBlocking->delayBeforeRequest();
$headers['User-Agent'] = $this->antiBlocking->getRandomUserAgent();

// After request
if ($response->successful()) {
    $this->antiBlocking->recordSuccess();
} else {
    $this->antiBlocking->recordError();
    if ($this->antiBlocking->shouldRetry($response->status())) {
        $backoff = $this->antiBlocking->getBackoffSeconds($attempt);
        sleep($backoff);
        // retry
    }
}
```

## 3. Randomized Delay

Replace fixed `request_delay_ms` with random range from config.

## 4. Optional: Proxy Support

For multi-IP rotation, add proxy list to config and use Guzzle proxy option.
