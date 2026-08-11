UPDATE detail_pesanan SET harga = 13000 WHERE id = 448;
UPDATE pesanan SET total = total - 4000 WHERE id = 172;
UPDATE pembayaran SET jumlah = jumlah - 4000 WHERE pesanan_id = 172;

UPDATE detail_pesanan SET harga = 20000 WHERE id = 832;
UPDATE pesanan SET total = total + 8000 WHERE id = 311;
UPDATE pembayaran SET jumlah = jumlah + 8000 WHERE pesanan_id = 311;
