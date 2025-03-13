const fs = require("fs");

const readmePath = "README.md";

// Ambil daftar folder di root repo (hanya direktori)
const appFolders = fs
  .readdirSync(".", { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith(".") && dirent.name !== "node_modules" && dirent.name !== "core" && dirent.name !== "config")
  .map((dirent) => `- ${dirent.name}`);

const newReadmeContent = `# 🤖 Bot Automation Airdrop

Repository ini berisi sekumpulan bot automation untuk airdrop.

## 📂 Daftar Aplikasi:
${appFolders.length ? appFolders.join("\n") : "_Belum ada aplikasi yang terdeteksi._"}

---

📌 **README ini diperbarui secara otomatis setiap kali ada aplikasi baru yang ditambahkan.**
`;

fs.writeFileSync(readmePath, newReadmeContent, "utf8");

console.log("✅ README.md berhasil diperbarui!");
