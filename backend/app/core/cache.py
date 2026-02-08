import time
from functools import wraps
from typing import Any, Dict, Optional, Callable
import logging

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self):
        # keyed by (func_name, args, kwargs)
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            item = self._cache[key]
            if time.time() < item['expiry']:
                logger.info(f"Cache hit for key: {key}")
                return item['value']
            else:
                logger.info(f"Cache expired for key: {key}")
                self._cache.pop(key, None)
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        self._cache[key] = {
            'value': value,
            'expiry': time.time() + ttl_seconds
        }
        logger.info(f"Cache set for key: {key} with TTL: {ttl_seconds}s")

    def clear(self):
        self._cache.clear()
        logger.info("Cache cleared")

# Global cache manager instance
cache_manager = CacheManager()

def cache_response(ttl_seconds: int = 300):
    """
    Decorator to cache the response of a function based on its arguments.
    Works for both sync and async functions if implemented accordingly, 
    but for now we focus on the sync routes in gmail.py.
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Create a unique key based on function name and arguments
            # We skip 'service' or 'db' arguments usually if they are injected via Depends
            # For simplicity, we just use func name and stringified args/kwargs
            
            # Filter out 'service' and 'db' from kwargs for key generation
            cache_kwargs = {k: v for k, v in kwargs.items() if k not in ('service', 'db')}
            key = f"{func.__name__}:{str(args)}:{str(sorted(cache_kwargs.items()))}"
            
            cached_value = cache_manager.get(key)
            if cached_value is not None:
                return cached_value
            
            result = func(*args, **kwargs)
            cache_manager.set(key, result, ttl_seconds)
            return result
        return wrapper
    return decorator
