#coding=utf8
import gearman, json, pdb
import platform
import commands
import shlex, subprocess

# 不同平台的启动命令
OS_COMMANDS = {
    'Darwin' : 'brew services restart gearmand',
    'Linux' : 'sudo gearmand -L 127.0.0.1 -d',
}

# 系统需要注册的worker的信息
WORKER_INFO = {
    'read_file': 'nohup python gearman_worker_read_file.py &',
    'save_file': 'nohup python gearman_worker_save_file.py &',
    'suggest': 'nohup python gearman_worker_suggest.py &',
    'search': 'nohup python gearman_worker_search.py &',
    'index_doc': 'nohup python gearman_worker_index_doc.py &',
}

# 检查服务是启动

# 定义只需要执行的worker
try:
    admin_client = gearman.GearmanAdminClient(['127.0.0.1:4730'])
    # Inspect server state
    workers = admin_client.get_status()

    running_workers = []
    # 如果已经启动了worker，检查worker的状态
    for worker in workers:
        worker_name = worker['task']
        nb_workers = worker['workers']
        worker_queued = worker['queued']
        if nb_workers > 0:
            running_workers.append(worker_name)

    # 检查哪些未启动的worker
    unregistered_workers = list(set(WORKER_INFO.keys())-set(running_workers))
    for unregistered_worker in unregistered_workers:
        command = WORKER_INFO.get(unregistered_worker,'ls')
        print 'Worker:['+unregistered_worker+']未启动，执行命令:'+ command
        subprocess.Popen(shlex.split(command))

    # 查看任务
    ls_command = 'ps -ef |grep gearman'
    print commands.getoutput(ls_command)

except Exception,e:
    # 尚未启动gearmand
    print 'gearmand未启动，'+str(e)

    # 根据系统自动启动
    os_version = platform.system()
    os_command = OS_COMMANDS.get(os_version, None)
    if os_command:
        print subprocess.Popen(shlex.split(os_command))
        # 服务正常启动，检查worker的注册信息
        for command in WORKER_INFO.values():
            subprocess.Popen(shlex.split(command))

        # 查看任务
        ls_command = 'ps -ef |grep gearman'
        print commands.getoutput(ls_command)
    else:
        print '暂不支持的操作系统，请手动启动gearmand'


