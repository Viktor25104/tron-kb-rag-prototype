import re

from app.domain.enums import Language

_TOKEN_RE = re.compile(r"\w+(?:-\w+)*")
_YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")
_WHITESPACE_RE = re.compile(r"\s+")

STOPWORDS = frozenset(
    {
        "a", "about", "an", "and", "are", "as", "at", "be", "by", "can", "could", "do", "does",
        "for", "from", "get", "how", "i", "if", "in", "is", "it", "its", "many", "much", "my",
        "need", "of", "on", "or", "should", "the", "this", "that", "to", "use", "what", "when",
        "which", "who", "why", "will", "with", "would", "you", "your",
        "и", "в", "на", "с", "по", "как", "что", "это", "не", "за", "для",
    }
)  # fmt: skip


def normalize(text: str) -> str:
    return _WHITESPACE_RE.sub(" ", text.lower()).strip()


def tokenize(text: str, *, drop_stopwords: bool = True) -> list[str]:
    tokens: list[str] = []
    for raw in _TOKEN_RE.findall(text.lower()):
        # "TRC-20", "trc20" and "trc 20" must collapse to one term for both search and NER.
        token = raw.replace("-", "").replace("_", "")
        if not token or (drop_stopwords and token in STOPWORDS):
            continue
        tokens.append(_stem(token))
    return tokens


def _stem(token: str) -> str:
    if len(token) > 3 and token.isascii() and token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


def extract_years(text: str) -> list[int]:
    return sorted({int(match) for match in _YEAR_RE.findall(text)})


def detect_language(text: str) -> Language:
    lowered = text.lower()
    if re.search(r"[іїєґ]", lowered):
        return Language.UA
    if re.search(r"[а-яё]", lowered):
        return Language.RU
    if re.search(r"[ğışİ]", text) or re.search(r"[ğış]", lowered):
        return Language.TR
    if re.search(r"[ñ¿¡]", lowered):
        return Language.ES
    return Language.EN
