const { execSync } = require('child_process');
const cmd = `ssh -o StrictHostKeyChecking=no root@202.155.157.13 "mysql -D warkop1001cc -e \\"SELECT SUM(discount_value + COALESCE(point_used, 0)) as total_diskon FROM pesanan WHERE DATE(created_at) = '2026-08-08' AND payment_status='paid' AND status!='batal'\\""`;
console.log(execSync(cmd).toString());
