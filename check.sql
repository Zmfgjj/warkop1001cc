SELECT SUM(total) FROM pesanan WHERE payment_status='paid' AND status != 'batal' AND DATE(created_at) = '2026-08-07';
