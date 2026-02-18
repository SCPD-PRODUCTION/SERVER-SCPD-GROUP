# 🖥️ SCPD Group Server Monitoring - Web Interface

Web interface untuk monitoring server real-time dengan UI modern.

## 🌐 Base URL

```
API: https://epigrammatic-oliva-furuncular.ngrok-free.dev
WebSocket: wss://epigrammatic-oliva-furuncular.ngrok-free.dev
```

**Keuntungan pakai ngrok:**
- ✅ Bisa diakses dari device manapun
- ✅ Tidak terbatas IP/WiFi lokal
- ✅ Bisa dibuka di HP, tablet, laptop lain
- ✅ Share ke teman dengan URL ngrok

---

## 🚀 Cara Pakai

### 1. Buka di Browser

```bash
# Langsung double-click
index.html

# Atau via live server (recommended)
npx serve .
# Atau
python -m http.server 8080
```

### 2. Akses dari Device Lain

**Karena pakai ngrok URL**, web bisa diakses dari:
- ✅ Laptop/PC lain (beda WiFi)
- ✅ HP Android/iOS
- ✅ Tablet
- ✅ Komputer teman (kirim URL)

**Tidak perlu localhost!**

---

## 📊 Features

### 🏠 **Dashboard Page**
- Real-time CPU, Memory, Disk, Temperature
- Update setiap 1 detik via WebSocket
- Card-based layout dengan color coding

### 📈 **Server Monitor Page**
- CPU usage per core
- Memory breakdown
- Network activity graph (real-time)
- Process statistics
- System information

### 👥 **Accounts Monitoring**
- View all users from akun.json
- Delete users (auto-update JSON)
- Auto-refresh every 5 seconds

### 📝 **Data Monitoring**
- Banner display (image base64)
- Running text settings
- Jadwal sholat
- Articles list
- Delete articles

---

## ⚡ Auto-Load (No Loading Screens)

**Semua data langsung load otomatis:**
- ❌ Tidak ada "Loading..." yang lama
- ✅ Langsung tampil data real-time
- ✅ WebSocket connect otomatis
- ✅ Auto-refresh tanpa reload page

**Timeline:**
```
0s   - Page loaded
0.1s - WebSocket connecting
0.2s - System info loaded
0.5s - First stats arrived
1s   - All data visible
```

Tidak ada loading indicator yang mengganggu!

---

## 🔌 WebSocket Real-Time

**Connection:**
- Auto-connect on page load
- Auto-reconnect jika disconnect
- Heartbeat every 30 seconds
- Update stats every 1 second

**Data Stream:**
```javascript
{
  type: 'system_stats',
  data: {
    cpu: { usage, cores },
    memory: { total, used, free },
    temperature: { main, cores },
    network: { interfaces },
    processes: { all, running },
    disk: [...]
  }
}
```

---

## 📱 Multi-Device Access

### Dari HP/Tablet:

1. **Buka browser** (Chrome/Safari)
2. **Masukkan URL:**
   ```
   https://epigrammatic-oliva-furuncular.ngrok-free.dev
   ```
3. **Langsung monitoring!**

### Dari Laptop Lain:

1. **Buka browser**
2. **Masukkan URL ngrok**
3. **Monitoring dari mana saja!**

**Tidak perlu:**
- ❌ VPN
- ❌ Port forwarding
- ❌ Satu WiFi
- ❌ Same network

---

## 🎨 Pages

### 📊 Dashboard
- Quick overview
- 4 stat cards
- Real-time updates

### 📈 Server Monitor
- Detailed monitoring
- CPU per core
- Network graph
- System info

### 👥 Accounts
- User list table
- Delete button
- Auto-refresh

### 📝 Data
- Banner (read-only)
- Running text (read-only)
- Jadwal sholat (read-only)
- Articles (delete only)

---

## 🔧 Configuration

### Change API URL

Edit `js/config.js`:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-new-url.com',
    WS_URL: 'wss://your-new-url.com',
    // ...
};
```

### Auto-Refresh Intervals

```javascript
// Data refresh (accounts & data pages)
setInterval(loadUsers, 5000);          // 5 seconds

