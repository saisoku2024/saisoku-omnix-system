import argparse
import json
import os
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.knowledge_service import KnowledgeService  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Preview or rebuild the Knowledge Base entity/topic index for existing chunks."
    )
    parser.add_argument("--limit", type=int, default=200, help="Maximum ready documents to scan.")
    parser.add_argument("--offset", type=int, default=0, help="Document offset for batch processing.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write the rebuilt entity index. Without this flag the command is read-only dry-run.",
    )
    args = parser.parse_args()

    result = KnowledgeService.reindex_entities(
        limit=max(args.limit, 1),
        offset=max(args.offset, 0),
        dry_run=not args.apply,
    )
    print(json.dumps(result, indent=2, ensure_ascii=False, default=str))

    if not args.apply:
        print("\nDRY RUN ONLY: no knowledge_entities rows were changed.")
    else:
        print("\nAPPLIED: knowledge_entities rows were rebuilt for the selected documents.")
    return 0


if __name__ == "__main__":
    os.environ.setdefault("PYTHONUTF8", "1")
    raise SystemExit(main())
