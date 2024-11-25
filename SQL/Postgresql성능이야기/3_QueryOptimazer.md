## Query Optimizer

* query optimizer는 query의 실행계획을 결정하는 역할을 한다.
* query optimizer가 모든 쿼리의 실행 계획을 완벽히 수립할수 없음
* 느린쿼리의 원인은 다양하나 부정확한 통계정보, 비효율적 인덱스 구성, 시스템과부하, CPU 리소스 부족, 메모리 부족 등 다양
* 이론적으로 쿼리 튜닝은 액세스방법, 조인순서, 조인방법을 정해야 한다
* 상세하게 optimazer 수행 순서, query rewriter 를 통한 쿼리 변형, 액세스 방법, 조이 방법, 데이터 skew 현상 대응하기 위한 히스토그램, 인덱스 활용 등

### CBO (Cost Based Optimizer)

* postgresql 은 CBO를 사용
* RBO
  * Rule Based Optimizer
  * 규칙기반 옵티마이저
  * 인덱스가 있으면 seq scan 보다 인덱스를 이용
  * 매우 단순 직관적
* CBO
  * Cost Based Optimizer
  * 비용기반 옵티마이저
  * 미리 정의된 몇가지 파라티머 값과 통계 정보를 이용하여 계산
  * cost 를 이용하여 io 블록수, cpu 사용 시간을 역산할수 없지만 cost 가 적을수록 리소스를 이용해 쿼리를 수행한다고 가정

### 계산방식

* IO 비용과 CPU 비용 으로 나누고 operation 유형(sequential scan, index scan, join, sort, aggregate)에 따라 비용을 계산

| 구분 |         파라미터         |  기본설정  |
|:---:|:--------------------:|:------:|
|IO 비용|    seq_page_cost     |   1    |
|IO 비용|   random_page_cost   |   4    |
|CPU 비용|    cpu_tuple_cost    |  0.01  |
|CPU 비용| cpu_index_tuple_cost |  0.05  |
|CPU 비용|  cpu_operator_cost   | 0.0025 |

#### seq_page_cost

* seq scan 방식으로 1블록을 읽는 비용을 의미

#### random_page_page

* index scan 방식으로 1블록을 읽는 비용을 의미
* index scan 시 인덱스 리프 블록과 테이블 블록을 읽는 비용
* 인덱스 root 블록 및 branch 블록은 제외된다.(shared buffer cache 에 존재한다고 봄)
* 기본적으로 seq_page_cost 보다 4배 높게 설정

#### cpu_tuple_cost

* seq scan 수행시에 1개 레코드를 엑세스 하는 비용 의미

#### cpu_index_tuple_cost

* index scan 수행시에 1개 레코드를 엑세스 하는 비용 의미

#### cpu_operator_cost

* seq scan, index scan 수행시 레코드 1개를 필터처리하는 비용 의미

#### seq scan 비용 계산

```
drop table t1;
create table t1 (c1 integer, c2 integer);
insert into t1 select i, mod(i, 10) from generate_series(1, 100000) as i;
analyze t1;

select relpages, reltuples from pg_class where relname = 't1';

explain select * from t1;
Seq Scan on t1  (cost=0.00..1443.00 rows=100000 width=8)
```
* cost 첫번쨰 숫자는 레코드를 fetch 하는데 드는 시작 비용(startup cost)
* 두번쨰 숫자는 마지막 레코드까지 fetch 하는데 드는 총 비용(total cost)
```
explain select * from t1 where c1 < 300;

Seq Scan on t1  (cost=0.00..1693.00 rows=271 width=8)
  Filter: (c1 < 300)
```
* seq scan 필터는 모든행에 시행하기 때문에 cost 가 높아짐
```
explain select * from t1 where c1 < 300 and c2 = 1;

Seq Scan on t1  (cost=0.00..1943.00 rows=27 width=8)
  Filter: ((c1 < 300) AND (c2 = 1))
```
* seq scan 필터 조건을 추가할때마다 동일한 비용 증가

#### index scan 비용 계산 - 1

```
create unique index t1_uk on t1 (c1);
explain select * from t1 where c1 <= 300;

Index Scan using t1_uk on t1  (cost=0.29..14.21 rows=281 width=8)
  Index Cond: (c1 <= 300)
```
#### index scan 비용 계산 - 2

* 인덱스 스캔 비용은 복잡하여 옵티마이저마다 비용이 다르다
```
-- 블록덤프를 위해 pageinspect 사용
create extension pageinspect;

-- 인덱스 Blevel 은 1 즉 인덱스 브랜치 블록은 없고 Root 블록만 존재
select level from bt_metap('t1_uk');
1

-- 첫번째 leaf qmffhrdp 367 개 키가 저장 index c1 <= 300 의 경우 저장
select blkno, live_items, avg_item_size from bt_page_stats('t1_uk', 1);
+-----+----------+-------------+
|blkno|live_items|avg_item_size|
+-----+----------+-------------+
|1    |367       |16           |
+-----+----------+-------------+

-- ctid (테이블블록번호, 오프셋) 1~266 까지 레코드는 테이블 0번 블록에 저장
select * from bt_page_items('t1_uk', 1);
+----------+-------+-------+-----+-----+-----------------------+-----+-------+----+
|itemoffset|ctid   |itemlen|nulls|vars |data                   |dead |htid   |tids|
+----------+-------+-------+-----+-----+-----------------------+-----+-------+----+
|1         |(1,1)  |16     |false|false|6f 01 00 00 00 00 00 00|null |null   |null|
|2         |(0,1)  |16     |false|false|01 00 00 00 00 00 00 00|false|(0,1)  |null|
|3         |(0,2)  |16     |false|false|02 00 00 00 00 00 00 00|false|(0,2)  |null|
...
|226       |(0,225)|16     |false|false|e1 00 00 00 00 00 00 00|false|(0,225)|null|
|227       |(0,226)|16     |false|false|e2 00 00 00 00 00 00 00|false|(0,226)|null|
... 0번블록 - 1번블록
|228       |(1,1)  |16     |false|false|e3 00 00 00 00 00 00 00|false|(1,1)  |null|
|229       |(1,2)  |16     |false|false|e4 00 00 00 00 00 00 00|false|(1,2)  |null|
|230       |(1,3)  |16     |false|false|e5 00 00 00 00 00 00 00|false|(1,3)  |null|
...
+----------+-------+-------+-----+-----+-----------------------+-----+-------+----+
```

#### 옵티마이저의 비용 계산 방식

* 옵티마이저는 index scan 비용 계산을 위해 3개 함수를 이용
  * genericcostestimate() : 인덱스 블록 액세스 및 키 추출 비용 계산
  * btcostestimate() : 인덱스 블록 액세스 가중치 적용
  * cost_index() : 테이블 블록 액세스 비용과 레코드 추출 비용 계산

##### genericcostestimate()

* 