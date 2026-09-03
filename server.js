const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// ข้อมูลมอดและสถิติ (สามารถเพิ่ม/แก้ไขมอดตรงนี้ได้)
let mods = [
    {
        id: "easy-find-ores",
        name: "Easy Find Ores Resource Pack",
        category: "Resource Pack",
        description: "ช่วยให้มองเห็นแร่ง่ายขึ้น เรืองแสงในที่มืด",
        fileSize: "2.4 MB",
        downloadUrl: "https://example.com/files/easy-find-ores.zip",
        downloads: 0
    },
    {
        id: "survival-addon",
        name: "Ultimate Survival Addon",
        category: "Addon",
        description: "เพิ่มคราฟต์ของใหม่ มอนสเตอร์ใหม่ และอาวุธชุดเกราะ",
        fileSize: "15.8 MB",
        downloadUrl: "https://example.com/files/survival-addon.zip",
        downloads: 0
    },
    {
        id: "pvp-texture-pack",
        name: "FPS Booster PvP Texture Pack",
        category: "Resource Pack",
        description: "เท็กซ์เจอร์แพ็กสาย PvP ดาบสั้น ภาพคมชัด ลื่นขึ้น",
        fileSize: "5.1 MB",
        downloadUrl: "https://example.com/files/pvp-texture.zip",
        downloads: 0
    },
    {
        id: "adventure-map",
        name: "The Lost Temple Adventure Map",
        category: "Map",
        description: "แมพผจญภัยไขปริศนา ตะลุยด่านวิหารโบราณ",
        fileSize: "45.0 MB",
        downloadUrl: "https://example.com/files/adventure-map.zip",
        downloads: 0
    }
];

// API ดึงรายการมอดทั้งหมด
app.get('/api/mods', (req, res) => {
    res.json(mods);
});

// API สำหรับนับยอดดาวน์โหลด
app.post('/api/download/:id', (req, res) => {
    const modId = req.params.id;
    const mod = mods.find(m => m.id === modId);
    
    if (mod) {
        mod.downloads += 1;
        res.json({ success: true, downloads: mod.downloads });
    } else {
        res.status(404).json({ success: false, message: 'ไม่พบมอดนี้' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
