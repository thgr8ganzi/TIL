## partial 인덱스
<hr/>

* postgresql 은 인덱스 생성 문법에 where 절을 지원한다.
* where 절에 만족하는 레코드만 인덱싱 하는 기능 제공
* partial 인덱스라고 한다.
* skew(데이터의 불균형)가 심한 경우에 유용하다.
```postgresql
drop table t1;
create table t1 (c1 int, flag char(1), dummy char(100));

insert into t1 select i, 'Y', 'dummy'
from generate_series(1, 9999000) as i;

insert into t1 select i, 'N', 'dummy'
from generate_series(9999001, 10000000) as i;

select flag, count(*) from t1 group by flag;
+----+-------+
|flag|count  |
+----+-------+
|N   |1000   |
|Y   |9999000|
+----+-------+

create index t1_c1_index on t1(c1);

create index t1_flag_indx on t1(flag);
analyze t1;

select relpages from pg_class where relname = 't1_flag_indx';
+--------+
|relpages|
+--------+
|8462    |
+--------+
explain (costs false)
select count(*)
from t1 where c1 >= 9000000 and flag = 'Y' and dummy = 'dummy';
+--------------------------------------------------------------------------------+
|QUERY PLAN                                                                      |
+--------------------------------------------------------------------------------+
|Finalize Aggregate                                                              |
|  ->  Gather                                                                    |
|        Workers Planned: 2                                                      |
|        ->  Partial Aggregate                                                   |
|              ->  Parallel Index Scan using t1_c1_index on t1                   |
|                    Index Cond: (c1 >= 9000000)                                 |
|                    Filter: ((flag = 'Y'::bpchar) AND (dummy = 'dummy'::bpchar))|
+--------------------------------------------------------------------------------+
explain (costs false)
select count(*)
from t1 where c1 >= 9000000 and flag = 'N' and dummy = 'dummy';
+---------------------------------------------------------------+
|QUERY PLAN                                                     |
+---------------------------------------------------------------+
|Aggregate                                                      |
|  ->  Index Scan using t1_flag_indx on t1                      |
|        Index Cond: (flag = 'N'::bpchar)                       |
|        Filter: ((c1 >= 9000000) AND (dummy = 'dummy'::bpchar))|
+---------------------------------------------------------------+
```
* 기존 인덱스 drop 후 partial 인덱스 생성
```postgresql
drop index t1_flag_indx;
create index t1_flag_index on t1(flag) where flag = 'N';
analyze t1;
select relpages from pg_class where relname = 't1_flag_index';
+--------+
|relpages|
+--------+
|2       |
+--------+
explain (costs false)
select count(*)
from t1 where c1 >= 9000000 and flag = 'Y' and dummy = 'dummy';
+--------------------------------------------------------------------------------+
|QUERY PLAN                                                                      |
+--------------------------------------------------------------------------------+
|Finalize Aggregate                                                              |
|  ->  Gather                                                                    |
|        Workers Planned: 2                                                      |
|        ->  Partial Aggregate                                                   |
|              ->  Parallel Index Scan using t1_c1_index on t1                   |
|                    Index Cond: (c1 >= 9000000)                                 |
|                    Filter: ((flag = 'Y'::bpchar) AND (dummy = 'dummy'::bpchar))|
+--------------------------------------------------------------------------------+
explain (costs false)
select count(*)
from t1 where c1 >= 9000000 and flag = 'N' and dummy = 'dummy';
+---------------------------------------------------------------+
|QUERY PLAN                                                     |
+---------------------------------------------------------------+
|Aggregate                                                      |
|  ->  Index Scan using t1_flag_index on t1                     |
|        Filter: ((c1 >= 9000000) AND (dummy = 'dummy'::bpchar))|
+---------------------------------------------------------------+
```
* partial 인덱스도 일반 인덱스와 동일한 실행 계획
```postgresql
insert into t1 select null, 'Y', 'dummy' from generate_series(1, 100) as i;
explain (costs false)
select * from t1 where c1 is null;
+----------------------------------+
|QUERY PLAN                        |
+----------------------------------+
|Index Scan using t1_c1_index on t1|
|  Index Cond: (c1 IS NULL)        |
+----------------------------------+
```
* null 도 인덱스를 포함 is null 도 인덱스 스캔 수행

