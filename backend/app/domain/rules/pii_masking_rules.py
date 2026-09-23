"""
FINA-ENTERPRISE: Aturan Perlindungan Data Pribadi (UU No. 27/2022 / PDP)

Prinsip Zero-Knowledge & Least Privilege:
- NIK (Nomor Induk Kependudukan 16 digit) disensor menjadi 3171********0001
- Nomor Rekening Bank disensor menjadi **** **** 1234
- Nomor Telepon disensor menjadi +62 812-****-7890
"""

import re

class PIIMaskingRules:
    @staticmethod
    def mask_nik(nik: str) -> str:
        """Menyensor NIK 16 digit menjadi 4 digit awal + bintang + 4 digit akhir."""
        nik_clean = re.sub(r"\D", "", nik)
        if len(nik_clean) == 16:
            return f"{nik_clean[:4]}********{nik_clean[-4:]}"
        return nik

    @staticmethod
    def mask_phone(phone: str) -> str:
        """Menyensor nomor telepon."""
        clean = re.sub(r"[\s\-]", "", phone)
        if len(clean) >= 10:
            return f"{clean[:5]}****{clean[-3:]}"
        return phone

    @staticmethod
    def mask_bank_account(account_no: str) -> str:
        """Menyensor nomor rekening bank."""
        clean = re.sub(r"[\s\-]", "", account_no)
        if len(clean) >= 8:
            return f"****-****-{clean[-4:]}"
        return account_no
