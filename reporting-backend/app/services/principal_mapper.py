"""Principal Group and Principal Category mapping engine.

Maps raw case categories (Main Category, Subcategory, Detail Subcategory)
to standardized Principal reporting dimensions without modifying raw upload data in DB.
"""

from typing import Dict, Optional, Tuple

PRINCIPAL_RULES: Dict[Tuple[str, str, str], Tuple[str, str]] = {
    ('Informasi', 'Boboduck - Service', 'Service Center Terdekat'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Boboduck - Service', 'Status Service'): ('Aftersale-Service inquiry', 'Repair Progress'),
    ('Informasi', 'Ecovacs - Care', 'Seputar Layanan'): ('Aftersale-Service inquiry', 'Service Inquiry'),
    ('Informasi', 'Ecovacs - Diskon & Promo', 'Detail Informasi Diskon & Promo'): ('Pre-sales', 'Promotion/Discount'),
    ('Informasi', 'Ecovacs - Garansi', 'Ketentuan Garansi'): ('Aftersale-Service inquiry', 'Warranty policy'),
    ('Informasi', 'Ecovacs - Marketing Event', 'Detail Informasi Diskon & Promo'): ('Pre-sales', 'Promotion/Discount'),
    ('Informasi', 'Ecovacs - Panduan Penggunaan', 'Mapping'): ('How to use', 'Map creation'),
    ('Informasi', 'Ecovacs - Panduan Penggunaan', 'Pairing'): ('How to use', 'App connection'),
    ('Informasi', 'Ecovacs - Panduan Penggunaan', 'Pemakaian Aksesories'): ('How to use', 'Parts maintenance'),
    ('Informasi', 'Ecovacs - Panduan Penggunaan', 'Perawatan'): ('How to use', 'Parts maintenance'),
    ('Informasi', 'Ecovacs - Pertanyaan Seputar Produk', 'Detail Spesifikasi Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Ecovacs - Pertanyaan Seputar Produk', 'Fitur & Keunggulan Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Ecovacs - Pertanyaan Seputar Produk', 'Perbandingan dengan Tipe Lain'): ('Pre-sales', 'Other Ecovacs Model Comparison'),
    ('Informasi', 'Ecovacs - Pesanan & Pengiriman', 'Status Pengiriman'): ('Shipping issues', 'Urge Delivery'),
    ('Informasi', 'Ecovacs - Service', 'Mitracare - Unicom'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Ecovacs - Service', 'Service Center Terdekat'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Ecovacs - Service', 'Status Service'): ('Aftersale-Service inquiry', 'Repair Progress'),
    ('Informasi', 'KANS - Pertanyaan Seputar Produk', 'Detail Spesifikasi Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Ketentuan Garansi', 'Ketentuan Garansi'): ('Aftersale-Service inquiry', 'Warranty policy'),
    ('Informasi', 'Laifen - Diskon & Promo', 'Detail Informasi Diskon & Promo'): ('Pre-sales', 'Promotion/Discount'),
    ('Informasi', 'Laifen - Garansi', 'Ketentuan Garansi'): ('Aftersale-Service inquiry', 'Warranty policy'),
    ('Informasi', 'Laifen - Marketing Event', 'Detail Informasi Diskon & Promo'): ('Pre-sales', 'Promotion/Discount'),
    ('Informasi', 'Laifen - Panduan Penggunaan', 'Pemakaian Aksesories'): ('How to use', 'Parts maintenance'),
    ('Informasi', 'Laifen - Panduan Penggunaan', 'Perawatan'): ('How to use', 'Parts maintenance'),
    ('Informasi', 'Laifen - Pertanyaan Seputar Produk', 'Detail Spesifikasi Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Laifen - Pertanyaan Seputar Produk', 'Fitur & Keunggulan Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Laifen - Pertanyaan Seputar Produk', 'Perbandingan dengan Tipe Lain'): ('Pre-sales', 'Other Ecovacs Model Comparison'),
    ('Informasi', 'Laifen - Pesanan & Pengiriman', 'Estimasi Kedatangan Barang'): ('Shipping issues', 'Delayed shipment'),
    ('Informasi', 'Laifen - Pesanan & Pengiriman', 'Status Pengiriman'): ('Shipping issues', 'Urge Delivery'),
    ('Informasi', 'Laifen - Service', 'Mitracare - Unicom'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Laifen - Service', 'Service Center Terdekat'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Laifen - Service', 'Status Service'): ('Aftersale-Service inquiry', 'Repair Progress'),
    ('Informasi', 'Tineco - Diskon & Promo', 'Detail Informasi Diskon & Promo'): ('Pre-sales', 'Promotion/Discount'),
    ('Informasi', 'Tineco - Garansi', 'Ketentuan Garansi'): ('Aftersale-Service inquiry', 'Warranty policy'),
    ('Informasi', 'Tineco - Marketing Event', 'Detail Informasi Diskon & Promo'): ('Pre-sales', 'Promotion/Discount'),
    ('Informasi', 'Tineco - Panduan Penggunaan', 'Pairing'): ('How to use', 'App connection'),
    ('Informasi', 'Tineco - Panduan Penggunaan', 'Pemakaian Aksesories'): ('How to use', 'Parts maintenance'),
    ('Informasi', 'Tineco - Panduan Penggunaan', 'Perawatan'): ('How to use', 'Parts maintenance'),
    ('Informasi', 'Tineco - Pertanyaan Seputar Produk', 'Detail Spesifikasi Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Tineco - Pertanyaan Seputar Produk', 'Fitur & Keunggulan Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Tineco - Pertanyaan Seputar Produk', 'Perbandingan dengan Tipe Lain'): ('Pre-sales', 'Other Ecovacs Model Comparison'),
    ('Informasi', 'Tineco - Pesanan & Pengiriman', 'Estimasi Kedatangan Barang'): ('Shipping issues', 'Delayed shipment'),
    ('Informasi', 'Tineco - Pesanan & Pengiriman', 'Status Pengiriman'): ('Shipping issues', 'Urge Delivery'),
    ('Informasi', 'Tineco - Service', 'Mitracare - Unicom'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Tineco - Service', 'Service Center Terdekat'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Tineco - Service', 'Status Service'): ('Aftersale-Service inquiry', 'Repair Progress'),
    ('Informasi', 'Usmile - Marketing Event', 'Detail Informasi Diskon & Promo'): ('Pre-sales', 'Promotion/Discount'),
    ('Informasi', 'Usmile - Panduan Penggunaan', 'Perawatan'): ('How to use', 'Parts maintenance'),
    ('Informasi', 'Usmile - Pertanyaan Seputar Produk', 'Detail Spesifikasi Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Usmile - Pertanyaan Seputar Produk', 'Fitur & Keunggulan Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Usmile - Pertanyaan Seputar Produk', 'Perbandingan dengan Tipe Lain'): ('Pre-sales', 'Other Ecovacs Model Comparison'),
    ('Informasi', 'Usmile - Pesanan & Pengiriman', 'Status Pengiriman'): ('Shipping issues', 'Urge Delivery'),
    ('Informasi', 'Usmile - Service', 'Mitracare - Unicom'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Usmile - Service', 'Service Center Terdekat'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Yoniev - Care', 'Seputar Layanan'): ('Aftersale-Service inquiry', 'Service Inquiry'),
    ('Informasi', 'Yoniev - Diskon & Promo', 'Detail Informasi Diskon & Promo'): ('Pre-sales', 'Promotion/Discount'),
    ('Informasi', 'Yoniev - Marketing Event', 'Detail Informasi Diskon & Promo'): ('Pre-sales', 'Promotion/Discount'),
    ('Informasi', 'Yoniev - Panduan Penggunaan', 'Pairing'): ('How to use', 'App connection'),
    ('Informasi', 'Yoniev - Panduan Penggunaan', 'Pemakaian Aksesories'): ('How to use', 'Parts maintenance'),
    ('Informasi', 'Yoniev - Panduan Penggunaan', 'Perawatan'): ('How to use', 'Parts maintenance'),
    ('Informasi', 'Yoniev - Pertanyaan Seputar Produk', 'Detail Spesifikasi Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Yoniev - Pertanyaan Seputar Produk', 'Fitur & Keunggulan Produk'): ('Pre-sales', 'Product'),
    ('Informasi', 'Yoniev - Pertanyaan Seputar Produk', 'Perbandingan dengan Tipe Lain'): ('Pre-sales', 'Other Ecovacs Model Comparison'),
    ('Informasi', 'Yoniev - Pesanan & Pengiriman', 'Estimasi Kedatangan Barang'): ('Shipping issues', 'Delayed shipment'),
    ('Informasi', 'Yoniev - Pesanan & Pengiriman', 'Status Pengiriman'): ('Shipping issues', 'Urge Delivery'),
    ('Informasi', 'Yoniev - Service', 'Mitracare - Unicom'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Yoniev - Service', 'Service Center Terdekat'): ('Aftersale-Service inquiry', 'Repair centre'),
    ('Informasi', 'Yoniev - Service', 'Status Service'): ('Aftersale-Service inquiry', 'Repair Progress'),
    ('Other', 'Ecovacs - Ecovacs Care', 'Permintaan Ecovacs Care'): ('Aftersale-Service inquiry', 'Home Care Request'),
    ('Panduan', 'Boboduck - Kendala teknis', 'Kendala Pada Unit'): ('Failure', 'General Device Failure'),
    ('Panduan', 'Ecovacs - Kendala Non Teknis', 'Durasi Service'): ('Aftersale-Service inquiry', 'Progress Progress'),
    ('Panduan', 'Ecovacs - Kendala Teknis', 'Kendala Pada Unit'): ('Failure', 'General Device Failure'),
    ('Panduan', 'Ecovacs - Pengembalian Barang & Dana', 'Aksesoris Tidak Lengkap'): ('Pre-sales', 'Missing Parts'),
    ('Panduan', 'Laifen - Kendala Teknis', 'Kendala Pada Unit'): ('Failure', 'General Device Failure'),
    ('Panduan', 'Laifen - Pengembalian Barang & Dana', 'Kerusakan Produk'): ('Failure', 'Product Defect'),
    ('Panduan', 'Tineco - Kendala Non Teknis', 'Durasi Service'): ('Aftersale-Service inquiry', 'Progress Progress'),
    ('Panduan', 'Tineco - Kendala Teknis', 'Kendala Pada Unit'): ('Failure', 'General Device Failure'),
    ('Panduan', 'Tineco - Pengembalian Barang & Dana', 'Aksesoris Tidak Lengkap'): ('Pre-sales', 'Missing Parts'),
    ('Panduan', 'Tineco - Pengembalian Barang & Dana', 'Kerusakan Produk'): ('Failure', 'Product Defect'),
    ('Panduan', 'Tineco - Pengiriman', 'Resi Tidak Terlacak'): ('Express Related', 'Shipment inquiry'),
    ('Panduan', 'Usmile - Kendala Non Teknis', 'Durasi Service'): ('Aftersale-Service inquiry', 'Progress Progress'),
    ('Panduan', 'Usmile - Kendala Teknis', 'Kendala Pada Unit'): ('Failure', 'General Device Failure'),
    ('Panduan', 'Yoniev - Kendala Teknis', 'Kendala Pada Unit'): ('Failure', 'General Device Failure'),
}


def map_principal_dimensions(
    main_category: Optional[str],
    subcategory: Optional[str],
    detail_subcategory: Optional[str],
) -> Tuple[str, str]:
    """Map case category fields to (Principal Group, Principal Category)."""
    m = (main_category or "").strip()
    s = (subcategory or "").strip()
    d = (detail_subcategory or "").strip()

    # 1. Exact match
    key = (m, s, d)
    if key in PRINCIPAL_RULES:
        return PRINCIPAL_RULES[key]

    # 2. Match without brand prefix in subcategory
    sub_clean = s.split(" - ", 1)[-1] if " - " in s else s
    for (rm, rs, rd), (r_group, r_cat) in PRINCIPAL_RULES.items():
        rs_clean = rs.split(" - ", 1)[-1] if " - " in rs else rs
        if rm.lower() == m.lower() and rs_clean.lower() == sub_clean.lower() and rd.lower() == d.lower():
            return (r_group, r_cat)

    # 3. Fuzzy heuristic fallback if not in dictionary
    m_lower = m.lower()
    s_lower = s.lower()
    d_lower = d.lower()

    if "kendala" in s_lower or "kendala" in m_lower or "rusak" in d_lower:
        if "baterai" in d_lower or "battery" in d_lower:
            return ("Failure", "Battery Issue")
        if "spare part" in d_lower or "sparepart" in d_lower or "part" in d_lower:
            return ("Failure", "Spare Part Issue")
        if "motor" in d_lower:
            return ("Failure", "Motor Issue")
        if "sensor" in d_lower:
            return ("Failure", "Sensor Issue")
        if "air" in d_lower or "cwt" in d_lower or "dwt" in d_lower:
            return ("Failure", "Water System Issue")
        return ("Failure", "General Device Failure")

    if "panduan" in m_lower or "panduan" in s_lower:
        if "map" in d_lower:
            return ("How to use", "Map creation")
        if "pair" in d_lower or "aplikasi" in d_lower or "app" in d_lower:
            return ("How to use", "App connection")
        if "rawat" in d_lower or "aksesoris" in d_lower or "clean" in d_lower:
            return ("How to use", "Parts maintenance")
        return ("How to use", "New machines")

    if "service" in s_lower or "service" in d_lower:
        if "status" in d_lower or "progress" in d_lower:
            return ("Aftersale-Service inquiry", "Repair Progress")
        if "biaya" in d_lower or "harga" in d_lower:
            return ("Aftersale-Service inquiry", "Repair Fees")
        return ("Aftersale-Service inquiry", "Repair centre")

    if "promo" in s_lower or "diskon" in d_lower or "produk" in s_lower or "spesifikasi" in d_lower:
        return ("Pre-sales", "Product")

    if "kol" in s_lower or "sponsor" in d_lower:
        return ("Pre-sales", "Agency/Cooperation Consulting")

    return ("", "")


def enrich_principal_row(row: dict) -> dict:
    """Ensure a row has principal_group and principal_category populated."""
    row_copy = dict(row)
    pg = row_copy.get("principal_group")
    pc = row_copy.get("principal_category")

    if not pg or not pc or str(pg).strip().lower() in ["", "none", "null"]:
        group, category = map_principal_dimensions(
            row_copy.get("main_category"),
            row_copy.get("subcategory"),
            row_copy.get("detail_subcategory"),
        )
        if group:
            row_copy["principal_group"] = group
        if category:
            row_copy["principal_category"] = category

    return row_copy
