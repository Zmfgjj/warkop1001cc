const fs = require('fs');
const files = ['Kasir.jsx', 'KasirPOS2.jsx', 'ManajemenMenu.jsx', 'ManajemenMeja.jsx', 'KDS.jsx', 'Laporan.jsx', 'UserManage.jsx'];

files.forEach(f => {
  const p = './src/pages/' + f;
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  
  // Add import if not present
  if (!content.includes('lucide-react')) {
    // Try to inject after React imports
    content = content.replace(/(import .* from 'react'(\r?\n)?)/, "$1import { LayoutDashboard, ReceiptText, ShoppingCart, Grid2X2, MonitorPlay, BarChart3, Users, LogOut } from 'lucide-react';\n");
  }

  // Replace emojis
  content = content.replace(/icon:\s*'🏠'/g, "icon: <LayoutDashboard size={20}/>");
  content = content.replace(/icon:\s*'🧾'/g, "icon: <ReceiptText size={20}/>");
  content = content.replace(/icon:\s*'🛒'/g, "icon: <ShoppingCart size={20}/>");
  content = content.replace(/icon:\s*'📋'/g, "icon: <Grid2X2 size={20}/>");
  content = content.replace(/icon:\s*'📡'/g, "icon: <MonitorPlay size={20}/>");
  content = content.replace(/icon:\s*'📊'/g, "icon: <BarChart3 size={20}/>");
  content = content.replace(/icon:\s*'👤'/g, "icon: <Users size={20}/>");
  content = content.replace(/🚪\s*Logout/g, "<LogOut size={20} className=\"inline mr-2\"/> Logout");
  
  fs.writeFileSync(p, content);
  console.log('Updated ' + f);
});
