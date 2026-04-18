-- Insert demo users dengan role berbeda
-- Password: "password" (hashed dengan bcrypt)
INSERT INTO users (nama, username, password, role, aktif, created_at) VALUES 
('Owner Warkop', 'owner', '$2b$10$WoN2fbYW/Sxb0wC8NOInHeazSAOSYyeecZjBQGZwk/b/4kxxSljve', 'owner', 1, NOW()),
('Manager Warkop', 'manager', '$2b$10$WoN2fbYW/Sxb0wC8NOInHeazSAOSYyeecZjBQGZwk/b/4kxxSljve', 'manager', 1, NOW()),
('Kasir 1', 'kasir1', '$2b$10$WoN2fbYW/Sxb0wC8NOInHeazSAOSYyeecZjBQGZwk/b/4kxxSljve', 'kasir', 1, NOW()),
('Dapur 1', 'dapur', '$2b$10$WoN2fbYW/Sxb0wC8NOInHeazSAOSYyeecZjBQGZwk/b/4kxxSljve', 'dapur', 1, NOW()),
('Admin', 'admin', '$2b$10$WoN2fbYW/Sxb0wC8NOInHeazSAOSYyeecZjBQGZwk/b/4kxxSljve', 'admin', 1, NOW());

-- Catatan:
-- Username: owner, Password: password123, Role: owner (admin penuh)
-- Username: manager, Password: password123, Role: manager
-- Username: kasir1, Password: password123, Role: kasir
-- Username: dapur, Password: password123, Role: dapur (KDS)
-- Username: admin, Password: password123, Role: admin
