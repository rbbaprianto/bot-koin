const fs = require("fs");

const repoName = "Airdrop Automation Bots"; // Ganti dengan nama repo yang sesuai

// Baca daftar direktori dalam folder utama
const directories = fs.readdirSync("./", { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name !== "node_modules")
  .map(dirent => `- **${dirent.name}**`);

const readmeContent = `# ${repoName}

Koleksi bot automation untuk airdrop. Setiap bot memiliki fungsi khusus untuk mengotomatisasi tugas terkait airdrop.

## 📜 Daftar Bot:
${directories.length > 0 ? directories.join("\n") : "Belum ada bot yang terdaftar."}

## 🚀 Cara Menggunakan:
1. Clone repo ini:  
   \`\`\`sh
   git clone https://github.com/rbbaprianto/bot-koin.git
   \`\`\`
2. Masuk ke folder bot yang ingin dijalankan:
   \`\`\`sh
   cd bot-koin
   \`\`\`
3. Install dependencies:
   \`\`\`sh
   npm install
   \`\`\`
4. Jalankan bot:
   \`\`\`sh
   node generate_readme.js
   \`\`\`

## 📌 Catatan:
- Pastikan **Node.js** sudah terinstall (`>=14.x`).
- Beberapa bot mungkin membutuhkan konfigurasi API key/token.
- Cek file \`.env\` atau `config/config.js` dalam masing-masing folder bot.

---

_Dibuat otomatis oleh script `generate_readme.js`._
`;

// Tulis ke README.md
fs.writeFileSync("README.md", readmeContent, "utf8");

console.log("✅ README.md berhasil dibuat!");
