SELECT dp.id, p.id as pesanan_id, m.nama, dp.qty, dp.harga as dp_harga, m.harga as current_harga 
FROM detail_pesanan dp 
JOIN pesanan p ON dp.pesanan_id = p.id 
JOIN menu m ON dp.menu_id = m.id 
WHERE DATE(p.created_at) = '2026-08-02' 
AND (dp.harga != m.harga);

SELECT dp.id, p.id as pesanan_id, m.nama, dp.qty, dp.harga as dp_harga, m.harga as current_harga 
FROM detail_pesanan dp 
JOIN pesanan p ON dp.pesanan_id = p.id 
JOIN menu m ON dp.menu_id = m.id 
WHERE DATE(p.created_at) = '2026-08-04'
AND (dp.harga != m.harga);
