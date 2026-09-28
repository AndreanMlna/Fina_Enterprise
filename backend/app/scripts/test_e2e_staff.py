import asyncio
import httpx

async def full_e2e_test():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        # 1. Login sebagai Owner
        owner_login = await client.post("/api/v1/auth/login", json={"phone_number": "081249992243", "pin": "611059"})
        assert owner_login.status_code == 200, f"Owner login failed: {owner_login.text}"
        owner_data = owner_login.json()
        assert owner_data["user"]["role"] == "OWNER"
        owner_token = owner_data["access_token"]
        print("[PASS] 1. Owner Login Berhasil. Role:", owner_data["user"]["role"])

        # Bersihkan 0812-8888-9999 jika sisa run sebelumnya
        stf_res = await client.get("/api/v1/auth/staff", headers={"Authorization": f"Bearer {owner_token}"})
        for s in stf_res.json():
            if s["phone_number"] == "0812-8888-9999":
                await client.delete(f"/api/v1/auth/staff/{s['id']}", headers={"Authorization": f"Bearer {owner_token}"})

        # 2. Owner membuat staf baru via POST /api/v1/auth/staff
        create_res = await client.post(
            "/api/v1/auth/staff",
            headers={"Authorization": f"Bearer {owner_token}"},
            json={
                "full_name": "Budi Santoso (Kasir Shift Pagi)",
                "phone_number": "0812-8888-9999",
                "role": "CASHIER",
                "pin": "654321"
            }
        )
        assert create_res.status_code == 201, f"Create staff failed: {create_res.text}"
        new_staff = create_res.json()
        print("[PASS] 2. Staf baru berhasil dibuat oleh Owner:", new_staff["full_name"], "| ID:", new_staff["id"], "| Role:", new_staff["role"])

        # 3. Login menggunakan akun kasir yang baru dibuat
        cashier_login = await client.post("/api/v1/auth/login", json={"phone_number": "0812-8888-9999", "pin": "654321"})
        assert cashier_login.status_code == 200, f"Cashier login failed: {cashier_login.text}"
        cashier_data = cashier_login.json()
        assert cashier_data["user"]["role"] == "CASHIER"
        assert cashier_data["tenant"]["name"] == "PT Abadi Nan Jaya"
        cashier_token = cashier_data["access_token"]
        print("[PASS] 3. Login Kasir Baru Berhasil! Token claim role:", cashier_data["user"]["role"], "| Toko:", cashier_data["tenant"]["name"])

        # 4. Verifikasi Kasir diblokir dari endpoint manajerial & staff
        kpi_attempt = await client.get("/api/v1/kpi/dashboard", headers={"Authorization": f"Bearer {cashier_token}"})
        assert kpi_attempt.status_code == 403, f"Expected 403, got {kpi_attempt.status_code}"
        print("[PASS] 4. Kasir diblokir dari /api/v1/kpi/dashboard (Status 403 Forbidden)")

        staff_post_attempt = await client.post(
            "/api/v1/auth/staff",
            headers={"Authorization": f"Bearer {cashier_token}"},
            json={"full_name": "Hacker", "phone_number": "081200000000", "role": "CASHIER", "pin": "123456"}
        )
        assert staff_post_attempt.status_code == 403, f"Expected 403, got {staff_post_attempt.status_code}"
        print("[PASS] 5. Kasir diblokir dari mendaftarkan staf (Status 403 Forbidden)")

        # 5. Owner mengubah status keaktifan staf
        staff_id = new_staff["id"]
        status_patch = await client.patch(
            f"/api/v1/auth/staff/{staff_id}/status",
            headers={"Authorization": f"Bearer {owner_token}"},
            json={"is_active": False}
        )
        assert status_patch.status_code == 200
        assert status_patch.json()["is_active"] is False
        print("[PASS] 6. Owner berhasil menonaktifkan akun staf (is_active=False)")

        # 6. Kasir nonaktif mencoba login -> harus ditolak dengan 403 Forbidden
        blocked_login = await client.post("/api/v1/auth/login", json={"phone_number": "0812-8888-9999", "pin": "654321"})
        assert blocked_login.status_code == 403, f"Expected 403, got {blocked_login.status_code}"
        print("[PASS] 7. Akun kasir nonaktif ditolak saat login (Status 403 Forbidden)")

        # 7. Owner menghapus akun staf percobaan
        del_res = await client.delete(
            f"/api/v1/auth/staff/{staff_id}",
            headers={"Authorization": f"Bearer {owner_token}"}
        )
        assert del_res.status_code == 200
        print("[PASS] 8. Owner berhasil menghapus akun staf uji coba")

if __name__ == "__main__":
    asyncio.run(full_e2e_test())
