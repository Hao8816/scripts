#coding=utf8
import gearman, json, pdb
import os
import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from elasticsearch import Elasticsearch


# 存储csv的目录
csv_path = '../data/csvs/'

# 定义gearman server
GEARMAN_SERVERS = ['127.0.0.1:4730']
ES_HOST = '127.0.0.1'
ES_PORT = 9200

# @vaster 批量搜索相似客户的接口
def search_similarity_master_data(similar_row_hash, index_name, doc_type='details'):
    # 建立连接
    es = Elasticsearch([{'host': ES_HOST, 'port': ES_PORT }])

    # 构造查询语句
    msearch_dsl = []
    key_index_list = []
    for row_key in similar_row_hash:
        master = similar_row_hash[row_key]
        # 配置索引信息
        dsl_index = {"index": index_name, "doc_type": doc_type}

        # 配置必要条件
        must_list = []
        for key in master:
            query_name = master[key]
            if query_name == '':
                continue
            must_list.append({
                "match":
                    { key:
                        {"query":query_name}
                    }
                }
            )

        # 构造查询语句
        dsl_query = {
            "query" : {
              "bool":{
                  "must": must_list
              }
            },
            "size" : 1
        }
        msearch_dsl.append(dsl_index)
        msearch_dsl.append(dsl_query)
        key_index_list.append(row_key)

    # 批量查询,2000查询1次
    similarity_hash = {}
    queue_size = 2000
    max_queue_count = len(msearch_dsl)/queue_size+1
    for i in range(0,max_queue_count):
        from_index = i*queue_size
        to_index = (i+1)*queue_size
        queue_dsl = msearch_dsl[from_index:to_index]
        if len(queue_dsl) == 0:
            continue

        # 查询
        responses = es.msearch(body=queue_dsl)
        response_index = 0
        for response in responses['responses'] :
            # 解析每条查询的结果
            masters = response['hits']['hits']
            if len(masters) > 0:
                es_master = masters[0]['_source']
                # 所以的sha1
                row_sha1 = key_index_list[i*queue_size/2+response_index]
                similar_row_hash[row_sha1] = es_master

            response_index = response_index + 1

    return similar_row_hash



# 建立链接
gearman_worker = gearman.GearmanWorker(GEARMAN_SERVERS)

# 监听任务,执行任务的信息
def search_listener(gearman_worker, gearman_job):
    pdb.set_trace()

    # 解析参数
    job_data = json.loads(gearman_job.data)
    query_name = job_data['query']

    # 建立连接
    es = Elasticsearch([{'host': ES_HOST, 'port': ES_PORT }])

    # 查询条件
    must_list = [{
        "match":
            { "name":
                {"query":query_name}
            }
        }
    ]
    # 构造查询语句
    dsl = {
        "query" : {
          "bool":{
              "must": must_list
          }
        },
        "size" : 10
    }

    res = es.search(index="tasks", doc_type='details', body=dsl)
    task_list = []
    print res
    try :
        results =  res['hits']['hits']
        for result in results:
            task = result['_source']
            task_list.append(task)
    except:
        pass

    print "处理完成"
    job_data['options'] = task_list
    return json.dumps(job_data)

# 注册worker
gearman_worker.set_client_id('search_worker')
gearman_worker.register_task('search', search_listener)

# 启动监听
gearman_worker.work()