import re
from typing import Dict, Any

class WhatsAppClassifier:
    """
    Mock classifier mimicking Claude Haiku for parsing inbound WhatsApp intents.
    """
    def __init__(self):
        # Supported v1 intents: approve, reject, remind_later, show_details, who_pending, cash_position, today_collections
        self.intent_patterns = {
            "approve": [r"\bapprove\b", r"\byes\b", r"\bok\b", r"\bgo ahead\b", r"\blooks good\b"],
            "reject": [r"\breject\b", r"\bno\b", r"\bdeny\b", r"\bcancel\b", r"\bstop\b"],
            "remind_later": [r"\bremind\b.*later", r"\blater\b", r"\btomorrow\b", r"\bnot now\b"],
            "show_details": [r"\bdetails\b", r"\bshow more\b", r"\bmore info\b"],
            "who_pending": [r"\bwho.*pending\b", r"\bpending\b", r"\bwho else\b"],
            "cash_position": [r"\bcash position\b", r"\bcash balance\b", r"\bbank balance\b"],
            "today_collections": [r"\bcollections\b", r"\bcollected today\b", r"\bpayments today\b"]
        }

    def classify_intent(self, text: str) -> Dict[str, Any]:
        """
        Classify the intent of an inbound text message.
        Returns the action and a confidence score.
        """
        text = text.lower().strip()

        best_intent = "unknown"
        max_confidence = 0.0

        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text):
                    # For a mock, exact short matches are high confidence.
                    # longer text with a match is lower confidence.
                    if text == pattern.replace(r"\b", ""):
                        confidence = 0.95
                    else:
                        confidence = 0.86 # Just above 0.85 threshold to execute

                    if confidence > max_confidence:
                        max_confidence = confidence
                        best_intent = intent

        # If below 0.85 -> ask for confirmation before executing.
        if max_confidence < 0.85:
            return {"action": "unknown", "confidence": max_confidence}

        return {"action": best_intent, "confidence": max_confidence}
