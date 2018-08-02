#coding=utf8
import gearman, json, pdb
import os
from elasticsearch import Elasticsearch
import hashlib

ES_HOST = '127.0.0.1'
ES_PORT = 9200

# 设置es的mapping
task_mapping = {
   "mappings": {
       "details" : {
           "properties" : {
               "suggest" : {
                   "type" : "completion"
               },
               "name" : {
                   "type": "text"
               },
               "url" : {
                   "type": "keyword"
               },
               "update_time" : {
                   "type": "keyword"
               },
               "status" : {
                   "type": "keyword"
               },
               "info" : {
                   "type": "keyword"
               }
           }
       }
   }
}

# 建立连接
es = Elasticsearch([{'host': ES_HOST, 'port': ES_PORT }])
res = es.indices.delete(index='tasks', ignore=[400, 404])
res = es.indices.create(index='tasks', ignore=400, body=task_mapping)


