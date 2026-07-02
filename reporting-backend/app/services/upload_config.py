from app.parsers.omnix_parser import parse_omnix_rows
from app.parsers.voice_parser import parse_voice_rows
from app.parsers.csat_parser import parse_csat_rows

UPLOAD_CONFIG = {
    "omnix": {
        "parser": parse_omnix_rows,
        "table": "omnix_cases",
        "unique_key": "ticket_id",
    },
    "voice": {
        "parser": parse_voice_rows,
        "table": "voice_interactions",
        "unique_key": "unique_id",
    },
    "csat": {
        "parser": parse_csat_rows,
        "table": "csat_responses",
        "unique_key": "source_id",
    },
}