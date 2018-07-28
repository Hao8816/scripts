#coding=utf8
import gearman, json, pdb
import pandas as pd


# 定义gearman server
GEARMAN_SERVERS = ['127.0.0.1:4730']

# 建立链接
gearman_worker = gearman.GearmanWorker(GEARMAN_SERVERS)


# 监听任务,执行任务的信息
def read_file_listener(gearman_worker, gearman_job):

    # 解析参数
    job_data = json.loads(gearman_job.data)

    # 文件路径
    file_path = job_data['path']
    page = int(job_data.get('page',1))
    size = int(job_data.get('size',10))
    column = job_data.get('column',None)
    from_num = (page-1)*size
    to_num = page*size

    print "处理csv文件"
    try:
        df = pd.read_csv(file_path)
    except:
        # 返回默认数据
        job_data['status'] = 0
        return json.dumps(job_data)

    # 获取总条数
    total_counts = df.iloc[:,0].size

    # 文件内容读取之后分页
    if total_counts % size == 0:
        max_page = total_counts/size
    else:
        max_page = total_counts/size + 1

    # 解析返回的数据
    if to_num > 0:
        df = df.iloc[from_num:to_num]

    # 如果指定返回某一列
    if column:
        df = df.loc[:,[column.encode('utf8')]]

    df = df.fillna('')
    headers = list(df.columns)
    columns = []
    for ix, row in df.iterrows():
        columns.append(row.to_dict())

    job_data['file_status'] = 1
    job_data['headers'] = headers
    job_data['columns'] = columns
    job_data['total'] = total_counts
    job_data['max_page'] = max_page
    return json.dumps(job_data)

# 注册worker
gearman_worker.set_client_id('read_file_worker')
gearman_worker.register_task('read_file', read_file_listener)

# 启动监听
gearman_worker.work()