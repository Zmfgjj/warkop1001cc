const { execSync } = require('child_process');
const cmd = `ssh -o StrictHostKeyChecking=no root@202.155.157.13 "mysql -D warkop1001cc -e \\"SELECT id, total, discount_value, point_used FROM pesanan WHERE DATE(created_at) = '2026-08-07' AND payment_status='paid' AND status!='batal' AND discount_value != 0\\""`;
console.log(execSync(cmd).toString());
