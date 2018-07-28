#coding=utf8
import gearman, json, pdb
import os
import pandas as pd

# 存储csv的目录
csv_path = '../data/csvs/'

# 定义gearman server
GEARMAN_SERVERS = ['127.0.0.1:4730']

# 建立链接
gearman_worker = gearman.GearmanWorker(GEARMAN_SERVERS)


# 监听任务,执行任务的信息
def save_file_listener(gearman_worker, gearman_job):

    # 解析参数
    job_data = json.loads(gearman_job.data)

    # 文件路径
    file_path = job_data['path']
    file_sha1 = job_data['sha1']

    # 解析文件类型
    file_type = file_path.split('.')[-1]
    try:
        if file_type == 'csv':
            print "处理csv文件"
            df = pd.read_csv(file_path)

        elif file_type == 'xls' or file_type == 'xlsx':
            print "处理excel文件"
            df = pd.read_excel(file_path, index_col=None, na_values=['NA'])
        else:
            print "暂不支持的文件"
            job_data['file_status'] = 0
            json.dumps(job_data)
    except:
        # 返回默认数据
        job_data['file_status'] = 0
        return json.dumps(job_data)

    # 文件存储路径
    save_path = csv_path+file_sha1+'.csv'
    try:
        df.to_csv(save_path, encoding='utf-8')
        job_data['file_status'] = 1
        job_data['csv_path'] = save_path
    except:
        job_data['file_status'] = 0

    return json.dumps(job_data)

# 注册worker
gearman_worker.set_client_id('save_file_worker')
gearman_worker.register_task('save_file', save_file_listener)

# 启动监听
gearman_worker.work()