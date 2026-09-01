"""Principal Group and Principal Category mapping engine.

Synchronized directly with public.principal_mapping table in Supabase.
Maps raw case detail_subcategory to standardized Principal reporting dimensions
without altering raw database records.
"""

from typing import Dict, Optional, Tuple

# Exact 58 rules from Supabase public.principal_mapping table
PRINCIPAL_DETAIL_MAPPING: Dict[str, Tuple[str, str, bool]] = {
    'Aplikasi': ('How to use', 'App connection', True),
    'Biaya Service': ('Aftersale-Service inquiry', 'Repair Fees', True),
    'Biaya Service Mahal': ('Aftersale-Service inquiry', 'Repair Fees', True),
    'Detail Informasi Diskon & Promo': ('Pre-sales', 'Promotion/Discount', True),
    'Detail Spesifikasi Produk': ('Pre-sales', 'Product', True),
    'Durasi Service': ('Aftersale-Service inquiry', 'Progress Progress', True),
    'Estimasi Kedatangan Barang': ('Shipping issues', 'Delayed shipment', True),
    'Fitur & keunggulan Produk': ('Pre-sales', 'Product', True),
    'Kendala Baterai': ('Failure', 'Battery Issue', True),
    'Kendala CWT/DWT': ('Failure', 'Water System Issue', True),
    'Kendala Motor': ('Failure', 'Motor Issue', True),
    'Kendala Pada Unit': ('Failure', 'General Device Failure', True),
    'Kendala Sensor': ('Failure', 'Sensor Issue', True),
    'Kendala Spare Part': ('Failure', 'Spare Part Issue', True),
    'Ketentuan Garansi': ('Aftersale-Service inquiry', 'Warranty policy', True),
    'Klaim Garansi Hilang': ('Aftersale-Service inquiry', 'Warranty policy', True),
    'Klaim Garansi Produk': ('Aftersale-Service inquiry', 'Warranty policy', True),
    'Mapping': ('How to use', 'Map creation', True),
    'Mitracare - Unicom': ('Aftersale-Service inquiry', 'Repair centre', True),
    'Other - KOL Endorse': ('Pre-sales', 'Agency/Cooperation Consulting', True),
    'Other-KOL Mention': ('Pre-sales', 'Agency/Cooperation Consulting', True),
    'Pairing': ('How to use', 'App connection', True),
    'Panduan Penggunaan Awal': ('How to use', 'New machines', True),
    'Pemakaian Aksesories': ('How to use', 'Parts maintenance', True),
    'Penawaran Kerjasama & Sponsorship': ('Pre-sales', 'Agency/Cooperation Consulting', True),
    'Penawaran Kerjasama & Sponsorship All Brand': ('Pre-sales', 'Agency/Cooperation Consulting', True),
    'Penggunaan Awal': ('How to use', 'New machines', True),
    'Perawatan': ('How to use', 'Parts maintenance', True),
    'Perbandingan dengan Tipe Lain': ('Pre-sales', 'Other Ecovacs Model Comparison', True),
    'Recall Rate Service': ('Aftersale-Service inquiry', 'Repair Progress', True),
    'Resi Tidak Terlacak': ('Express Related', 'Shipment inquiry', True),
    'Service Center Terdekat': ('Aftersale-Service inquiry', 'Repair centre', True),
    'Service Center TGR/SBY': ('Aftersale-Service inquiry', 'Repair centre', True),
    'Status Pengiriman': ('Shipping issues', 'Urge Delivery', True),
    'Status Service': ('Aftersale-Service inquiry', 'Repair Progress', True),
    'Aksesoris Tidak Lengkap': ('Pre-sales', 'Missing Parts', True),
    'Boboduck - Stock / Sparepart': ('Pre-sales', 'Accessories', True),
    'Diskon & Promo Tidak Sesuai': ('Pre-sales', 'Promotion/Discount', True),
    'Informasi Ecovacs Care': ('Aftersale-Service inquiry', 'Home Care Service', True),
    'Informasi Tineco Care': ('Aftersale-Service inquiry', 'Home Care Service', True),
    'Informasi-Penawaran Brand Baru': ('Pre-sales', 'Agency/Cooperation Consulting', True),
    'Kedatangan Melebihi Estimasi': ('Shipping issues', 'Delayed shipment', True),
    'Keluhan Mitracare': ('Complaint', 'Service quality', True),
    'Keluhan Unicom': ('Complaint', 'Service quality', True),
    'Kendala Pembelian Marketplace': ('User Experience (Customer)', 'Offline Store Issue', True),
    'Kendala Pembelian Offline Store': ('User Experience (Customer)', 'Marketplace Issue', True),
    'Kendala Pembelian Website': ('User Experience (Customer)', 'Website Store Issue', True),
    'Kerusakan Produk': ('Failure', 'Product Defect', True),
    'Ketidaksesuaian Produk': ('Aftersale-Service inquiry', 'Product Issue', True),
    'Panduaan Penggunaan Awal': ('How to use', 'New machines', True),
    'Panduan-Kendala Penjualan & Pembelian': ('User Experience (Customer)', 'Sales Issues', True),
    'Pembelian di Website': ('Pre-sales', 'Website Store', True),
    'Permintaan Ecovacs Care': ('Aftersale-Service inquiry', 'Home Care Request', True),
    'Permintaan Retur': ('Aftersale-Service inquiry', 'Return Efficiency Consultation', True),
    'Salah Pembelian': ('Order refund', 'Customer Bought Wrong', True),
    'Seputar Layanan': ('Aftersale-Service inquiry', 'Service Inquiry', True),
    'Stock Unit/Spare Parts/Aksesoris/dll': ('Pre-sales', 'Stock Unit/Spare Parts/Aksesoris/etc', True),
    'Tineco-Permintaan Tineco Care': ('Aftersale-Service inquiry', 'Home Care Request', True),
}


