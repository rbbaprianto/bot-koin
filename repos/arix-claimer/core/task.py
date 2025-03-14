import requests

from smart_airdrop_claimer import base
from core.headers import headers


def get_task(data, proxies=None):
    url = f"https://miner-webapp-fz9k.vercel.app/api/task?id={data}"

    try:
        response = requests.get(
            url=url,
            headers=headers(),
            proxies=proxies,
            timeout=20,
        )
        data = response.json()
        task_dict = data["tasks"]

        return task_dict
    except:
        return None


def do_task(data, task_name, proxies=None):
    url = f"https://miner-webapp-fz9k.vercel.app/api/task?id={data}"
    payload = {"task": task_name}

    try:
        response = requests.post(
            url=url,
            headers=headers(),
            json=payload,
            proxies=proxies,
            timeout=20,
        )
        data = response.json()
        task_dict = data["tasks"]

        return task_dict
    except:
        return None


def process_do_task(data, proxies=None):
    task_dict = get_task(data=data, proxies=proxies)
    for task_name, status in task_dict.items():
        if status == 1:
            base.log(f"{base.white}{task_name}: {base.green}Completed")
        else:
            start_do_task = do_task(data=data, task_name=task_name, proxies=proxies)
            do_task_status = start_do_task[task_name]
            if do_task_status == 1:
                base.log(f"{base.white}{task_name}: {base.green}Completed")
            else:
                base.log(f"{base.white}{task_name}: {base.red}Incomplete")
