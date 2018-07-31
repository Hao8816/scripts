#coding=utf8
import gearman, json, pdb
import os
from gensim import corpora, models, similarities
import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from collections import defaultdict
from elasticsearch import Elasticsearch



# 存储csv的目录
csv_path = '../data/csvs/'

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
def similarity_listener(gearman_worker, gearman_job):

    # 解析参数
    job_data = json.loads(gearman_job.data)
    documents = job_data['docs']
    query = job_data['query']

    # 1.分词，直接调用es
    texts = []
    for document in documents:
        word_list = es_analyze_name(document)
        for word in word_list:
            print word
        texts.append(word_list)

    #2.计算词频
    frequency = defaultdict(int) #构建一个字典对象
    #遍历分词后的结果集，计算每个词出现的频率
    for text in texts:
        for token in text:
            frequency[token]+=1

    #选择频率大于1的词
    texts=[[token for token in text if frequency[token]>1] for text in texts]

    #3.创建字典（单词与编号之间的映射）
    dictionary=corpora.Dictionary(texts)

    #4.将要比较的文档转换为向量（词袋表示方法）
    #将文档分词并使用doc2bow方法对每个不同单词的词频进行了统计，并将单词转换为其编号，然后以稀疏向量的形式返回结果
    new_vec = dictionary.doc2bow(es_analyze_name(query))

    #5.建立语料库
    #将每一篇文档转换为向量
    corpus = [dictionary.doc2bow(text) for text in texts]
    for corpu in corpus:
        print corpu

    #6.初始化模型
    # 初始化一个tfidf模型,可以用它来转换向量（词袋整数计数）表示方法为新的表示方法（Tfidf 实数权重）
    tfidf = models.TfidfModel(corpus)

    #将整个语料库转为tfidf表示方法
    corpus_tfidf = tfidf[corpus]

    #7.创建索引
    index = similarities.MatrixSimilarity(corpus_tfidf)

    #8.相似度计算
    new_vec_tfidf=tfidf[new_vec]#将要比较文档转换为tfidf表示方法

    #9.计算要比较的文档与语料库中每篇文档的相似度
    sims = index[new_vec_tfidf]
    for sim in sims:
        print str(sim*100)[:4]+ '%'

    print "处理完成"
    return json.dumps(job_data)

# 注册worker
gearman_worker.set_client_id('similarity_worker')
gearman_worker.register_task('similarity', similarity_listener)

# 启动监听
gearman_worker.work()