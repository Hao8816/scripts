#coding=utf8
import gearman, json, pdb
import os
from elasticsearch import Elasticsearch

# 定义gearman server
GEARMAN_SERVERS = ['127.0.0.1:4730']
ES_HOST = '127.0.0.1'
ES_PORT = 9200

# 建立链接
gearman_worker = gearman.GearmanWorker(GEARMAN_SERVERS)

# 监听任务,执行任务的信息
def suggest_listener(gearman_worker, gearman_job):

    # 解析参数
    job_data = json.loads(gearman_job.data)
    query = job_data['query']

    # 建立连接
    es = Elasticsearch([{'host': ES_HOST, 'port': ES_PORT }])

    dsl = {
        "suggest": {
            "task-suggest" : {
                "prefix" : query,
                "completion" : {
                    "field" : "suggest",
                    "fuzzy" : {
                        "fuzziness" : 1
                    }
                }
            }
        }
    }

    # 查询es
    try:
        res = es.search(index="tasks", doc_type='details', body=dsl)
        suggest_list = res['suggest']['task-suggest']
        options = []
        for suggest in suggest_list:
            suggest_query = suggest['text']
            suggest_options = suggest['options']
            for suggest_option in suggest_options:
                options.append(suggest_option['_source'])
    except:
        options = []

    job_data['options'] = options
    return json.dumps(job_data)

# 注册worker
gearman_worker.set_client_id('suggest_worker')
gearman_worker.register_task('suggest', suggest_listener)

# 启动监听
gearman_worker.work()
