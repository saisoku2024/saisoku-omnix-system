# 7. DATABASE DEDUPLICATION
        inserted_candidates = []

        if target_table == "omnix_cases" and deduped_rows:
            existing_res = supabase.table("omnix_cases").select("ticket_id").in_("ticket_id", [r["ticket_id"] for r in deduped_rows]).execute()
            existing_ids = {r["ticket_id"] for r in existing_res.data}
            for row in deduped_rows:
                if row["ticket_id"] in existing_ids:
                    duplicate_rows += 1
                else:
                    inserted_candidates.append(row)

        elif target_table == "voice_interactions" and deduped_rows:
            existing_res = supabase.table("voice_interactions").select("unique_id").in_("unique_id", [r["unique_id"] for r in deduped_rows]).execute()
            existing_ids = {r["unique_id"] for r in existing_res.data}
            for row in deduped_rows:
                if row["unique_id"] in existing_ids:
                    duplicate_rows += 1
                else:
                    inserted_candidates.append(row)

        elif target_table == "csat_responses" and deduped_rows:
            existing_res = (
                supabase
                .table("csat_responses")
                .select("source_id")
                .in_(
                    "source_id",
                    [r["source_id"] for r in deduped_rows]
                )
                .execute()
            )

            existing_ids = {
                r["source_id"]
                for r in existing_res.data
            }

            for row in deduped_rows:
                if row["source_id"] in existing_ids:
                    duplicate_rows += 1
                else:
                    inserted_candidates.append(row)

        else:
            inserted_candidates = deduped_rows
