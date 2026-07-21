import re
from datetime import datetime
import pandas as pd


def normalize_text(text):
    if text is None or (isinstance(text, float) and pd.isna(text)):
        return ""
    s = str(text).strip()
    # Remove brand prefixes: Tineco -, Ecovacs -, Yoniev -, Laifen -, Usmile -
    s = re.sub(r"^(Tineco|Ecovacs|Yoniev|Laifen|Usmile)\s*-\s*", "", s, flags=re.I)
    s = s.lower()
    # Normalize typos and variations
    s = s.replace("sparepart", "spare part")
    s = s.replace("market place", "marketplace")
    s = s.replace("end sesion", "end session")
    s = s.replace("shoppee", "shopee")
    s = s.replace("aksesories", "aksesoris")
    s = re.sub(r"\s+", " ", s)
    return s


def has_any(sub_text, detail_text, keywords):
    for kw in keywords:
        if kw in sub_text or kw in detail_text:
            return True
    return False


def is_within_14_days(date_a, date_b):
    if not date_a or not date_b:
        return False
    try:
        dt_a = pd.to_datetime(date_a)
        dt_b = pd.to_datetime(date_b)
        if pd.isna(dt_a) or pd.isna(dt_b):
            return False
        diff = abs((dt_b - dt_a).days)
        return diff <= 14
    except Exception:
        return False


