"""HTTP fetching with a shared rate limit, retries and backoff (standard library only).

urllib honours HTTPS_PROXY and the system CA store, so the crawler runs unchanged
behind the cloud session's proxy and on a plain server.
"""

import gzip
import os
import random
import threading
import time
import urllib.error
import urllib.request

USER_AGENT = os.environ.get("CRAWLER_USER_AGENT", "app-check-crawler/0.1")


class RateLimiter:
    """Spaces requests so that at most `rate` start per second, across all threads."""

    def __init__(self, rate: float):
        self.interval = 1.0 / rate
        self.lock = threading.Lock()
        self.next_at = time.monotonic()

    def wait(self) -> None:
        with self.lock:
            at = max(time.monotonic(), self.next_at)
            self.next_at = at + self.interval
        delay = at - time.monotonic()
        if delay > 0:
            time.sleep(delay)

    def pause(self, seconds: float) -> None:
        """Pushes every pending request back, e.g. after a 429 from the host."""
        with self.lock:
            self.next_at = max(self.next_at, time.monotonic() + seconds)


class FetchError(Exception):
    def __init__(self, url: str, reason: str):
        super().__init__(f"{reason}: {url}")
        self.url = url
        self.reason = reason


def _backoff(attempt: int, base: float, cap: float) -> float:
    return min(cap, base * 2**attempt) + random.uniform(0, 1)


def fetch(url: str, limiter: RateLimiter, retries: int = 5, timeout: float = 90) -> tuple[int, bytes]:
    """Returns (status, body). 404/410 come back as a status; other failures retry, then raise.

    Bodies are transparently gunzipped, for Content-Encoding: gzip as well as .xml.gz files.
    """
    last_reason = "no attempt"
    for attempt in range(retries + 1):
        limiter.wait()
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "gzip"})
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                body = response.read()
                status = response.status
        except urllib.error.HTTPError as error:
            if error.code in (404, 410):
                return error.code, b""
            if error.code in (403, 429) or error.code >= 500:
                retry_after = error.headers.get("Retry-After", "")
                if retry_after.isdigit():
                    delay = float(retry_after)
                else:
                    delay = _backoff(attempt, 15 if error.code in (403, 429) else 2, 600)
                limiter.pause(delay)
                last_reason = f"HTTP {error.code}"
                continue
            raise FetchError(url, f"HTTP {error.code}") from error
        except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
            time.sleep(_backoff(attempt, 2, 120))
            last_reason = type(error).__name__
            continue
        # .xml.gz sitemaps arrive gzipped twice: Content-Encoding on top of the gzip file.
        for _ in range(3):
            if body[:2] != b"\x1f\x8b":
                break
            body = gzip.decompress(body)
        return status, body
    raise FetchError(url, f"gave up after {retries + 1} attempts ({last_reason})")