### BRIN(Block Range Index)
<hr/>

* 블록내 min/max 값을 이용해 블록 단위 인덱싱 이로인해 인덱스 크기가 매우 작아진다.
* 디스크 공간이 부족한 경우 유용하다.
* BRIN 은 블록 범위별로 최소값과 최대값을 저장한다.
* 블록범위 기본값 128, 이로 인해 넓은 범위 인덱스 스캔시 유리하고 1건만 검색해도 128개의 테이블 블록을 액세스함
* BRIN 칼럼 기준으로 테이블 정렬된것이 성능상 유리
```postgresql
drop table t1;
create table t1 (c1 int, c2 int, dummy char(100));
insert into t1 select i, i, 'dummy' from generate_series(1, 10000000) i;

create index t1_c1_index on t1(c1);
create index t1_c2_brin on t1 using brin(c2);
analyze t1;

select pg_class.relname, pg_class.relpages, round(pg_class.relpages * 8 / 1024.0, 0) as "size (MiB)"
from pg_class where relname in ('t1', 't1_c1_index', 't1_c2_brin');
+-----------+--------+----------+
|relname    |relpages|size (MiB)|
+-----------+--------+----------+
|t1         |172414  |1347      |
|t1_c1_index|27422   |214       |
|t1_c2_brin |6       |0         |
+-----------+--------+----------+
```
* 일반 인덱스와 크기 비교를 했을때 BRIN 인덱스가 훨씬 작다.
```postgresql
explain (costs false, analyze, buffers)
select * from t1 where  c1 = 1;
+----------------------------------------------------------------------------+
|QUERY PLAN                                                                  |
+----------------------------------------------------------------------------+
|Index Scan using t1_c1_index on t1 (actual time=1.738..1.741 rows=1 loops=1)|
|  Index Cond: (c1 = 1)                                                      |
|  Buffers: shared read=4                                                    |
|Planning:                                                                   |
|  Buffers: shared hit=30 read=1                                             |
|Planning Time: 50.285 ms                                                    |
|Execution Time: 1.756 ms                                                    |
+----------------------------------------------------------------------------+
explain (costs false, analyze, buffers)
select * from t1 where  c2 = 1;
+----------------------------------------------------------------------------------+
|QUERY PLAN                                                                        |
+----------------------------------------------------------------------------------+
|Bitmap Heap Scan on t1 (actual time=0.343..24.824 rows=1 loops=1)                 |
|  Recheck Cond: (c2 = 1)                                                          |
|  Rows Removed by Index Recheck: 7423                                             |
|  Heap Blocks: lossy=128                                                          |
|  Buffers: shared hit=15 read=127                                                 |
|  ->  Bitmap Index Scan on t1_c2_brin (actual time=0.332..0.333 rows=1280 loops=1)|
|        Index Cond: (c2 = 1)                                                      |
|        Buffers: shared hit=14                                                    |
|Planning:                                                                         |
|  Buffers: shared hit=1                                                           |
|Planning Time: 29.699 ms                                                          |
|Execution Time: 24.848 ms                                                         |
+----------------------------------------------------------------------------------+
```
* 일반적으로 적은 범위를 조회할때는 일반 인덱스가 유리하다.
* BRIN 은 bitmap index scan 을 사용하기 때문에 블록 범위가 넓은 경우 유리하다.
* BRIN 은 어떤 조건을 입력하더라고 모든 인덱스 블록을 스캔
```postgresql
select * from brin_metapage_info(get_raw_page('t1_c2_brin', 0));
+----------+-------+-------------+--------------+
|magic     |version|pagesperrange|lastrevmappage|
+----------+-------+-------------+--------------+
|0xA8109CFA|1      |128          |1             |
+----------+-------+-------------+--------------+
```
* BRIN 은 메타데이터는 인덱스 0번 블록에 저장하고 이를 통해 1개의 키값이 128블록 관리
* BRIN 은 반드시 테이블을 액세스 한다 따라서 index only scan 보다 느리다.
* 모든 블록을 메모리 IO 로 처리하면 BRIN 이 index scan 보다 빠르다
* 테이블 정렬 상태는 메모리 IO 발생시 크게 영향은 없지만 DISK IO 발생시 성능이 크게 차이난다. 이는 BRIN 뿐만 아니라 모든 인덱스에 해당한다.