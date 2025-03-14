import requests

from smart_airdrop_claimer import base
from core.headers import headers


def process_claim(data, proxies=None):
    url = f"https://miner-webapp-fz9k.vercel.app/api/claim?id={data}"

    try:
        response = requests.post(
            url=url,
            headers=headers(),
            proxies=proxies,
            timeout=20,
        )
        data = response.json()
        balance = float(data["balance"])

        base.log(f"{base.green}Balance after Claim: {base.white}{balance:,}")

        return data
    except:
        error = data["error"]
        base.log(f"{base.white}Auto Claim: {base.red}{error}")
        return None
