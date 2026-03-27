import os
import logging
from datetime import date, timedelta

import aiosqlite

from app.db.database import DB_PATH

logger = logging.getLogger(__name__)


def _get_limit() -> int:
    try:
        return int(os.getenv("RATE_LIMIT_PER_DAY", "3"))
    except ValueError:
        return 3


async def check_rate_limit(ip: str) -> tuple[bool, int]:
    limit = _get_limit()
    today = date.today().isoformat()

    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT count FROM rate_limits WHERE ip = ? AND date = ?",
            (ip, today),
        )
        row = await cursor.fetchone()
        current_count = row[0] if row else 0

        if current_count >= limit:
            return False, 0

        if row:
            await db.execute(
                "UPDATE rate_limits SET count = count + 1 WHERE ip = ? AND date = ?",
                (ip, today),
            )
        else:
            await db.execute(
                "INSERT INTO rate_limits (ip, date, count) VALUES (?, ?, 1)",
                (ip, today),
            )
        await db.commit()

        remaining = limit - current_count - 1
        return True, max(0, remaining)


async def cleanup_old_records() -> None:
    cutoff = (date.today() - timedelta(days=7)).isoformat()
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("DELETE FROM rate_limits WHERE date < ?", (cutoff,))
            await db.commit()
        logger.info("Cleaned up rate limit records older than %s", cutoff)
    except Exception as e:
        logger.error("Error cleaning up rate limits: %s", e)
