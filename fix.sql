UPDATE pesanan SET payment_status = 'paid' WHERE payment_status = 'unpaid' AND status != 'batal';
