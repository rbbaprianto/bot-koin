const axios = require("axios");
const { log } = require("./utils"); // Sesuaikan path jika diperlukan
const settings = require("./config/config");

const urlChecking = "https://raw.githubusercontent.com/Hunga9k50doker/APIs-checking/refs/heads/main/endpoints.json";

async function checkBaseUrl() {
  console.log("Memeriksa API...".blue);
  if (settings.ADVANCED_ANTI_DETECTION) {
    const result = await getBaseApi(urlChecking);
    if (result.endpoint) {
      log("Tidak ada perubahan pada API!", "success");
      return result;
    }
  } else {
    return {
      endpoint: settings.BASE_URL,
      message:
        "Problem??? silakan hubungi Telegram (https://t.me/rgwirasatya)",
    };
  }
}

async function getBaseApi(url) {
  try {
    const response = await axios.get(url);
    const content = response.data;
    if (content?.xstar) {
      return { endpoint: content.xstar, message: content.copyright };
    } else {
      return {
        endpoint: null,
        message:
          "Problem??? silakan hubungi Telegram (https://t.me/rgwirasatya)",
      };
    }
  } catch (e) {
    return {
      endpoint: null,
      message:
        "Problem??? silakan hubungi Telegram (https://t.me/rgwirasatya)",
    };
  }
}

module.exports = { checkBaseUrl };

