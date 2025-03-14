import requests

from smart_airdrop_claimer import base
from core.headers import headers


def buy_boost(data, command, proxies=None):
    url = f"https://miner-webapp-fz9k.vercel.app/api/boost?id={data}&command={command}"

    try:
        response = requests.post(
            url=url,
            headers=headers(),
            proxies=proxies,
            timeout=20,
        )
        data = response.json()
        message = data["message"]

        return message
    except:
        return data["error"]


def process_buy_boost(data, proxies=None):
    type = ["upgrade_miner_20", "upgrade_miner_10", "fullcharge"]
    for command in type:
        message = buy_boost(data=data, command=command, proxies=proxies)
        base.log(f"{base.white}Auto Buy Boost: {base.yellow}Buy {command} - {message}")
