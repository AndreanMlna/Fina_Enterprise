"""
FINA-ENTERPRISE: Startup Heuristics Domain Service
File: backend/app/domain/services/startup_heuristics.py
Standards: SAK EMKM, Clean Code, Single Responsibility Principle (SRP)

Modul ini bertanggung jawab menyediakan heuristik katalog awal UMKM untuk:
1. Belanja modal awal (bahan mentah, kemasan, alat kerja, operasional).
2. Katalog produk siap jual di POS kasir (produk jadi olahan, layanan jasa, ritel)
   lengkap dengan estimasi HPP dan proteksi margin anti-rugi.
Digunakan sebagai fallback deterministik yang andal saat LLM AI offline atau kuota habis.
"""

from typing import Dict, Any, List


def calculate_startup_selling_price(cost: float, margin_pct: float) -> float:
    """
    Menghitung harga jual yang melindungi target margin kotor minimum:
    Selling Price = Cost / (1 - Margin%)
    Dibulatkan ke kelipatan Rp 500 terdekat untuk kemudahan transaksi kasir.
    """
    if cost <= 0:
        return 0.0
    safe_margin = max(5.0, min(85.0, margin_pct))
    raw_price = cost / max(0.1, (1.0 - (safe_margin / 100.0)))
    return float(round(raw_price / 500) * 500)


