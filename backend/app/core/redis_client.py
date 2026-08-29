import json
import logging
from typing import Optional, Any
from app.config import settings

logger = logging.getLogger(__name__)


class RedisFallback:
    """In-memory dictionary cache fallback when Redis instance is not running."""
    def __init__(self):
        self._store = {}

    def get(self, key: str) -> Optional[str]:
        return self._store.get(key)

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        self._store[key] = value
        return True

    def delete(self, key: str) -> bool:
        return self._store.pop(key, None) is not None

    def publish(self, channel: str, message: str) -> int:
        return 1


class RedisClient:
    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        try:
            import redis
            self.client = redis.Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=1.5,
                socket_connect_timeout=1.5
            )
            # Test ping
            self.client.ping()
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.warning(f"Redis unavailable ({e}). Using in-memory cache fallback.")
            self.client = RedisFallback()

    def get_json(self, key: str) -> Optional[Any]:
        val = self.client.get(key)
        if val:
            try:
                return json.loads(val)
            except Exception:
                return val
        return None

    def set_json(self, key: str, value: Any, ex: Optional[int] = 300) -> bool:
        try:
            val = json.dumps(value)
            return self.client.set(key, val, ex=ex)
        except Exception as e:
            logger.error(f"Error caching key {key}: {e}")
            return False

    def publish(self, channel: str, message: Any) -> int:
        try:
            if isinstance(message, (dict, list)):
                msg_str = json.dumps(message)
            else:
                msg_str = str(message)
            return self.client.publish(channel, msg_str)
        except Exception as e:
            logger.error(f"Error publishing to {channel}: {e}")
            return 0


redis_client = RedisClient()