class SubjectStandardizer:
    VERSION = "2026.1"

    @classmethod
    def classify_row(cls, row_dict: dict) -> dict:
        sub_raw = row_dict.get("subCategory") or row_dict.get("subcategory") or ""
        detail_raw = row_dict.get("detailSubCategory") or row_dict.get("detail_subcategory") or ""
        main_raw = row_dict.get("mainCategory") or row_dict.get("main_category") or ""
        category_raw = row_dict.get("category") or ""
        channel_raw = row_dict.get("channel_name") or row_dict.get("channel") or ""
        subject_raw = row_dict.get("subject") or ""

        purchase_date = row_dict.get("purchase_date") or row_dict.get("date_purchase")
        interaction_date = (
            row_dict.get("date_origin_interaction")
            or row_dict.get("interaction_at")
            or row_dict.get("date_created_at")
            or row_dict.get("created_at")
        )

        sub = normalize_text(sub_raw)
        detail = normalize_text(detail_raw)
        main = normalize_text(main_raw)
        cat = normalize_text(category_raw)
        channel = normalize_text(channel_raw)
        subj = normalize_text(subject_raw)

        mapped_subject = None
        status = "unmapped"
        source = "none"

        # -------------------------------------------------------------
        # 1. OTHER SPESIFIK (TESTING & SPAM)
        # -------------------------------------------------------------
        spam_test_kws = [
            "test",
            "testing",
            "test omnix",
            "test_omnix",
            "testcase",
            "test case",
            "testcsae",
            "testing it",
            "testing infomedia",
            "testing csa",
            "spam",
            "spam interaction",
            "spam dm",
            "spam comment",
            "spam chat",
        ]
        if has_any(sub, detail, spam_test_kws) or has_any(subj, main, spam_test_kws):
            mapped_subject = "Other-Testing OMNIX"
            source = "subCategory+detailSubCategory" if sub or detail else "subject"
            status = "exact" if sub in ["testing", "spam"] else "rule_matched"

        elif has_any(sub, detail, ["salah sambung", "salah nomor"]) or "salah sambung" in subj:
            mapped_subject = "Other-Salah Sambung"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif has_any(sub, detail, ["internal email"]) or "internal email" in subj:
            mapped_subject = "Other-Internal Email"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif has_any(sub, detail, ["faktur pajak"]) or "faktur pajak" in subj:
            mapped_subject = "Other-Permintaan Faktur Pajak"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif has_any(sub, detail, ["giveaway", "give away"]) or "giveaway" in subj or "give away" in subj:
            mapped_subject = "Other-Sosmed Activity Give Away"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif has_any(sub, detail, ["endorse", "kol endorse"]) or "endorse" in subj:
            mapped_subject = "Other-KOL Endorse"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif has_any(sub, detail, ["kol mention"]) or "kol mention" in subj:
            mapped_subject = "Other-KOL Mention"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif has_any(sub, detail, ["penjualan via omnix", "sales activity"]) or "penjualan via omnix" in subj:
            mapped_subject = "Other-Penjualan Via OMNIX"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        # -------------------------------------------------------------
        # 2. END SESSION MENGGUNAKAN CHANNEL
        # -------------------------------------------------------------
        elif has_any(sub, detail, ["end session", "no customer response"]) or "end session" in sub or "no customer response" in sub or "no respon" in subj or "tidak ada respon" in subj:
            source = "subCategory+channel_name"
            status = "rule_matched"
            if any(c in channel for c in ["voice", "call", "hotline"]):
                mapped_subject = "Other-End Session Call Pelanggan Terputus"
            else:
                mapped_subject = "Other-End Session Chat Tidak Dijawab Pelanggan"

        elif has_any(sub, detail, ["comment", "mention", "post", "story", "like", "sosmed activity"]):
            mapped_subject = "Other-Sosmed Activity Comment/Mention/Post/Story/Like"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        # -------------------------------------------------------------
        # 3. DEFECT (14 HARI) VS KENDALA TEKNIS biasa
        # -------------------------------------------------------------
        elif ("defect" in detail or "defect" in sub or "defect" in subj) and is_within_14_days(purchase_date, interaction_date):
            mapped_subject = "Panduan-Kendala Unit Defect (14hari)"
            source = "detailSubCategory+purchase_date"
            status = "rule_matched"

        # -------------------------------------------------------------
        # 4. PENGIRIMAN (KELUHAN VS INFORMASI)
        # -------------------------------------------------------------
        elif "pengiriman" in sub or "pengiriman" in detail or "pengiriman" in subj:
            source = "subCategory+detailSubCategory"
            status = "rule_matched"
            if has_any(detail, sub, ["terlambat", "melebihi estimasi", "tidak diterima", "kendala pengiriman"]) or "terlambat" in subj:
                mapped_subject = "Panduan-Keluhan Pengiriman (Market Place/Service)"
            else:
                mapped_subject = "Informasi-Progress Pengiriman (Pembelian/Service/dll)"

        # -------------------------------------------------------------
        # 5. SERVICE & REPAIR
        # -------------------------------------------------------------
        elif "service" in sub or "service" in detail or "service" in subj:
            source = "subCategory+detailSubCategory"
            status = "rule_matched"
            if has_any(detail, sub, ["mitracare", "unicom"]) or "mitracare" in subj or "unicom" in subj:
                if has_any(detail, sub, ["keluhan", "kendala"]) or "keluhan" in subj:
                    mapped_subject = "Panduan-Keluhan Mitracare/Unicom"
                else:
                    mapped_subject = "Informasi-Mitracare/Unicom"
            elif has_any(detail, sub, ["durasi", "kendala lagi", "recall"]):
                mapped_subject = "Panduan-Service Center (Durasi Service/Kendala Lagi/Recall)"
            elif has_any(detail, sub, ["progress", "status"]) or "update service" in subj:
                mapped_subject = "Informasi-Progress Service"
            elif has_any(detail, sub, ["lokasi", "alamat", "service center", "tgr", "sby"]):
                mapped_subject = "Informasi-Lokasi Service Center (Authorized Partner Service/SBY/TGR)"
            else:
                mapped_subject = "Informasi-Progress Service"

        # -------------------------------------------------------------
        # 6. KENDALA TEKNIS / KENDALA UNIT
        # -------------------------------------------------------------
        elif "kendala teknis" in sub or has_any(detail, sub, ["kendala unit", "baterai", "sensor", "unit", "kerusakan produk"]) or "kendala unit" in subj or "kendala produk" in subj or "kerusakan produk" in subj:
            mapped_subject = "Panduan-Kendala Unit"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        # -------------------------------------------------------------
        # 7. PANDUAN PENGGUNAAN
        # -------------------------------------------------------------
        elif "panduan penggunaan" in sub or has_any(detail, sub, ["mapping", "pairing", "perawatan", "aplikasi"]) or "panduan" in subj:
            mapped_subject = "Panduan-Permintaan Panduan (Aplikasi/Mapping/Perawatan/Unit)"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        # -------------------------------------------------------------
        # 8. CARE / HOME CARE (ECOVACS VS TINECO)
        # -------------------------------------------------------------
        elif "ecovacs care" in sub or "ecovacs care" in detail or ("ecovacs" in cat and "care" in sub):
            source = "subCategory+category"
            status = "rule_matched"
            if "permintaan" in detail or "permintaan" in sub or "permintaan" in subj:
                mapped_subject = "Panduan-Permintaan Ecovacs Care/Home Care"
            else:
                mapped_subject = "Informasi-Ecovacs Care/Home Care"

        elif "tineco care" in sub or "tineco care" in detail or ("tineco" in cat and "care" in sub):
            source = "subCategory+category"
            status = "rule_matched"
            if "permintaan" in detail or "permintaan" in sub or "permintaan" in subj:
                mapped_subject = "Panduan-Permintaan Tineco Care/Home Care"
            else:
                mapped_subject = "Informasi-Tineco Care/Home Care"

        # -------------------------------------------------------------
        # 9. DISKON & PROMO
        # -------------------------------------------------------------
        elif "promo" in sub or "promo" in detail or "diskon" in sub or "promo" in subj or "diskon" in subj:
            source = "subCategory+detailSubCategory"
            status = "rule_matched"
            if "tidak sesuai" in detail or "keluhan" in detail or "keluhan" in subj:
                mapped_subject = "Panduan-Diskon & Promo Tidak Sesuai"
            else:
                mapped_subject = "Informasi-Diskon & Promo"

        # -------------------------------------------------------------
        # 10. HARGA / GARANSI / STOCK / SPESIFIKASI / SHOWROOM / PEMBELIAN
        # -------------------------------------------------------------
        elif has_any(sub, detail, ["harga", "biaya"]) or "harga" in subj or "biaya" in subj:
            mapped_subject = "Informasi-Harga (Aksesoris/Biaya Service/Produk/Sparepart/dll)"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif "garansi" in sub or "garansi" in detail or "garansi" in subj:
            mapped_subject = "Informasi-Garansi"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif has_any(sub, detail, ["stock", "spare part", "aksesoris"]) or "aksesoris" in subj or "spare part" in subj or "stock" in subj:
            mapped_subject = "Informasi-Stock Unit/Spare Parts/Aksesoris/dll"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif has_any(sub, detail, ["spesifikasi", 'fitur', "perbandingan"]) or "spesifikasi" in subj or "informasi produk" in subj:
            mapped_subject = "Informasi-Detail Spesifikasi Produk"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif has_any(sub, detail, ["lokasi", "store", "showroom"]):
            mapped_subject = "Informasi-Lokasi Showroom Offline/Market Place/Website"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif "pembelian" in sub or "pembelian" in detail or "pembelian" in subj:
            source = "subCategory+detailSubCategory"
            status = "rule_matched"
            if has_any(detail, sub, ["keluhan", "kerusakan", "kekurangan"]) or "keluhan" in subj:
                mapped_subject = "Panduan-Keluhan Pembelian Market Place/Website/Offline Store/Event"
            else:
                mapped_subject = "Informasi-Pembelian"

        elif has_any(sub, detail, ["kerjasama", "sponsorship"]) or "kerja sama" in subj or "sponsorship" in subj:
            mapped_subject = "Informasi-Penawaran Kerjasama & Sponsorship"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif "penipuan" in sub or "penipuan" in detail or "penipuan" in subj:
            mapped_subject = "Informasi-Penipuan"
            source = "subCategory+detailSubCategory"
            status = "rule_matched"

        elif "spam" in sub or "spam" in detail or "spam" in subj:
            mapped_subject = "Other-Testing OMNIX"
            source = "subCategory+subject"
            status = "rule_matched"

        # -------------------------------------------------------------
        # FALLBACK LAST RESORT VIA SUBJECT ORIGINAL
        # -------------------------------------------------------------
        if not mapped_subject and subject_raw:
            clean_sub = str(subject_raw).strip("'\" ").strip()
            if clean_sub != "" and clean_sub != "-":
                # Fallback check based on mainCategory
                if "informasi" in main:
                    mapped_subject = "Informasi-Detail Spesifikasi Produk"
                    status = "needs_review"
                    source = "mainCategory+subject_fallback"
                elif "panduan" in main:
                    mapped_subject = "Panduan-Permintaan Panduan (Aplikasi/Mapping/Perawatan/Unit)"
                    status = "needs_review"
                    source = "mainCategory+subject_fallback"
                else:
                    mapped_subject = f"Other-{clean_sub[:30]}"
                    status = "needs_review"
                    source = "subject_fallback"

        if not mapped_subject:
            status = "unmapped"
            source = "none"

        return {
            "subject_original": str(subject_raw) if subject_raw else None,
            "subject_normalized": mapped_subject,
            "mapping_status": status,
            "mapping_source": source,
            "mapping_version": cls.VERSION,
        }
