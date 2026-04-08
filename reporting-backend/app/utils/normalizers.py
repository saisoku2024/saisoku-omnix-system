import re


def normalize_phone(phone):
    if not phone:
        return None

    p = str(phone).strip()
    p = re.sub(r"[^\d+]", "", p)

    if p.startswith("08"):
        return "62" + p[1:]
    elif p.startswith("+62"):
        return p[1:]
    elif p.startswith("62"):
        return p

    return p