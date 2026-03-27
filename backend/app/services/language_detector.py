import logging

from langdetect import detect, LangDetectException

logger = logging.getLogger(__name__)


def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        return lang[:2]
    except LangDetectException:
        logger.warning("Language detection failed, falling back to 'en'")
        return "en"
    except Exception:
        logger.warning("Unexpected error in language detection, falling back to 'en'")
        return "en"
