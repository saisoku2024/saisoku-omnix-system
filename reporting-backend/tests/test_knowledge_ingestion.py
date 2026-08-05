import io

import pandas as pd
import pytest

from app.services.knowledge_service import _chunk_text, _clean_text, _extract_docx, _extract_spreadsheet


def test_clean_text_normalizes_repeated_headers_and_units():
    raw = "\ufeffSAISOKU MANUAL\nPage 1\n70 \u00b0 C\n11 . 000 Pa\n4 L\n\nSAISOKU MANUAL\nPage 2\n\nSAISOKU MANUAL"

    cleaned = _clean_text(raw)

    assert "SAISOKU MANUAL" not in cleaned
    assert "Page 1" not in cleaned
    assert "70\u00b0C" in cleaned
    assert "11.000 Pa" in cleaned
    assert "4L" in cleaned


def test_chunk_text_keeps_markdown_table_rows_together():
    text = "\n".join(
        [
            "### Spesifikasi T30C MAX",
            "| Fitur | Nilai |",
            "| --- | --- |",
            "| Daya hisap | 11.000 Pa |",
            "| Tangki air | 4L |",
            "",
            "Catatan garansi berlaku sesuai kartu garansi.",
        ]
    )

    chunks = _chunk_text(text, max_tokens=12, overlap_tokens=2)

    table_chunk = next(chunk for chunk in chunks if "| Daya hisap | 11.000 Pa |" in chunk)
    assert "| Tangki air | 4L |" in table_chunk
    assert "NEEDS_REVIEW" not in table_chunk


def test_extract_docx_includes_tables_as_markdown():
    docx = pytest.importorskip("docx")
    document = docx.Document()
    document.add_paragraph("Spesifikasi Produk")
    table = document.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Fitur"
    table.cell(0, 1).text = "Nilai"
    table.cell(1, 0).text = "Daya hisap"
    table.cell(1, 1).text = "11.000 Pa"
    buffer = io.BytesIO()
    document.save(buffer)

    extracted = _extract_docx(buffer.getvalue())

    assert "Spesifikasi Produk" in extracted
    assert "### TABLE 1" in extracted
    assert "| Daya hisap | 11.000 Pa |" in extracted


def test_extract_spreadsheet_outputs_sheet_markdown_table():
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        pd.DataFrame(
            [
                {"Model": "T30C MAX", "Daya": "11.000 Pa"},
                {"Model": "T30 PRO", "Daya": "11.000 Pa"},
            ]
        ).to_excel(writer, sheet_name="Specs", index=False)

    extracted = _extract_spreadsheet(buffer.getvalue(), "specs.xlsx")

    assert "### SHEET: Specs" in extracted
    assert "| Model | Daya |" in extracted
    assert "| T30C MAX | 11.000 Pa |" in extracted
