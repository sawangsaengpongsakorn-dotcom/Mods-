const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 ตั้งค่ารหัสผ่านสำหรับเจ้าของเว็บ
const ADMIN_PASSWORD = "admin1234password";

// ฟังก์ชันแปลงขนาดไฟล์จาก Bytes เป็น KB / MB อัตโนมัติ
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync('./mods.json')) fs.writeFileSync('./mods.json', '[]');

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// ดึงรายการมอดทั้งหมด
app.get('/api/mods', (req, res) => {
    const data = fs.readFileSync('./mods.json');
    res.json(JSON.parse(data));
});

// อัปโหลดมอดใหม่
app.post('/api/mods', upload.fields([{ name: 'modFile' }, { name: 'coverImage' }]), (req, res) => {
    const { password, title, artist } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "รหัสผ่าน Admin ไม่ถูกต้อง!" });
    }

    if (!req.files.modFile || !req.files.coverImage) {
        return res.status(400).json({ success: false, message: "กรุณาแนบทั้งไฟล์มอดและรูปภาพตัวอย่าง" });
    }

    const modFile = req.files.modFile[0];

    const newMod = {
        id: Date.now(),
        title,
        artist,
        modFileUrl: `/uploads/${modFile.filename}`,
        coverImageUrl: `/uploads/${req.files.coverImage[0].filename}`,
        modFileName: modFile.originalname,
        fileSize: formatBytes(modFile.size), // คำนวณขนาดไฟล์ให้อัตโนมัติ
        downloads: 0,                       // เริ่มต้นดาวน์โหลดที่ 0 ครั้ง
        date: new Date().toLocaleDateString('th-TH')
    };

    const mods = JSON.parse(fs.readFileSync('./mods.json'));
    mods.unshift(newMod);
    fs.writeFileSync('./mods.json', JSON.stringify(mods, null, 2));

    res.json({ success: true, message: "อัปโหลดมอดเรียบร้อยแล้ว!" });
});

// 📥 นับจำนวนดาวน์โหลดเมื่อมีคนกดโหลด
app.post('/api/mods/:id/download', (req, res) => {
    const modId = parseInt(req.params.id);
    const mods = JSON.parse(fs.readFileSync('./mods.json'));
    const mod = mods.find(m => m.id === modId);

    if (mod) {
        mod.downloads = (mod.downloads || 0) + 1;
        fs.writeFileSync('./mods.json', JSON.stringify(mods, null, 2));
        res.json({ success: true, downloads: mod.downloads });
    } else {
        res.status(404).json({ success: false, message: "ไม่พบมอด" });
    }
});

// 🗑️ ลบมอด (เฉพาะ Admin)
app.delete('/api/mods/:id', (req, res) => {
    const { password } = req.body;
    const modId = parseInt(req.params.id);

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "รหัสผ่าน Admin ไม่ถูกต้อง!" });
    }

    let mods = JSON.parse(fs.readFileSync('./mods.json'));
    const modToDelete = mods.find(m => m.id === modId);

    if (!modToDelete) {
        return res.status(404).json({ success: false, message: "ไม่พบมอดที่ต้องการลบ" });
    }

    try {
        const modFilePath = path.join(__dirname, modToDelete.modFileUrl);
        const coverImagePath = path.join(__dirname, modToDelete.coverImageUrl);
        if (fs.existsSync(modFilePath)) fs.unlinkSync(modFilePath);
        if (fs.existsSync(coverImagePath)) fs.unlinkSync(coverImagePath);
    } catch (err) {
        console.error("Error deleting files:", err);
    }

    mods = mods.filter(m => m.id !== modId);
    fs.writeFileSync('./mods.json', JSON.stringify(mods, null, 2));

    res.json({ success: true, message: "ลบมอดเรียบร้อยแล้ว!" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
