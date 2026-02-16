// WebSocket connection
let ws = null;
let reconnectInterval = null;

// Network graph data
const networkData = {
    download: [],
    upload: [],
    maxPoints: CONFIG.NETWORK_GRAPH_MAX_POINTS
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    connectWebSocket();
    loadSystemInfo();
    initNetworkChart();
    initAccountsPage();
    initDataMonitoring();
});

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = item.dataset.page;
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(pageName + 'Page').classList.add('active');
            
            document.getElementById('pageTitle').textContent = item.querySelector('span').textContent;
        });
    });
}

// WebSocket
function connectWebSocket() {
    try {
        ws = new WebSocket(CONFIG.WS_URL);

        ws.onopen = () => {
            console.log('WebSocket connected');
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'system_stats') {
                updateSystemStats(data.data);
            } else if (data.type === 'data_update') {
                // Auto-reload data ketika ada perubahan di data.json
                loadDataMonitoring();
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            
            if (!reconnectInterval) {
                reconnectInterval = setInterval(() => {
                    console.log('Attempting to reconnect...');
                    connectWebSocket();
                }, CONFIG.WS_RECONNECT_INTERVAL);
            }
        };
    } catch (error) {
        console.error('Failed to connect:', error);
    }
}

// Load System Info
async function loadSystemInfo() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/monitoring/system-info`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            document.getElementById('sysOs').textContent = `${data.os.distro} ${data.os.release}`;
            document.getElementById('sysHost').textContent = data.os.hostname;
            document.getElementById('sysCpu').textContent = data.cpu.brand;
            document.getElementById('sysCores').textContent = `${data.cpu.cores} cores`;
        }
    } catch (error) {
        console.error('Error loading system info:', error);
    }
}

// Update System Stats - REAL-TIME MONITORING
function updateSystemStats(stats) {
    // Dashboard stats
    document.getElementById('dashCpuValue').textContent = stats.cpu.usage.toFixed(1) + '%';
    document.getElementById('dashCpuTemp').textContent = `Temp: ${stats.temperature.main.toFixed(0)}°C`;
    
    const memPercent = stats.memory.usagePercent.toFixed(1);
    const memUsedGB = (stats.memory.used / 1024 / 1024 / 1024).toFixed(1);
    const memTotalGB = (stats.memory.total / 1024 / 1024 / 1024).toFixed(1);
    document.getElementById('dashMemValue').textContent = memPercent + '%';
    document.getElementById('dashMemInfo').textContent = `${memUsedGB} / ${memTotalGB} GB`;
    
    // Temperature
    document.getElementById('dashTempValue').textContent = stats.temperature.main.toFixed(1) + '°C';
    const tempStatus = stats.temperature.main < 50 ? 'Normal' : stats.temperature.main < 70 ? 'Warm' : 'Hot';
    document.getElementById('dashTempStatus').textContent = tempStatus;
    
    // Disk
    if (stats.disk && stats.disk.length > 0) {
        const disk = stats.disk[0];
        const diskPercent = disk.use || 0;
        const diskUsedGB = (disk.used / 1024 / 1024 / 1024).toFixed(1);
        const diskTotalGB = (disk.size / 1024 / 1024 / 1024).toFixed(1);
        document.getElementById('dashDiskValue').textContent = diskPercent.toFixed(1) + '%';
        document.getElementById('dashDiskInfo').textContent = `${diskUsedGB} / ${diskTotalGB} GB`;
    }
    
    // Monitor page - CPU
    document.getElementById('cpuBadge').textContent = stats.cpu.usage.toFixed(1) + '%';
    document.getElementById('cpuProgress').style.width = stats.cpu.usage + '%';
    
    // CPU Cores
    const coresContainer = document.getElementById('cpuCores');
    if (stats.cpu.cores.length > 0 && coresContainer.children.length === 0) {
        coresContainer.innerHTML = '';
        stats.cpu.cores.forEach((core, index) => {
            const coreDiv = document.createElement('div');
            coreDiv.className = 'cpu-core';
            coreDiv.innerHTML = `
                <div class="core-label">Core ${index}</div>
                <div class="core-value" id="core${index}">0%</div>
            `;
            coresContainer.appendChild(coreDiv);
        });
    }
    
    stats.cpu.cores.forEach((core, index) => {
        const coreEl = document.getElementById(`core${index}`);
        if (coreEl) {
            coreEl.textContent = core.usage.toFixed(1) + '%';
        }
    });
    
    // Memory
    document.getElementById('memBadge').textContent = memPercent + '%';
    document.getElementById('memProgress').style.width = memPercent + '%';
    document.getElementById('memUsed').textContent = memUsedGB + ' GB';
    document.getElementById('memFree').textContent = (stats.memory.free / 1024 / 1024 / 1024).toFixed(1) + ' GB';
    document.getElementById('memTotal').textContent = memTotalGB + ' GB';
    
    // Network
    if (stats.network.interfaces.length > 0) {
        const iface = stats.network.interfaces[0];
        document.getElementById('netDown').textContent = formatBytes(iface.rxSec) + '/s';
        document.getElementById('netUp').textContent = formatBytes(iface.txSec) + '/s';
        
        networkData.download.push(iface.rxSec / 1024);
        networkData.upload.push(iface.txSec / 1024);
        
        if (networkData.download.length > networkData.maxPoints) {
            networkData.download.shift();
            networkData.upload.shift();
        }
        
        drawNetworkChart();
    }
    
    // Processes
    if (stats.processes) {
        document.getElementById('procAll').textContent = stats.processes.all;
        document.getElementById('procRun').textContent = stats.processes.running;
        document.getElementById('procSleep').textContent = stats.processes.sleeping;
        document.getElementById('procBlock').textContent = stats.processes.blocked;
    }
}

// Network Chart
let networkCanvas, networkCtx;

function initNetworkChart() {
    networkCanvas = document.getElementById('networkChart');
    networkCtx = networkCanvas.getContext('2d');
    networkCanvas.width = networkCanvas.offsetWidth;
    networkCanvas.height = 200;
}

function drawNetworkChart() {
    if (!networkCtx) return;
    
    const width = networkCanvas.width;
    const height = networkCanvas.height;
    
    networkCtx.clearRect(0, 0, width, height);
    
    if (networkData.download.length < 2) return;
    
    const maxValue = Math.max(...networkData.download, ...networkData.upload, 100);
    const stepX = width / (networkData.maxPoints - 1);
    
    // Download
    networkCtx.strokeStyle = '#5B8DEF';
    networkCtx.lineWidth = 2;
    networkCtx.beginPath();
    
    networkData.download.forEach((value, index) => {
        const x = index * stepX;
        const y = height - (value / maxValue * height);
        
        if (index === 0) {
            networkCtx.moveTo(x, y);
        } else {
            networkCtx.lineTo(x, y);
        }
    });
    
    networkCtx.stroke();
    
    // Upload
    networkCtx.strokeStyle = '#4CAF50';
    networkCtx.lineWidth = 2;
    networkCtx.beginPath();
    
    networkData.upload.forEach((value, index) => {
        const x = index * stepX;
        const y = height - (value / maxValue * height);
        
        if (index === 0) {
            networkCtx.moveTo(x, y);
        } else {
            networkCtx.lineTo(x, y);
        }
    });
    
    networkCtx.stroke();
}

// ===== ACCOUNTS MONITORING (READ-ONLY + DELETE) =====
function initAccountsPage() {
    loadUsers();
    // Auto-refresh every 5 seconds
    setInterval(loadUsers, 5000);
}

async function loadUsers() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/users`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '';
            
            result.data.users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.id}</td>
                    <td><strong>${user.username}</strong></td>
                    <td><span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">${user.role}</span></td>
                    <td>${new Date(user.createdAt).toLocaleString('id-ID')}</td>
                    <td>${new Date(user.updatedAt || user.createdAt).toLocaleString('id-ID')}</td>
                    <td>
                        <button class="btn-danger btn-sm" onclick="deleteUser(${user.id}, '${user.username}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading from akun.json</td></tr>';
    }
}

