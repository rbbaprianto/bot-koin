import requests

from smart_airdrop_claimer import base
from core.headers import headers


def get_info(data, proxies=None):
    url = f"https://miner-webapp-fz9k.vercel.app/api/user?id={data}"

    try:
        response = requests.get(
            url=url,
            headers=headers(),
            proxies=proxies,
            timeout=20,
        )
        data = response.json()
        balance = float(data["balance"])

        base.log(f"{base.green}Balance: {base.white}{balance:,}")

        return data
    except:
        return None
