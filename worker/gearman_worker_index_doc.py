#coding=utf8
import gearman, json, pdb
import os
from elasticsearch import Elasticsearch
import hashlib

# 定义gearman server
GEARMAN_SERVERS = ['127.0.0.1:4730']
ES_HOST = '127.0.0.1'
ES_PORT = 9200

# 建立链接
gearman_worker = gearman.GearmanWorker(GEARMAN_SERVERS)


# 调用分词器
def es_analyze_name(name):
    # 建立链接
    es = Elasticsearch([{'host': ES_HOST, 'port': ES_PORT }])

    # 调用分词器
    res = es.indices.analyze('customers',body={'analyzer':'ik_smart','text': name})
    words = res['tokens']

    # 解析分词结果
    word_list = []
    for word in words :
        word_list.append(word['token'])

    return word_list


# 监听任务,执行任务的信息
def index_doc_listener(gearman_worker, gearman_job):

    # 解析参数
    job_data = json.loads(gearman_job.data)
    documents = job_data['docs']
    pdb.set_trace()

    # 建立连接
    es = Elasticsearch([{'host': ES_HOST, 'port': ES_PORT }])

    # 循环文档，索引文档
    for doc in documents :
        # 检查信息是不是存在，如果存在，更新es，如果不存在
        try :
            # 查询
            es.get(index="tasks", doc_type="details", id=doc['sha1'])
            es.update(index="tasks", doc_type="details", id=doc['sha1'], body={'doc':doc})
        except :
            try :
                res = es.index(index="tasks", doc_type='details', id=doc['sha1'], body=doc)
                print res
            except Exception,e :
                print str(e)

    print "处理完成"
    return json.dumps(job_data)

# 注册worker
gearman_worker.set_client_id('index_doc_worker')
gearman_worker.register_task('index_doc', index_doc_listener)

# 启动监听
gearman_worker.work()
