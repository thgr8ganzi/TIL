## parallel 프로세싱
<hr/>

* 9.6 버전부터 parallel 프로세싱이 가능해졌다.
* 하나의 작업을 여러개의 프로세스가 동시에 수행하는것을 의미한다.
* 하나의 쿼리가 여러개의 CPU 코어를 사용할수 있다.
* 여러개의 프로세스가 동시에 IO 를 수행할수 있다.

### parallel 관련 파라미터
<hr/>

* max_worker_processes
  * 최대 worker 프로세스 수
  * 기본값은 8
* max_parallel_workers_per_gather
  * 하나의 쿼리에 사용할 수 있는 worker 프로세스 수
  * 기본값은 0
* force_parallel_mode
  * max_parallel_workers_per_gather 가 0보다 크면 옵티마이저는 쿼리비용을 계산해서 parallel 모드를 사용할지 결정한다.
  * on 할 경우 parallel 모드를 강제로 사용
  * 기본값은 off
* parallel_setup_cost
  * parallel 처리시 worker 프로세스 할당 받기 위한 사전 작업 필요
  * 기본값은 1000
* parallel_tuple_cost
  * parallel 처리시 부모 프로세스와 worker 프로세스 간 레코드 전송 필요
  * 전송되는 레코드 개수가 많다면 parallel 처리시 부담될수있다.
  * 처리해야할 레코드 수가 많은때 싱글 프로세스로 처리하도록 유도
  * 기본값 0.1
  * max_parallel_workers_per_gather 가 0보다 클때 parallel_tuple_cost 가 0이면 항상 parallel 모드로 실행된다.
* min_parallel_relation_size
  * parallel 처리를 위한 최소 테이블 크기
  * 기본값은 8MB
  * 8MB 보다 작은 테이블은 parallel 처리

### worker 프로세스 개수 산정 방법
<hr/>

* min_parallel_relation_size 파라미터 값을 기준으로 산정
* default 8MB 일경우 아래표와 같고 테이블 크기가 3배 커질때마다 worker 프로세스 1개 추가

| 테이블 크기    | worker 프로세스 |
|-----------|-------------|
| < 8MB     | 0           |
| < 24MB    | 1           |
| < 72MB    | 2           |
| < 216MB   | 3           |
| < 648MB   | 4           |
| < 1944MB  | 5           |
| < 5832MB  | 6           |
| >= 5832MB | 7           |

### parallel 프로세스 모델
<hr/>

* 생산자 - 소비자 모델이 아닌 멀티 스레드 방식
* 단순 scan 을 제외한 group by, 해시조인, 해시조인 후 group by 등은 생산자 - 소비자 모델이어야만 parallel 처리 극대화

### parallel 처리 예제
<hr/>

* 처리 기능
  * parallel 스캔
  * parallel group by
  * parallel join
```postgresql
drop table t1;
drop table t2;

create table t1 (c1 int, dummy char(100));
create table t2 (c1 int, amount int, dummy char(1000));

insert into t1 select i, 'dummy' from generate_series(1, 1000000) i;
insert into t2 select mod(i, 10000000) + 1, i*10, 'dummy' from generate_series(1, 10000000) i;

analyze t1;
analyze t2;

select pg_class.relname, pg_class.relpages, round(pg_class.relpages*8/1024.0, 2) as mb
from pg_class where relname in ('t1', 't2');
+-------+--------+--------+
|relname|relpages|mb      |
+-------+--------+--------+
|t1     |17242   |134.7   |
|t2     |1428572 |11160.72|
+-------+--------+--------+
set max_parallel_workers_per_gather to 8;
explain (costs false , analyze , buffers )
select count(*) from t1;
+-------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                 |
+-------------------------------------------------------------------------------------------+
|Finalize Aggregate (actual time=222.710..238.810 rows=1 loops=1)                           |
|  Buffers: shared hit=256 read=16986                                                       |
|  ->  Gather (actual time=222.490..238.801 rows=4 loops=1)                                 |
|        Workers Planned: 3                                                                 |
|        Workers Launched: 3                                                                |
|        Buffers: shared hit=256 read=16986                                                 |
|        ->  Partial Aggregate (actual time=174.055..174.056 rows=1 loops=4)                |
|              Buffers: shared hit=256 read=16986                                           |
|              ->  Parallel Seq Scan on t1 (actual time=11.996..156.490 rows=250000 loops=4)|
|                    Buffers: shared hit=256 read=16986                                     |
|Planning:                                                                                  |
|  Buffers: shared hit=8                                                                    |
|Planning Time: 0.112 ms                                                                    |
|Execution Time: 238.848 ms                                                                 |
+-------------------------------------------------------------------------------------------+
```
* finalize aggregate
  * 각 worker 프로세스에서 계산된 결과를 모아서 최종 결과를 계산