// WebSocket stats
WS_UPDATE_INTERVAL: 1000,              // 1 second

// Network graph
NETWORK_GRAPH_MAX_POINTS: 60,          // 60 data points
```

---

## 📦 File Structure

```
monitoring-web/
├── index.html          # Main page
├── css/
│   └── style.css      # Styling
├── js/
│   ├── config.js      # Configuration (ngrok URL)
│   └── app.js         # Application logic
└── README.md          # This file
```

---

## 🌟 Advantages of Ngrok URL

### ✅ **Universal Access**
- Akses dari mana saja
- Tidak terbatas network
- Share dengan siapa saja

### ✅ **No Configuration**
- Tidak perlu setup DNS
- Tidak perlu public IP
- Tidak perlu port forwarding

### ✅ **HTTPS Secure**
- Auto HTTPS (wss://)
- Secure WebSocket
- Browser-friendly

---

## 🔍 Monitoring Features

### Real-Time Data:
- ✅ CPU usage (total & per core)
- ✅ Memory (used, free, total)
- ✅ Disk usage (size, used, available)
- ✅ Temperature (CPU sensors)
- ✅ Network (upload/download speed)
- ✅ Processes (all, running, sleeping, blocked)

### Auto Features:
- ✅ Auto-connect WebSocket
- ✅ Auto-reconnect on disconnect
- ✅ Auto-refresh data every 5s
- ✅ Auto-update stats every 1s
- ✅ Auto-cleanup expired data

---

## 🎯 Use Cases

### 1. **Remote Monitoring**
Monitor server dari rumah, kantor, atau cafe

### 2. **Multi-Device**
Check stats di laptop, HP, tablet bersamaan

### 3. **Team Monitoring**
Share URL ke tim untuk monitoring bersama

### 4. **Mobile Monitoring**
Check server health dari HP di mana saja

---

## 🐛 Troubleshooting

### WebSocket tidak connect?

1. **Check backend running:**
   ```bash
   curl https://epigrammatic-oliva-furuncular.ngrok-free.dev/api/monitoring/health
   ```

2. **Check browser console** (F12)
   - Lihat error WebSocket
   - Check CORS errors

3. **Check ngrok running:**
   - Verify ngrok tunnel active
   - Check ngrok dashboard

### Data tidak muncul?

1. **Reload page** (Ctrl + R)
2. **Check Network tab** (F12)
   - See API responses
   - Check status codes
3. **Verify backend API:**
   ```bash
   curl https://epigrammatic-oliva-furuncular.ngrok-free.dev/api/data
   ```

### Stats tidak update?

1. **Check WebSocket status** di console
2. **Wait 5 seconds** untuk auto-refresh
3. **Check backend logs** untuk errors

---

## 💡 Tips

### Performance:
- ✅ Use modern browser (Chrome, Firefox, Safari)
- ✅ Close unused tabs
- ✅ Keep browser console closed

### Security:
- ✅ Jangan share ngrok URL publik
- ✅ Change default password
- ✅ Monitor access logs

### Best Practice:
- ✅ Open di tab terpisah untuk monitoring 24/7
- ✅ Use full-screen mode (F11)
- ✅ Bookmark URL untuk akses cepat

---

## 📚 API Endpoints Used

```
GET  /api/monitoring/system-info   - System information
GET  /api/monitoring/stats          - Real-time stats
GET  /api/auth/users                - User list
GET  /api/data                      - Display data
DELETE /api/auth/users/:id          - Delete user
DELETE /api/data/articles/:id       - Delete article
```

---

## 🔗 Links

- **Backend API:** https://epigrammatic-oliva-furuncular.ngrok-free.dev
- **WebSocket:** wss://epigrammatic-oliva-furuncular.ngrok-free.dev
- **Dashboard:** Open index.html

---

**Happy Monitoring! 🚀**

Access dari device manapun dengan ngrok URL!
