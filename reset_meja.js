const { execSync } = require('child_process');
execSync(`ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "mysql -u root warkop1001cc -e \\"UPDATE meja SET status = 'kosong' WHERE id IN (13, 14, 15, 16);\\""`);
