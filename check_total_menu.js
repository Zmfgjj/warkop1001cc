const { execSync } = require('child_process');
const cmd = `ssh -o StrictHostKeyChecking=no root@202.155.157.13 "mysql -D warkop1001cc -e \\"SELECT SUM(dp.qty * dp.harga) as total_menu FROM detail_pesanan dp JOIN pesanan p ON dp.pesanan_id = p.id WHERE DATE(p.created_at) = '2026-08-07' AND p.payment_status='paid' AND p.status!='batal'\\""`;
console.log(execSync(cmd).toString());