def map_principal_dimensions(
    main_category: Optional[str],
    subcategory: Optional[str],
    detail_subcategory: Optional[str],
) -> Tuple[str, str, bool]:
    """Map case category fields to (Principal Group, Principal Category, Include in Report)."""
    d = (detail_subcategory or "").strip()
    s = (subcategory or "").strip()
    m = (main_category or "").strip()

    # 1. Exact match in Supabase principal_mapping table
    for k, (grp, cat, inc) in PRINCIPAL_DETAIL_MAPPING.items():
        if k.lower() == d.lower():
            return (grp, cat, inc)

    # 2. Match subcategory name if detail_subcategory is empty or equals subcategory
    for k, (grp, cat, inc) in PRINCIPAL_DETAIL_MAPPING.items():
        if k.lower() == s.lower():
            return (grp, cat, inc)

    # 3. Fuzzy heuristic fallback
    d_lower = d.lower()
    s_lower = s.lower()
    m_lower = m.lower()

    if any(kw in d_lower or kw in s_lower for kw in ["spam", "tidak dijawab", "sosmed activity", "mention", "comment", "story"]):
        return ("", "", False)

    if "baterai" in d_lower or "battery" in d_lower:
        return ("Failure", "Battery Issue", True)
    if "spare part" in d_lower or "sparepart" in d_lower or "part" in d_lower:
        return ("Failure", "Spare Part Issue", True)
    if "motor" in d_lower:
        return ("Failure", "Motor Issue", True)
    if "sensor" in d_lower:
        return ("Failure", "Sensor Issue", True)
    if "air" in d_lower or "cwt" in d_lower or "dwt" in d_lower:
        return ("Failure", "Water System Issue", True)
    if "rusak" in d_lower or "kendala" in d_lower or "kendala" in s_lower:
        return ("Failure", "General Device Failure", True)

    if "map" in d_lower:
        return ("How to use", "Map creation", True)
    if "pair" in d_lower or "aplikasi" in d_lower or "app" in d_lower:
        return ("How to use", "App connection", True)
    if "rawat" in d_lower or "aksesoris" in d_lower or "clean" in d_lower:
        return ("How to use", "Parts maintenance", True)
    if "panduan" in m_lower or "panduan" in s_lower:
        return ("How to use", "New machines", True)

    if "status" in d_lower or "progress" in d_lower:
        return ("Aftersale-Service inquiry", "Repair Progress", True)
    if "biaya" in d_lower or "harga" in d_lower:
        return ("Aftersale-Service inquiry", "Repair Fees", True)
    if "service" in s_lower or "service" in d_lower:
        return ("Aftersale-Service inquiry", "Repair centre", True)

    if "promo" in s_lower or "diskon" in d_lower or "produk" in s_lower or "spesifikasi" in d_lower:
        return ("Pre-sales", "Product", True)
    if "kol" in s_lower or "sponsor" in d_lower:
        return ("Pre-sales", "Agency/Cooperation Consulting", True)

    return ("", "", True)


def enrich_principal_row(row: dict) -> dict:
    """Ensure a row has principal_group and principal_category populated from principal_mapping."""
    row_copy = dict(row)
    pg = row_copy.get("principal_group")
    pc = row_copy.get("principal_category")

    if not pg or not pc or str(pg).strip().lower() in ["", "none", "null"]:
        grp, cat, _ = map_principal_dimensions(
            row_copy.get("main_category"),
            row_copy.get("subcategory"),
            row_copy.get("detail_subcategory"),
        )
        if grp:
            row_copy["principal_group"] = grp
        if cat:
            row_copy["principal_category"] = cat

    return row_copy
