const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 ตั้งค่ารหัสผ่านสำหรับเจ้าของเว็บ
const ADMIN_PASSWORD = "admin1234password";

// สร้างโฟลเดอร์ uploads และไฟล์ฐานข้อมูลชั่วคราวอัตโนมัติ
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

    // ลบไฟล์รูปและไฟล์มอดออกจากระบบ
    try {
        const modFilePath = path.join(__dirname, modToDelete.modFileUrl);
        const coverImagePath = path.join(__dirname, modToDelete.coverImageUrl);
        if (fs.existsSync(modFilePath)) fs.unlinkSync(modFilePath);
        if (fs.existsSync(coverImagePath)) fs.unlinkSync(coverImagePath);
    } catch (err) {
        console.error("Error deleting physical files:", err);
    }

    // ลบข้อมูลออกจากฐานข้อมูล mods.json
    mods = mods.filter(m => m.id !== modId);
    fs.writeFileSync('./mods.json', JSON.stringify(mods, null, 2));

    res.json({ success: true, message: "ลบมอดเรียบร้อยแล้ว!" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