def _get_marinasi_heuristic(query: str, safe_margin: float) -> Dict[str, Any]:
    """Heuristik untuk usaha F&B Olahan, Frozen Food, dan Aneka Lauk Marinasi."""
    items = [
        {"name": "Ayam Potong Broiler Segar (Karkas)", "category": "Bahan Baku", "quantity": 10, "unit": "Kg", "estimated_unit_cost": 36000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Bahan baku utama ayam marinasi, 1 kg menghasilkan 1-2 pack porsi"},
        {"name": "Ikan Nila / Gurame Segar Bersih", "category": "Bahan Baku", "quantity": 8, "unit": "Kg", "estimated_unit_cost": 34000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Bahan baku ikan marinasi bumbu kuning/gurih"},
        {"name": "Bumbu Rempah Marinasi (Bawang, Kunyit, Ketumbar, Garam)", "category": "Bahan Baku", "quantity": 4, "unit": "Kg", "estimated_unit_cost": 28000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Racikan bumbu marinasi meresap siap olah"},
        {"name": "Plastik Vacuum / Ziploc Food Grade Tebal", "category": "Kemasan", "quantity": 4, "unit": "Pack", "estimated_unit_cost": 26000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Kemasan kedap udara menjaga kualitas lauk marinasi tahan lama di freezer"},
        {"name": "Stiker Label Brand, Varian & Tanggal Produksi", "category": "Kemasan", "quantity": 3, "unit": "Pack", "estimated_unit_cost": 18000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Identitas merek dan informasi tanggal kedaluwarsa produk"},
        {"name": "Wadah Box Plastik / Container Marinasi Besar", "category": "Alat Kerja", "quantity": 2, "unit": "Pcs", "estimated_unit_cost": 35000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Wadah higienis saat proses perendaman bumbu sebelum divakum"},
        {"name": "Timbangan Digital Dapur Presisi", "category": "Alat Kerja", "quantity": 1, "unit": "Unit", "estimated_unit_cost": 65000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Menjamin gramasi per kemasan pas sehingga modal tidak bocor"}
    ]
    finished = [
        {
            "name": "Ayam Marinasi Bumbu Spesial (1 Ekor / Pack)",
            "category": "Lauk Olahan",
            "unit": "Pack",
            "cogs": 38000,
            "selling_price": calculate_startup_selling_price(38000, safe_margin),
            "target_margin_percent": safe_margin,
            "stock": 10,
            "recipe_summary": "Ayam broiler segar 1kg + racikan bumbu marinasi + plastik vacuum + stiker logo"
        },
        {
            "name": "Ikan Nila Marinasi Bumbu Kuning (500 gr)",
            "category": "Lauk Olahan",
            "unit": "Pack",
            "cogs": 24000,
            "selling_price": calculate_startup_selling_price(24000, safe_margin),
            "target_margin_percent": safe_margin,
            "stock": 10,
            "recipe_summary": "Ikan nila bersih 500g + bumbu kuning rempah + plastik vacuum"
        },
        {
            "name": "Ayam Marinasi Spicy Pedas Manis (1 Ekor / Pack)",
            "category": "Lauk Olahan",
            "unit": "Pack",
            "cogs": 39500,
            "selling_price": calculate_startup_selling_price(39500, safe_margin),
            "target_margin_percent": safe_margin,
            "stock": 8,
            "recipe_summary": "Ayam broiler 1kg + racikan saus spicy marinasi + kemasan vacuum"
        },
        {
            "name": "Paket Lauk Marinasi Tempe & Tahu Kuning (Pack Isi 10)",
            "category": "Lauk Olahan",
            "unit": "Pack",
            "cogs": 9000,
            "selling_price": calculate_startup_selling_price(9000, safe_margin),
            "target_margin_percent": safe_margin,
            "stock": 15,
            "recipe_summary": "Tempe & tahu pilihan + bumbu bacem/kuning marinasi"
        }
    ]
    return {
        "business_model": "PROCESSED_GOODS",
        "business_summary": f"Rencana Usaha Lauk Olahan & Marinasi Siap Masak '{query}'. Memisahkan belanja modal (bahan mentah & kemasan vakum) dari produk jadi yang dijual di kasir.",
        "pricing_strategy_notes": f"Formula Anti-Rugi: HPP produk marinasi mencakup bahan baku + bumbu racik + kemasan vakum/stiker + susut berat (10%). Patok margin {safe_margin:.0f}%+ agar menutup biaya listrik freezer dan penyimpanan dingin.",
        "suggested_items": items,
        "finished_products": finished,
        "engine": "FINA-Deterministic-Heuristic-Engine"
    }


def _get_coffee_heuristic(query: str, safe_margin: float) -> Dict[str, Any]:
    """Heuristik untuk usaha Kafe, Coffee Shop, dan Minuman Kekinian."""
    items = [
        {"name": "Biji Kopi Espresso Blend 1Kg", "category": "Bahan Baku", "quantity": 3, "unit": "Kg", "estimated_unit_cost": 85000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Bahan utama espresso, 1kg menghasilkan ~50 cup"},
        {"name": "Susu UHT Full Cream 1 Liter", "category": "Bahan Baku", "quantity": 12, "unit": "Liter", "estimated_unit_cost": 18500, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Bahan dasar kopi susu, 1 liter untuk 5-6 cup"},
        {"name": "Gula Aren Cair Organik 1 Liter", "category": "Bahan Baku", "quantity": 3, "unit": "Liter", "estimated_unit_cost": 38000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Pemanis signature kopi susu gula aren"},
        {"name": "Cup Plastik 16oz + Lid Dome", "category": "Kemasan", "quantity": 5, "unit": "Pack", "estimated_unit_cost": 24000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Gelas saji dingin higienis"},
        {"name": "Sedotan Steril & Paper Bag", "category": "Kemasan", "quantity": 2, "unit": "Pack", "estimated_unit_cost": 12000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Pelengkap take away"},
        {"name": "Timbangan Digital Presisi 0.1g", "category": "Alat Kerja", "quantity": 1, "unit": "Unit", "estimated_unit_cost": 75000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Menjaga takaran gramasi bubuk kopi"},
        {"name": "Jigger & Sendok Bar Stainless", "category": "Alat Kerja", "quantity": 1, "unit": "Set", "estimated_unit_cost": 45000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Takaran sirup agar konsisten"}
    ]
    finished = [
        {"name": "Kopi Susu Gula Aren (Ice 16oz)", "category": "Minuman", "unit": "Cup", "cogs": 6500, "selling_price": calculate_startup_selling_price(6500, safe_margin), "target_margin_percent": safe_margin, "stock": 50, "recipe_summary": "Espresso shot + Susu UHT + Gula aren + Cup & Lid"},
        {"name": "Americano / Long Black (Ice 16oz)", "category": "Minuman", "unit": "Cup", "cogs": 3500, "selling_price": calculate_startup_selling_price(3500, safe_margin), "target_margin_percent": safe_margin, "stock": 40, "recipe_summary": "Double shot espresso + Air mineral + Cup"},
        {"name": "Creamy Matcha Latte (Ice 16oz)", "category": "Minuman", "unit": "Cup", "cogs": 8000, "selling_price": calculate_startup_selling_price(8000, safe_margin), "target_margin_percent": safe_margin, "stock": 30, "recipe_summary": "Matcha powder + Susu UHT + Sirup"}
    ]
    return {
        "business_model": "PROCESSED_GOODS",
        "business_summary": f"Rencana Kedai Minuman & Kopi untuk '{query}'. Memisahkan bahan racik dari menu cup siap saji di POS.",
        "pricing_strategy_notes": f"Formula Anti-Rugi: Food cost minuman ideal di 25%-35% (Margin kotor {safe_margin:.0f}%+). Perhitungkan es batu, cup, dan susu.",
        "suggested_items": items,
        "finished_products": finished,
        "engine": "FINA-Deterministic-Heuristic-Engine"
    }


def _get_laundry_heuristic(query: str, safe_margin: float) -> Dict[str, Any]:
    """Heuristik untuk usaha Jasa Laundry & Kiloan."""
    items = [
        {"name": "Deterjen Cair Konsentrat 5L", "category": "Bahan Baku", "quantity": 3, "unit": "Jerigen", "estimated_unit_cost": 65000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Bahan cuci utama mesin cuci"},
        {"name": "Pewangi & Pelembut Pakaian 5L", "category": "Bahan Baku", "quantity": 2, "unit": "Jerigen", "estimated_unit_cost": 55000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Pelembut bilasan cucian"},
        {"name": "Parfum Laundry Premium 1L", "category": "Bahan Baku", "quantity": 2, "unit": "Liter", "estimated_unit_cost": 42000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Semprotan finishing saat packing"},
        {"name": "Plastik Packing Laundry Jinjing", "category": "Kemasan", "quantity": 4, "unit": "Pack", "estimated_unit_cost": 28000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Kemasan anti air hasil setrika"},
        {"name": "Timbangan Gantung / Duduk 30Kg", "category": "Alat Kerja", "quantity": 1, "unit": "Unit", "estimated_unit_cost": 125000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Menimbang berat cucian pelanggan secara presisi"},
        {"name": "Setrika Uap Boiler Standar", "category": "Alat Kerja", "quantity": 1, "unit": "Unit", "estimated_unit_cost": 350000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Mempercepat setrika rapi"}
    ]
    finished = [
        {"name": "Jasa Cuci + Setrika Reguler (2 Hari)", "category": "Jasa", "unit": "Kg", "cogs": 1800, "selling_price": calculate_startup_selling_price(1800, safe_margin), "target_margin_percent": safe_margin, "stock": 100, "recipe_summary": "Deterjen + Softener + Parfum + Plastik packing"},
        {"name": "Jasa Cuci Kering Lipat (1 Hari)", "category": "Jasa", "unit": "Kg", "cogs": 1200, "selling_price": calculate_startup_selling_price(1200, safe_margin), "target_margin_percent": safe_margin, "stock": 100, "recipe_summary": "Deterjen + Softener + Packing"},
        {"name": "Jasa Cuci Bedcover Besar (Pcs)", "category": "Jasa", "unit": "Pcs", "cogs": 5500, "selling_price": calculate_startup_selling_price(5500, safe_margin), "target_margin_percent": safe_margin, "stock": 20, "recipe_summary": "Deterjen ekstra + Softener + Plastik jumbo"},
        {"name": "Jasa Setrika Uap Kilat Rapi", "category": "Jasa", "unit": "Kg", "cogs": 1000, "selling_price": calculate_startup_selling_price(1000, safe_margin), "target_margin_percent": safe_margin, "stock": 50, "recipe_summary": "Parfum laundry + Gas setrika uap + Packing"}
    ]
    return {
        "business_model": "SERVICE",
        "business_summary": f"Rencana Usaha Jasa Laundry untuk '{query}'. Memisahkan bahan sabun operasional dari tarif layanan jasa di POS kasir.",
        "pricing_strategy_notes": f"Formula Anti-Rugi: Biaya bahan kimia dan listrik rata-rata Rp 1.500 - Rp 2.000/kg. Patok tarif minimal Rp 7.000 - Rp 9.000/kg untuk margin sehat.",
        "suggested_items": items,
        "finished_products": finished,
        "engine": "FINA-Deterministic-Heuristic-Engine"
    }


def _get_retail_heuristic(query: str, safe_margin: float) -> Dict[str, Any]:
    """Heuristik untuk usaha Toko Sembako dan Retail Kelontong."""
    items = [
        {"name": "Beras Premium Ramos 25Kg", "category": "Sembako", "quantity": 4, "unit": "Karung", "estimated_unit_cost": 340000, "recommended_selling_price": calculate_startup_selling_price(340000 / 5, 12.0), "target_margin_percent": 12.0, "reason": "Bahan pokok dipecah per sak 5kg"},
        {"name": "Minyak Goreng Sawit Pouch 2L (Dus)", "category": "Sembako", "quantity": 3, "unit": "Dus", "estimated_unit_cost": 210000, "recommended_selling_price": calculate_startup_selling_price(210000 / 6, 10.0), "target_margin_percent": 10.0, "reason": "Kebutuhan harian rumah tangga (1 dus isi 6 pouch)"},
        {"name": "Gula Pasir Kristal Putih 50Kg", "category": "Sembako", "quantity": 1, "unit": "Karung", "estimated_unit_cost": 820000, "recommended_selling_price": calculate_startup_selling_price(820000 / 50, 15.0), "target_margin_percent": 15.0, "reason": "Diecer per 1kg"},
        {"name": "Tepung Terigu Segitiga Biru 1Kg (Dus)", "category": "Sembako", "quantity": 2, "unit": "Dus", "estimated_unit_cost": 135000, "recommended_selling_price": calculate_startup_selling_price(135000 / 12, 18.0), "target_margin_percent": 18.0, "reason": "Bahan olahan kue dan gorengan"},
        {"name": "Telur Ayam Ras Segar 1 Krat (15Kg)", "category": "Sembako", "quantity": 2, "unit": "Krat", "estimated_unit_cost": 380000, "recommended_selling_price": calculate_startup_selling_price(380000 / 15, 12.0), "target_margin_percent": 12.0, "reason": "Diecer per 1kg"},
        {"name": "Kantong Plastik Kresek Ramah Lingkungan", "category": "Kemasan", "quantity": 5, "unit": "Pack", "estimated_unit_cost": 14000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Packing belanjaan pembeli (bukan produk jual)"},
        {"name": "Timbangan Digital Meja 30Kg", "category": "Alat Kerja", "quantity": 1, "unit": "Unit", "estimated_unit_cost": 145000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Alat ukur penjualan eceran"}
    ]
    finished = [
        {"name": "Beras Premium Ramos Sak 5 Kg", "category": "Sembako", "unit": "Sak", "cogs": 68000, "selling_price": calculate_startup_selling_price(68000, 12.0), "target_margin_percent": 12.0, "stock": 20, "recipe_summary": "Beras premium kemasan praktis"},
        {"name": "Minyak Goreng Pouch 2 Liter", "category": "Sembako", "unit": "Pouch", "cogs": 35000, "selling_price": calculate_startup_selling_price(35000, 10.0), "target_margin_percent": 10.0, "stock": 18, "recipe_summary": "Minyak kelapa sawit higienis"},
        {"name": "Gula Pasir Kristal 1 Kg", "category": "Sembako", "unit": "Kg", "cogs": 16400, "selling_price": calculate_startup_selling_price(16400, 15.0), "target_margin_percent": 15.0, "stock": 50, "recipe_summary": "Gula putih murni"},
        {"name": "Telur Ayam Ras Segar 1 Kg", "category": "Sembako", "unit": "Kg", "cogs": 25300, "selling_price": calculate_startup_selling_price(25300, 12.0), "target_margin_percent": 12.0, "stock": 30, "recipe_summary": "Telur segar harian"}
    ]
    return {
        "business_model": "RETAIL",
        "business_summary": f"Rencana Belanja Pasokan Toko Sembako untuk '{query}'. Barang dagangan yang dibeli langsung menjadi produk eceran di POS kasir.",
        "pricing_strategy_notes": "Formula Anti-Rugi: Sembako fast-moving margin tipis (10%-15%), kombinasikan dengan barang komplementer (20%-25%).",
        "suggested_items": items,
        "finished_products": finished,
        "engine": "FINA-Deterministic-Heuristic-Engine"
    }


def _get_general_culinary_heuristic(query: str, safe_margin: float) -> Dict[str, Any]:
    """Heuristik untuk usaha Kuliner dan Rumah Makan Umum."""
    items = [
        {"name": "Beras Putih Pulen 25Kg", "category": "Bahan Baku", "quantity": 2, "unit": "Karung", "estimated_unit_cost": 345000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Bahan pokok makanan, 1 karung menghasilkan ~150 porsi"},
        {"name": "Minyak Goreng Sawit 2L", "category": "Bahan Baku", "quantity": 6, "unit": "Pcs", "estimated_unit_cost": 36000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Minyak goreng untuk memasak"},
        {"name": "Ayam Broiler Segar Karkas", "category": "Bahan Baku", "quantity": 10, "unit": "Kg", "estimated_unit_cost": 35000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Bahan utama menu ayam goreng/bakar"},
        {"name": "Bumbu Dapur, Cabai & Bawang Merah/Putih", "category": "Bahan Baku", "quantity": 5, "unit": "Kg", "estimated_unit_cost": 35000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Racikan bumbu sambal dan masakan"},
        {"name": "Gas Elpiji 3Kg (Isi Ulang)", "category": "Operasional", "quantity": 4, "unit": "Tabung", "estimated_unit_cost": 22000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Bahan bakar kompor dapur"},
        {"name": "Kotak Bento Box / Paper Bowl Take Away", "category": "Kemasan", "quantity": 3, "unit": "Pack", "estimated_unit_cost": 35000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Kemasan makanan higienis"},
        {"name": "Wajan Kuali Komersial & Spatula", "category": "Alat Kerja", "quantity": 1, "unit": "Set", "estimated_unit_cost": 165000, "recommended_selling_price": 0, "target_margin_percent": 0, "reason": "Peralatan masak kapasitas besar"}
    ]
    finished = [
        {"name": "Paket Nasi Ayam Goreng Sambal Spesial", "category": "Makanan", "unit": "Porsi", "cogs": 13500, "selling_price": calculate_startup_selling_price(13500, safe_margin), "target_margin_percent": safe_margin, "stock": 25, "recipe_summary": "Nasi putih + 1 potong ayam goreng bumbu + sambal + lalapan + kotak kemasan"},
        {"name": "Paket Nasi Ayam Bakar Bumbu Madu", "category": "Makanan", "unit": "Porsi", "cogs": 14500, "selling_price": calculate_startup_selling_price(14500, safe_margin), "target_margin_percent": safe_margin, "stock": 20, "recipe_summary": "Nasi putih + ayam bakar madu + sambal + lalapan"},
        {"name": "Porsi Nasi Putih Pulen Ekstra", "category": "Makanan", "unit": "Porsi", "cogs": 2000, "selling_price": calculate_startup_selling_price(2000, safe_margin), "target_margin_percent": safe_margin, "stock": 40, "recipe_summary": "Beras pulen pilihan"},
        {"name": "Es Teh Manis Segar", "category": "Minuman", "unit": "Porsi", "cogs": 1500, "selling_price": calculate_startup_selling_price(1500, safe_margin), "target_margin_percent": safe_margin, "stock": 50, "recipe_summary": "Teh melati + gula pasir + es batu"}
    ]
    return {
        "business_model": "PROCESSED_GOODS",
        "business_summary": f"Rencana Kebutuhan Dapur & Operasional untuk '{query}'. Memisahkan bahan baku dapur dari menu makanan siap santap di kasir.",
        "pricing_strategy_notes": f"Formula Anti-Rugi: Patok harga jual minimum HPP bahan + Overhead (25%) + Margin Bersih ({safe_margin:.0f}%). Hindari menjual di bawah batas impas.",
        "suggested_items": items,
        "finished_products": finished,
        "engine": "FINA-Deterministic-Heuristic-Engine"
    }


def get_startup_heuristic_recommendation(
    query: str,
    target_margin: float = 40.0
) -> Dict[str, Any]:
    """
    Dispatcher heuristik domain: memilih strategi katalog modal awal dan produk siap jual
    berdasarkan kata kunci tipe usaha UMKM pengguna.
    """
    clean_query = (query or "").strip()
    safe_margin = max(10.0, min(85.0, float(target_margin or 40.0)))
    q_lower = clean_query.lower()

    if any(k in q_lower for k in ["marinasi", "frozen", "ikan", "ayam marinasi", "lauk", "olahan", "pre-cooked"]):
        return _get_marinasi_heuristic(clean_query, safe_margin)
    elif any(k in q_lower for k in ["kopi", "cafe", "coffee", "boba", "teh", "minuman"]):
        return _get_coffee_heuristic(clean_query, safe_margin)
    elif any(k in q_lower for k in ["laundry", "cuci"]):
        return _get_laundry_heuristic(clean_query, safe_margin)
    elif any(k in q_lower for k in ["sembako", "kelontong", "toko", "retail", "warung sembako"]):
        return _get_retail_heuristic(clean_query, safe_margin)
    else:
        return _get_general_culinary_heuristic(clean_query, safe_margin)
