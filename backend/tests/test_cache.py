import time
from app.core.cache import CacheManager, cache_response

def test_cache_manager():
    cache = CacheManager()
    cache.set("test_key", "test_value", ttl_seconds=1)
    
    # Test hit
    assert cache.get("test_key") == "test_value"
    
    # Test expiry
    time.sleep(1.1)
    assert cache.get("test_key") is None

def test_cache_decorator():
    call_count = 0
    
    @cache_response(ttl_seconds=2)
    def expensive_func(x, service=None):
        nonlocal call_count
        call_count += 1
        return x * 2

    # First call
    assert expensive_func(10, service="mock") == 20
    assert call_count == 1
    
    # Second call (cached)
    assert expensive_func(10, service="different_mock") == 20
    assert call_count == 1
    
    # Different args
    assert expensive_func(20) == 40
    assert call_count == 2
    
    # After expiry
    time.sleep(2.1)
    assert expensive_func(10) == 20
    assert call_count == 3