* workers planned
  * min_parallel_relation_size 를 기준으로 worker 프로세스 개수 산정
* workers launched
  * 실제로 실행된 worker 프로세스 개수
  * 현재 수행중인 worker 프로세스 개수에 따라 할당받는 worker 프로세스 개수가 달라질수 있다.
* partial aggregate & parallel seq scan
  * parallel 집계 및 parallel 스캔

### parallel 모니터링
<hr/>

* pstree, pg_stat_activity 뷰를 이ㅛㅇ해 모니터링 불가
* `ps -ef | grep parallel` 명령어로 확인
```postgresql
select pid, state, query from pg_stat_activity;
+---+------+----------------------------------------------+
|pid|state |query                                         |
+---+------+----------------------------------------------+
|383|active|select pid, state, query from pg_stat_activity|
|32 |null  |                                              |
|430|active|autovacuum: VACUUM public.t2                  |
|33 |null  |                                              |
|28 |null  |                                              |
|29 |null  |                                              |
|31 |null  |                                              |
+---+------+----------------------------------------------+
```
* 찾을수 없음

### parallel group by
<hr/>

```postgresql
set max_parallel_workers_per_gather to 16;
explain (costs false )
select c1, sum(amount), count(*)
from t2
group by c1;
+--------------------+
|QUERY PLAN          |
+--------------------+
|HashAggregate       |
|  Group Key: c1     |
|  ->  Seq Scan on t2|
+--------------------+
```
* explain 확인후 작업 수행
* max_parallel_workers_per_gather 를 0으로 설정하면 parallel 모드 사용하지 않음
* max_parallel_workers_per_gather 를 16으로 설정해도 싱글프로세스 활용
```postgresql
set parallel_tuple_cost = 0;
explain (costs false )
select c1, sum(amount), count(*)
from t2
group by c1;
+-----------------------------------------+
|QUERY PLAN                               |
+-----------------------------------------+
|GroupAggregate                           |
|  Group Key: c1                          |
|  ->  Gather Merge                       |
|        Workers Planned: 7               |
|        ->  Sort                         |
|              Sort Key: c1               |
|              ->  Parallel Seq Scan on t2|
+-----------------------------------------+
```
* parallel_tuple_cost 를 0으로 설정하면 worker 최대로 할당

### parallel hash join
<hr/>

```postgresql
set max_parallel_workers_per_gather to 16;
set parallel_tuple_cost = 0;
explain (costs false, analyze, buffers )
select t1.c1, t2.amount
from t1, t2
where t1.c1 = t2.c1;
+--------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                  |
+--------------------------------------------------------------------------------------------+
|Gather (actual time=35892.906..44665.223 rows=1000000 loops=1)                              |
|  Workers Planned: 7                                                                        |
|  Workers Launched: 7                                                                       |
|  Buffers: shared hit=15760 read=1430607 written=75                                         |
|  ->  Parallel Hash Join (actual time=35798.619..43385.305 rows=125000 loops=8)             |
|        Hash Cond: (t2.c1 = t1.c1)                                                          |
|        Buffers: shared hit=15760 read=1430607 written=75                                   |
|        ->  Parallel Seq Scan on t2 (actual time=3.356..41861.925 rows=1250000 loops=8)     |
|              Buffers: shared hit=14823 read=1413749 written=75                             |
|        ->  Parallel Hash (actual time=607.210..607.266 rows=125000 loops=8)                |
|              Buckets: 1048576  Batches: 1  Memory Usage: 47456kB                           |
|              Buffers: shared hit=384 read=16858                                            |
|              ->  Parallel Seq Scan on t1 (actual time=255.182..532.442 rows=125000 loops=8)|
|                    Buffers: shared hit=384 read=16858                                      |
|Planning:                                                                                   |
|  Buffers: shared hit=17 dirtied=2                                                          |
|Planning Time: 191.627 ms                                                                   |
|Execution Time: 44717.249 ms                                                                |
+--------------------------------------------------------------------------------------------+
```
* postgresql 은 생산자 - 소비자 모델이 아니기 때문에 worker 프로세스 총 7개
* postgresql 은 parallel 처리에 적합한데 테이블과 인덱스 파일을 1GB 단위로 나눠서 관리하기 때문