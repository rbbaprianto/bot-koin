const fs = require("fs");
const path = require("path");
const axios = require("axios");
const colors = require("colors");
const { HttpsProxyAgent } = require("https-proxy-agent");
const readline = require("readline");
const user_agents = require("./config/userAgents");
const settings = require("./config/config");
const { sleep, loadData, getRandomNumber, saveToken, isTokenExpired, saveJson, updateEnv, decodeJWT } = require("./utils");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const { checkBaseUrl } = require("./checkAPI");
const headers = require("./core/header");

class ClientAPI {
  constructor(queryId, accountIndex, proxy, baseURL, localStorage) {
    this.headers = headers;
    this.baseURL = baseURL;
    this.queryId = queryId;
    this.accountIndex = accountIndex;
    this.proxy = proxy;
    this.proxyIP = null;
    this.session_name = null;
    this.session_user_agents = this.#load_session_data();
    this.token = queryId;
    this.localStorage = localStorage;
    this.localData = {};
  }

  // Memuat data sesi dari file JSON
  #load_session_data() {
    try {
      const filePath = path.join(process.cwd(), "session_user_agents.json");
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      } else {
        throw error;
      }
    }
  }

  // Mengambil user agent secara acak dari daftar
  #get_random_user_agent() {
    const randomIndex = Math.floor(Math.random() * user_agents.length);
    return user_agents[randomIndex];
  }

  // Mengambil user agent yang sudah ada atau membuat yang baru jika belum ada
  #get_user_agent() {
    if (this.session_user_agents[this.session_name]) {
      return this.session_user_agents[this.session_name];
    }

    console.log(`[Akun ${this.accountIndex + 1}] Membuat user agent baru...`.blue);
    const newUserAgent = this.#get_random_user_agent();
    this.session_user_agents[this.session_name] = newUserAgent;
    this.#save_session_data(this.session_user_agents);
    return newUserAgent;
  }

  // Menyimpan data sesi ke dalam file JSON
  #save_session_data(session_user_agents) {
    const filePath = path.join(process.cwd(), "session_user_agents.json");
    fs.writeFileSync(filePath, JSON.stringify(session_user_agents, null, 2));
  }

  // Mendapatkan platform berdasarkan user agent
  #get_platform(userAgent) {
    const platformPatterns = [
      { pattern: /iPhone/i, platform: "ios" },
      { pattern: /Android/i, platform: "android" },
      { pattern: /iPad/i, platform: "ios" },
    ];

    for (const { pattern, platform } of platformPatterns) {
      if (pattern.test(userAgent)) {
        return platform;
      }
    }

    return "Unknown";
  }

  // Mengatur header permintaan
  #set_headers() {
    const platform = this.#get_platform(this.#get_user_agent());
    this.headers["sec-ch-ua"] = `Not)A;Brand";v="99", "${platform} WebView";v="127", "Chromium";v="127"`;
    this.headers["sec-ch-ua-platform"] = platform;
    this.headers["User-Agent"] = this.#get_user_agent();
  }

  // Membuat user agent untuk akun
  createUserAgent() {
    try {
      const info = decodeJWT(this.queryId);
      const { email } = info;
      this.session_name = email;
      this.#get_user_agent();
    } catch (error) {
      this.log(`Tidak dapat membuat user agent, coba dapatkan query_id baru: ${error.message}`, "error");
      return;
    }
  }

  // Fungsi untuk mencatat log dengan warna berbeda berdasarkan jenis pesan
  async log(msg, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const accountPrefix = `[Akun ${this.accountIndex + 1}]`;
    const ipPrefix = this.proxyIP ? `[${this.proxyIP}]` : "[IP Lokal]";
    let logMessage = "";

    switch (type) {
      case "success":
        logMessage = `${accountPrefix}${ipPrefix} ${msg}`.green;
        break;
      case "error":
        logMessage = `${accountPrefix}${ipPrefix} ${msg}`.red;
        break;
      case "warning":
        logMessage = `${accountPrefix}${ipPrefix} ${msg}`.yellow;
        break;
      case "custom":
        logMessage = `${accountPrefix}${ipPrefix} ${msg}`.magenta;
        break;
      default:
        logMessage = `${accountPrefix}${ipPrefix} ${msg}`.blue;
    }
    console.log(logMessage);
  }

  // Mengecek alamat IP dari proxy yang digunakan
  async checkProxyIP() {
    try {
      const proxyAgent = new HttpsProxyAgent(this.proxy);
      const response = await axios.get("https://api.ipify.org?format=json", { httpsAgent: proxyAgent });
      if (response.status === 200) {
        this.proxyIP = response.data.ip;
        return response.data.ip;
      } else {
        throw new Error(`Tidak dapat memeriksa IP proxy. Kode status: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Terjadi kesalahan saat memeriksa IP proxy: ${error.message}`);
    }
  }

  // Mengirim permintaan HTTP dengan opsi retry
  async makeRequest(url, method, data = {}, options = { retries: 1, isAuth: false }) {
    const { retries, isAuth } = options;
    const headers = { ...this.headers };

    if (!isAuth) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const proxyAgent = new HttpsProxyAgent(this.proxy);
    let currRetries = 0,
      success = false;
    
    do {
      try {
        const response = await axios({
          method,
          url: `${url}`,
          data,
          headers,
          httpsAgent: proxyAgent,
          timeout: 30000,
        });
        success = true;
        if (response?.data?.data) return { success: true, data: response.data.data };
        return { success: true, data: response.data };
      } catch (error) {
        this.log(`Permintaan gagal: ${url} | ${error.message} | mencoba ulang...`, "warning");
        success = false;
        await sleep(settings.DELAY_BETWEEN_REQUESTS);
        if (currRetries == retries) return { success: false, error: error.message };
      }
      currRetries++;
    } while (currRetries <= retries && !success);
  }

  // Memeriksa apakah akun sudah check-in hari ini
  async handleCheckIn() {
    try {
      let proxyAgent = null;
      if (settings.USE_PROXY) {
        proxyAgent = new HttpsProxyAgent(this.proxy);
      }

      const response = await axios({
        method: "POST",
        url: "https://api.earnos.com/trpc/streak.checkIn?batch=1",
        headers: {
          authorization: `Bearer ${this.token.trim()}`,
          "content-type": "application/json",
        },
        httpsAgent: proxyAgent,
        data: {
          0: { json: null, meta: { values: ["undefined"] } },
        },
      });

      if (response.data[0]?.result?.data?.json?.success) {
        this.log(`Check-in berhasil! | ${new Date().toLocaleString()}`, "success");
        saveJson(this.session_name, { lastCheckIn: new Date() }, "localStorage.json");
        return true;
      } else {
        console.log(`Check-in gagal: `.yellow, response.data);
        return false;
      }
    } catch (error) {
      console.log(`Kesalahan saat check-in: `.red, error.response?.data || error.message);
      return false;
    }
  }
}

