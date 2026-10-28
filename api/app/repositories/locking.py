"""Reentrant registry writer lease for content transactions and asset JSONL mutations."""
from contextlib import contextmanager
import fcntl
from functools import lru_cache
from pathlib import Path
from threading import RLock, local
from typing import Iterator

_held = local()


@lru_cache(maxsize=None)
def _thread_lock(registry: str):
    return RLock()


@contextmanager
def registry_writer(registry_dir: Path) -> Iterator[None]:
    key = str(registry_dir.resolve())
    with _thread_lock(key):
        held = getattr(_held, "registries", set())
        if key in held:
            yield
            return
        registry_dir.mkdir(parents=True, exist_ok=True)
        with (registry_dir / ".content-revisions.lock").open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            _held.registries = held
            held.add(key)
            try:
                yield
            finally:
                held.remove(key)
                fcntl.flock(lock, fcntl.LOCK_UN)
