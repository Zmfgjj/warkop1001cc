const { execSync } = require('child_process');
const cmd = `ssh -o StrictHostKeyChecking=no root@202.155.157.13 "mysql -D warkop1001cc -e \\"SELECT dp.qty, dp.harga, m.nama FROM detail_pesanan dp JOIN menu m ON dp.menu_id = m.id WHERE dp.pesanan_id = 610\\""`;
console.log(execSync(cmd).toString());
