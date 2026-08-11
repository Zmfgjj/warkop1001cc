SELECT 
  p.id as pesanan_id, 
  p.status, 
  p.payment_status, 
  p.total as p_total,
  pb.jumlah as pb_jumlah, 
  (SELECT SUM(dp.qty * dp.harga) FROM detail_pesanan dp WHERE dp.pesanan_id = p.id) as dp_total,
  p.discount_value,
  p.point_used
FROM pesanan p
LEFT JOIN pembayaran pb ON p.id = pb.pesanan_id
WHERE DATE(p.created_at) = '2026-08-07' AND p.payment_status = 'paid'
HAVING p_total != pb_jumlah OR pb_jumlah != dp_total - p.discount_value - p.point_used
OR pb_jumlah IS NULL;
