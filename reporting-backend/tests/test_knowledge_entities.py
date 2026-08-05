from app.services.knowledge_service import extract_knowledge_entities, _indicator_query_terms


def test_extract_knowledge_entities_for_indicator_chunk():
    document = {
        "id": "doc-1",
        "title": "Buku Manual dan Kartu Garansi Ecovacs T30C MAX OMNI.pdf",
        "source_file": "manual.pdf",
    }
    chunk = {
        "id": "chunk-1",
        "document_id": "doc-1",
        "title": document["title"],
        "content": (
            "Lampu Indikator pada Robot. Putih Solid berarti baterai penuh. "
            "Merah Berkedip berarti alarm. Indikator Status Wi-Fi putih solid "
            "berarti berhasil terhubung. OMNI Station merah berkedip berarti error."
        ),
    }

    entities = extract_knowledge_entities(document, chunk)
    indexed = {(row["entity_type"], row["normalized_value"]) for row in entities}

    assert ("brand", "ECOVACS") in indexed
    assert ("product_code", "T30C") in indexed
    assert ("series", "T30") in indexed
    assert ("topic", "INDICATOR_STATUS") in indexed
    assert ("topic", "WIFI_STATUS") in indexed
    assert ("topic", "OMNI_STATION") in indexed


def test_indicator_query_terms_expand_product_series():
    terms = _indicator_query_terms("lampu indikator t30c max omni")

    assert terms["is_indicator_query"] is True
    assert "T30C" in terms["product_codes"]
    assert "T30" in terms["series"]
    assert ["merah", "berkedip"] in terms["topic_groups"]
