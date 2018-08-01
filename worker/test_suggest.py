#coding=utf8
import gearman, json, pdb
import os
from elasticsearch import Elasticsearch
import hashlib

ES_HOST = '127.0.0.1'
ES_PORT = 9200

# "suggest" : { "input": [ "Nevermind", "Nirvana" ]}

docs = [
    {'name':'湖北益生天济大药房连锁有限公司解放大道店 '},
    {'name':'湖北益生天济大药房连锁有限公司民生路店 '},
    {'name':'湖北益生天济大药房连锁有限公司现代花园店 '},
    {'name':'湖北益生天济大药房连锁有限公司红钢城店 '},
    {'name':'湖北益生天济大药房连锁有限公司丁字桥店 '},
    {'name':'湖北益生天济大药房连锁有限公司建九店 '},
    {'name':'湖北益生天济大药房连锁有限公司星海虹城店 '},
    {'name':'湖北益生天济大药房连锁有限公司锦绣龙城店 '},
    {'name':'湖北益生天济大药房连锁有限公司后湖五路店 '},
    {'name':'湖北益生天济大药房连锁有限公司中南路店 '},
    {'name':'湖北益生天济大药房连锁有限公司瑞安店 '},
    {'name':'河北神威大药房连锁有限公司卓达连锁店 '},
    {'name':'河北神威大药房连锁有限公司北荣连锁店 '},
    {'name':'河北森众医药连锁有限公司'},
    {'name':'河北健康人医药连锁有限公司'},
]

# 设置es的mapping
task_mapping = {
   "mappings": {
       "details" : {
           "properties" : {
               "suggest" : {
                   "type" : "completion"
               },
               "name" : {
                   "type": "keyword"
               }
           }
       }
   }
}


# 调用分词器
def es_analyze_name(name):
    # 建立链接
    es = Elasticsearch([{'host': ES_HOST, 'port': ES_PORT }])

    # 调用分词器
    res = es.indices.analyze('tasks',body={'analyzer':'ik_smart','text': name})
    words = res['tokens']

    # 解析分词结果
    word_list = []
    for word in words :
        word_list.append(word['token'])

    return word_list

# 将商品信息索引到es中
def index_task(docs) :
    # 建立连接
    es = Elasticsearch([{'host': ES_HOST, 'port': ES_PORT }])

    # 循环文档，索引文档
    for doc in docs :
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


# 建立连接
es = Elasticsearch([{'host': ES_HOST, 'port': ES_PORT }])
res = es.indices.create(index='tasks', ignore=400, body=task_mapping)

index_docs = []
# 索引文档
for doc in docs:
    # 调用分词
    name = doc['name']
    sha1 = hashlib.sha1(str(name)).hexdigest()
    #word_list = es_analyze_name(doc['name'])
    word_list = [doc['name']]
    doc['suggest'] = {'input':word_list}
    doc['sha1'] = sha1
    index_docs.append(doc)

# 打印文档
#index_task(index_docs)

dsl = {
    "suggest": {
        "task-suggest" : {
            "prefix" : "河北森众",
            "completion" : {
                "field" : "suggest",
                "fuzzy" : {
                    "fuzziness" : 10
                }
            }
        }
    }
}

#res = es.search(index="tasks", doc_type='details', body=dsl)
#options = res['suggest']['task-suggest']
#for option in options:
#    text_query = option['text']
#    text_options = option['options']
#    print text_query
#    for text_option in text_options:
#        print text_option['_source']['name']



