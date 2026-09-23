"""
FINA-ENTERPRISE: Aturan Domain Perpajakan UMKM PP No. 55 Tahun 2022

Ketetapan Hukum Republik Indonesia:
- Peraturan Pemerintah No. 55 Tahun 2022 Pasal 56 s.d. 60.
- Wajib Pajak Orang Pribadi UMKM mendapat fasilitas batas peredaran bruto (omzet)
  tidak kena pajak (PTKP) sampai dengan Rp 500.000.000 dalam 1 tahun pajak.
- Bagian peredaran bruto di atas Rp 500.000.000 dikenakan PPh Final sebesar 0,5%.
"""

from decimal import Decimal
from typing import Dict, Any

class TaxPP55Rules:
    PTKP_THRESHOLD = Decimal("500000000.00")  # Rp 500 Juta
    FINAL_RATE = Decimal("0.005")            # 0.5%

    @classmethod
    def calculate_pp55_tax(
        cls, 
        current_period_gross_revenue: Decimal, 
        cumulative_year_gross_revenue: Decimal,
        is_corporate_entity: bool = False
    ) -> Dict[str, Any]:
        """
        Menghitung estimasi PPh Final PP 55/2022 secara presisi.
        
        Args:
            current_period_gross_revenue: Omzet masa/bulan ini
            cumulative_year_gross_revenue: Total omzet tahun berjalan sebelum masa ini
            is_corporate_entity: False jika UMKM Orang Pribadi (berhak PTKP Rp 500 jt),
                                 True jika Badan (CV/PT dikenakan 0,5% langsung tanpa PTKP).
        """
        current_rev = Decimal(str(current_period_gross_revenue))
        cum_rev_before = Decimal(str(cumulative_year_gross_revenue))
        total_rev_after = cum_rev_before + current_rev

        if is_corporate_entity:
            # Wajib Pajak Badan (PT / CV) tidak mendapat fasilitas PTKP Rp 500 juta
            taxable_amount = current_rev
            tax_due = (taxable_amount * cls.FINAL_RATE).quantize(Decimal("1.00"))
            return {
                "entity_type": "BADAN_USAHA",
                "current_revenue": float(current_rev),
                "cumulative_revenue": float(total_rev_after),
                "ptkp_threshold": 0.0,
                "ptkp_remaining": 0.0,
                "taxable_amount": float(taxable_amount),
                "tax_due": float(tax_due),
                "effective_rate": "0.5%",
                "status": "TAX_PAYABLE"
            }

        # Wajib Pajak Orang Pribadi (WPOP UMKM)
        if cum_rev_before >= cls.PTKP_THRESHOLD:
            # Sudah melampaui PTKP sebelumnya, seluruh omzet masa ini kena 0,5%
            taxable_amount = current_rev
            tax_due = (taxable_amount * cls.FINAL_RATE).quantize(Decimal("1.00"))
            ptkp_remaining = Decimal("0.00")
        elif total_rev_after <= cls.PTKP_THRESHOLD:
            # Belum melampaui PTKP sama sekali (Bebas Pajak PPh Final)
            taxable_amount = Decimal("0.00")
            tax_due = Decimal("0.00")
            ptkp_remaining = cls.PTKP_THRESHOLD - total_rev_after
        else:
            # Melampaui batas pada masa ini (Hanya porsi di atas Rp 500 juta yang kena pajak)
            taxable_amount = total_rev_after - cls.PTKP_THRESHOLD
            tax_due = (taxable_amount * cls.FINAL_RATE).quantize(Decimal("1.00"))
            ptkp_remaining = Decimal("0.00")

        return {
            "entity_type": "ORANG_PRIBADI_UMKM",
            "current_revenue": float(current_rev),
            "cumulative_revenue": float(total_rev_after),
            "ptkp_threshold": float(cls.PTKP_THRESHOLD),
            "ptkp_remaining": float(ptkp_remaining),
            "taxable_amount": float(taxable_amount),
            "tax_due": float(tax_due),
            "effective_rate": "0.5% (atas surplus PTKP)",
            "status": "TAX_EXEMPT" if tax_due == 0 else "TAX_PAYABLE"
        }