async function deleteUser(id, username) {
    if (!confirm(`⚠️ DELETE USER FROM akun.json?\n\nUsername: ${username}\n\nThis will permanently remove the user from backend/data/akun.json`)) return;
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/users/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ User deleted from akun.json!');
            loadUsers();
        } else {
            alert('❌ Error: ' + result.message);
        }
    } catch (error) {
        alert('❌ Error deleting user from akun.json');
    }
}

// ===== DATA MONITORING (READ-ONLY + DELETE ARTICLES) =====
function initDataMonitoring() {
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(c => c.classList.remove('active'));
            document.getElementById(tabName + 'Tab').classList.add('active');
        });
    });
    
    loadDataMonitoring();
    
    // Auto-refresh every 5 seconds
    setInterval(loadDataMonitoring, 5000);
}

async function loadDataMonitoring() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/data`);
        const data = await response.json();
        
        // Banner Display - Image Only
        document.getElementById('bannerStatus').textContent = data.banner.enabled ? 'Enabled' : 'Disabled';
        document.getElementById('bannerStatus').className = `badge ${data.banner.enabled ? 'badge-success' : 'badge-secondary'}`;
        
        if (data.banner.image) {
            document.getElementById('bannerImageDisplay').innerHTML = `<img src="${data.banner.image}" alt="Banner" class="preview-image">`;
        } else {
            document.getElementById('bannerImageDisplay').innerHTML = '<p class="text-muted">No image uploaded. Edit backend/data/data.json to add banner image (base64)</p>';
        }
        
        // Running Text Display
        document.getElementById('runtextStatus').textContent = data.runningText.enabled ? 'Enabled' : 'Disabled';
        document.getElementById('runtextStatus').className = `badge ${data.runningText.enabled ? 'badge-success' : 'badge-secondary'}`;
        document.getElementById('runtextTextDisplay').textContent = data.runningText.text;
        document.getElementById('runtextSpeedDisplay').textContent = `${data.runningText.speed} px/s`;
        
        // Jadwal Sholat Display
        document.getElementById('sholatStatus').textContent = data.jadwalSholat.enabled ? 'Enabled' : 'Disabled';
        document.getElementById('sholatStatus').className = `badge ${data.jadwalSholat.enabled ? 'badge-success' : 'badge-secondary'}`;
        document.getElementById('sholatLocationDisplay').textContent = data.jadwalSholat.location;
        document.getElementById('prayerSubuhDisplay').textContent = data.jadwalSholat.prayers.subuh;
        document.getElementById('prayerDzuhurDisplay').textContent = data.jadwalSholat.prayers.dzuhur;
        document.getElementById('prayerAsharDisplay').textContent = data.jadwalSholat.prayers.ashar;
        document.getElementById('prayerMaghribDisplay').textContent = data.jadwalSholat.prayers.maghrib;
        document.getElementById('prayerIsyaDisplay').textContent = data.jadwalSholat.prayers.isya;
        
        // Articles Display
        loadArticles(data.articles);
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function loadArticles(articles) {
    const container = document.getElementById('articlesList');
    document.getElementById('articleCount').textContent = `${articles.length} articles`;
    
    if (articles.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No articles in data.json</p>';
        return;
    }
    
    container.innerHTML = '';
    articles.forEach(article => {
        const div = document.createElement('div');
        div.className = 'article-item';
        
        let imageHtml = '';
        if (article.image) {
            imageHtml = `<img src="${article.image}" alt="${article.title}" class="article-thumbnail">`;
        }
        
        div.innerHTML = `
            ${imageHtml}
            <div class="article-info">
                <h4>${article.title}</h4>
                <p class="article-excerpt">${article.content.substring(0, 100)}...</p>
                <div class="article-meta">
                    <span><i class="fas fa-user"></i> ${article.author}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(article.date).toLocaleDateString('id-ID')}</span>
                    <span class="badge ${article.published ? 'badge-success' : 'badge-secondary'}">${article.published ? 'Published' : 'Draft'}</span>
                </div>
            </div>
            <div class="article-actions">
                <button class="btn-danger btn-sm" onclick="deleteArticle(${article.id}, '${article.title}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

async function deleteArticle(id, title) {
    if (!confirm(`⚠️ DELETE ARTICLE FROM data.json?\n\nTitle: ${title}\n\nThis will permanently remove the article from backend/data/data.json`)) return;
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/data/articles/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Article deleted from data.json!');
            loadDataMonitoring();
        } else {
            alert('❌ Error: ' + result.message);
        }
    } catch (error) {
        alert('❌ Error deleting article from data.json');
    }
}

// Utilities
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
