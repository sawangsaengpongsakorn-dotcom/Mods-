const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 ตั้งค่ารหัสผ่านสำหรับเจ้าของเว็บ (เปลี่ยนตรงนี้ได้เลย)
const ADMIN_PASSWORD = "admin1234password";

// สร้างโฟลเดอร์ uploads และไฟล์ฐานข้อมูลชั่วคราวอัตโนมัติ
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync('./mods.json')) fs.writeFileSync('./mods.json', '[]');

// ตั้งค่าระบบจัดเก็บไฟล์ Multer
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

// อัปโหลดมอดใหม่ (เฉพาะ Admin ที่มีรหัสผ่าน)
app.post('/api/mods', upload.fields([{ name: 'modFile' }, { name: 'coverImage' }]), (req, res) => {
    const { password, title, artist } = req.body;

    // ตรวจสอบรหัสผ่าน
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "รหัสผ่าน Admin ไม่ถูกต้อง!" });
    }

    if (!req.files.modFile || !req.files.coverImage) {
        return res.status(400).json({ success: false, message: "กรุณาแนบทั้งไฟล์มอดและรูปภาพตัวอย่าง" });
    }

    const newMod = {
        id: Date.now(),
        title,
        artist,
        modFileUrl: `/uploads/${req.files.modFile[0].filename}`,
        coverImageUrl: `/uploads/${req.files.coverImage[0].filename}`,
        modFileName: req.files.modFile[0].originalname,
        date: new Date().toLocaleDateString('th-TH')
    };

    const mods = JSON.parse(fs.readFileSync('./mods.json'));
    mods.unshift(newMod);
    fs.writeFileSync('./mods.json', JSON.stringify(mods, null, 2));

    res.json({ success: true, message: "อัปโหลดมอดเรียบร้อยแล้ว!" });
});

app.listen(PORT, () => {
    console.log(`เว็บไซต์พร้อมใช้งานที่: http://localhost:${PORT}`);
});
