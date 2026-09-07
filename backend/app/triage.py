import json
from typing import Tuple, List

HIGH_RISK_KEYWORDS = [
    "blisters",
    "high fever",
    "sudden death"
]

def evaluate_triage(symptoms: str, mortality_status: bool = False) -> Tuple[str, List[str]]:
    """
    Evaluates report symptoms against rule-based early warning triggers.
    If symptoms include 'blisters', 'high fever', or 'sudden death',
    or if mortality is reported, elevates status to 'flagged_high_risk'.
    
    Returns:
        (status, matched_triggers)
    """
    matched_triggers = []
    
    # Normalize symptoms input (could be JSON string, comma-separated, or plain text)
    symptoms_text = ""
    try:
        parsed = json.loads(symptoms)
        if isinstance(parsed, list):
            symptoms_text = " ".join(str(item).lower() for item in parsed)
        else:
            symptoms_text = str(parsed).lower()
    except Exception:
        symptoms_text = str(symptoms).lower()
    
    for trigger in HIGH_RISK_KEYWORDS:
        if trigger in symptoms_text:
            matched_triggers.append(trigger)
            
    if mortality_status and "sudden death" not in matched_triggers:
        matched_triggers.append("mortality reported")

    if matched_triggers:
        return "flagged_high_risk", matched_triggers
    
    return "pending", []
