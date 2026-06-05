for _, row in df.iterrows():
        created_raw = row.get("date_created_at")

        print(
            f"RAW DATE = {created_raw} | TYPE = {type(created_raw)}"
        )

        created_at = safe_datetime(created_raw)

        print(
            f"PARSED DATE = {created_at}"
        )

        interaction_at = safe_datetime(
            row.get("date_origin_interaction")
        )

        rows.append({
            # ==================================================
            # SYSTEM
            # ==================================================
            "upload_id": upload_id,
            "ticket_id": safe_str_raw(row.get("ticketId_masking")),
            "interaction_at": interaction_at,
            "created_at": created_at,

            # ==================================================
            # CUSTOMER
            # ==================================================
            "customer_name": safe_str(row.get("customer_name")),
            "customer_hp": normalize_phone(row.get("customer_hp")),

            # ==================================================
            # CHANNEL
            # ==================================================
            "channel": safe_str(row.get("channel_name")),

            # ==================================================
            # PRINCIPAL REPORT FIELDS
            # ==================================================
            "source_name": safe_str(row.get("source_name")),
            "date_first_response_interaction": safe_datetime(row.get("date_first_response_interaction")),
            "date_end_interaction": safe_datetime(row.get("date_end_interaction")),
            "is_escalated": safe_str(row.get("is_escalated")),
            "ticket_status_name": safe_str(row.get("ticket_status_name")),

            # ==================================================
            # CATEGORY
            # ==================================================
            "main_category": safe_str(row.get("mainCategory")),
            "category": safe_str(row.get("category")),
            "subcategory": safe_str(row.get("subCategory")),
            "detail_subcategory": safe_str(row.get("detailSubCategory")),
            "detail_subcategory2": safe_str_raw(row.get("detailSubCategory2")),

            # ==================================================
            # AGENT
            # ==================================================
            "agent_name": safe_str(row.get("created_by_name")),

            # ==================================================
            # TIME METRICS
            # ==================================================
            "handling_time_sec": duration_to_seconds(row.get("handlingTime")),
            "response_time_sec": duration_to_seconds(row.get("responseTime")),
            "waiting_time_sec": duration_to_seconds(row.get("waitingTime")),

            # ==================================================
            # FEEDBACK
            # ==================================================
            "feedback": safe_str(row.get("feedback")),
        })