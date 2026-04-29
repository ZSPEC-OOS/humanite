"""
Hard-reject content that violates platform policy BEFORE any LLM call.
This runs before fact-locking, language detection, and everything else.

No user text is logged on violation — only the violation category.
"""
import re
from dataclasses import dataclass


@dataclass
class ModerationResult:
    allowed: bool
    violation_category: str | None = None


_ACADEMIC_DISHONESTY: list[re.Pattern] = [
    re.compile(r'bypass\s+(?:turnitin|grammarly|copyleaks|originality)', re.IGNORECASE),
    re.compile(r'make\s+(?:this|it)\s+undetectable', re.IGNORECASE),
    re.compile(r'avoid\s+(?:ai\s+)?detection', re.IGNORECASE),
    re.compile(
        r'pass\s+(?:a\s+)?(?:plagiarism|ai)\s+(?:check|detector|scanner|tool|test)',
        re.IGNORECASE,
    ),
    re.compile(
        r'cheat\s+(?:my|the|a|on\s+(?:my|the|a))\s+'
        r'(?:professor|teacher|exam|test|assignment|essay|homework|course)',
        re.IGNORECASE,
    ),
    re.compile(
        r'write\s+my\s+(?:essay|paper|thesis|dissertation|assignment|homework)\s+for\s+me',
        re.IGNORECASE,
    ),
    re.compile(r'submit\s+(?:this|as)\s+(?:my|as\s+my)\s+own', re.IGNORECASE),
]

_PROHIBITED_CONTENT: list[re.Pattern] = [
    re.compile(
        r'how\s+to\s+(?:make|build|create|synthesize)\s+(?:a\s+)?'
        r'(?:bomb|explosive|weapon|poison|virus|malware)',
        re.IGNORECASE,
    ),
    re.compile(r'(?:child|minor)\s+(?:sexual|explicit|nude|naked)', re.IGNORECASE),
]


def moderate(text: str) -> ModerationResult:
    """
    Returns immediately on first match.
    Does NOT log the matched text — only the category.
    """
    for pattern in _ACADEMIC_DISHONESTY:
        if pattern.search(text):
            return ModerationResult(allowed=False, violation_category="ACADEMIC_DISHONESTY_INTENT")

    for pattern in _PROHIBITED_CONTENT:
        if pattern.search(text):
            return ModerationResult(allowed=False, violation_category="PROHIBITED_CONTENT")

    return ModerationResult(allowed=True)
