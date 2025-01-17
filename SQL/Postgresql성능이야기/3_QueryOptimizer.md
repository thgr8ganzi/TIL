## Query Optimizer

* query optimizer는 query의 실행계획을 결정하는 역할을 한다.
* query optimizer가 모든 쿼리의 실행 계획을 완벽히 수립할수 없음
* 느린쿼리의 원인은 다양하나 부정확한 통계정보, 비효율적 인덱스 구성, 시스템과부하, CPU 리소스 부족, 메모리 부족 등 다양
* 이론적으로 쿼리 튜닝은 액세스방법, 조인순서, 조인방법을 정해야 한다
* 상세하게 optimizer 수행 순서, query rewriter 를 통한 쿼리 변형, 액세스 방법, 조이 방법, 데이터 skew 현상 대응하기 위한 히스토그램, 인덱스 활용 등

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

### 통계정보

* 옵티마이저는 테이블, 인덱스, 칼럼에 대한 통계 정보를 이용해 비용처리
* 옵티마이저가 최적의 실행계획을 수립하도록 하려면 최적의 통계 정보를 제공해야 한다.

#### 통계정보 생성 단위

* 통계 정보 생성 단위는 데이터베이스, 테이블, 칼럼
* 스키마 또는 인덱스는 통계정보를 생성할수 없다.

#### 통계정보 수동 생성

* 데이터베이스, 테이블, 칼럼 레벨로 통계정보를 생성할수 있고 verbose 옵션을 이용해서 수행내용을 확인할수 있다.
```
--데이터베이스 레벨
analyze;
--테이블 레벨
analyze t1;
--칼럼 레벨
analyze t1(c1, c2);
--verbose 옵션
analyze verbose t1;

analyzing "public.t1"
"t1": scanned 443 of 443 pages, containing 100000 live rows and 0 dead rows; 
30000 rows in sample, 100000 estimated total rows
```

#### 통계정보 자동 생성

* autovacuum 은 통계 정보를 자동으로 수집하기 위한 프로세스
* 통계 정보 수집 시점은 파라미터를 이용해서 계산

| 파라미터 |         설명          | 기본값 |
|:-------:|:-------------------:|:------:|
|autovacuum| autovacuum 프로세스 활성화 |on|
|autovacuum_analyze_scale_factor|  테이블 내의 레코드 변경 비율   |0.1|
|autovacuum_analyze_threshold|     최소 변경 레코드 수     |50|

* autovacuum 파라미터를 on 으로 설정한경우 통계정보 자동생성
* off 로 설정하면 자동 통계 수집뿐만 아니라 자동 vacuum 도 중지
* off 설정해도 transaction XID wraparound 방지를 위한 vacuum 은 수행
* autovacuum_analyze_scale_factor 는 통계정보를 자동으로 생성하기 위한 1차 기준 테이블내 레코드가 0.1% 변경되면 통계정보를 생성
* autovacuum_analyze_threshold 는 통계정보를 자동으로 생성하기 위한 2차기준 최소 50건 이상 변경되어야함, 작은 테이블에 대한 빈번한 변경시 발생할수있는 불필요한 자동 통계 생성 작업 배제
```
-- 임계값 = 50 + (10000 * 0.1) = 1,050건

drop table t2;
create table t2 (c1 integer, c2 integer);
insert into t2 select generate_series(1, 10000);
select a.relname, a.relpages, a.reltuples, b.last_autoanalyze from pg_class a, pg_stat_user_tables b
where a.relname = b.relname and a.relname = 't2';

+-------+--------+---------+---------------------------------+
|relname|relpages|reltuples|last_autoanalyze                 |
+-------+--------+---------+---------------------------------+
|t2     |45      |10000    |2024-12-08 08:52:55.317023 +00:00|
+-------+--------+---------+---------------------------------+

-- 추가로 1000건 10% 입력하였지만 통계정보 생성 x
insert into t2 select generate_series(1, 1000);

-- 51건 추가로 입력하여 통계정보 생성
insert into t2 select generate_series(1, 51);
+-------+--------+---------+---------------------------------+
|relname|relpages|reltuples|last_autoanalyze                 |
+-------+--------+---------+---------------------------------+
|t2     |49      |11051    |2024-12-08 08:57:55.389846 +00:00|
+-------+--------+---------+---------------------------------+
```

#### 통계정보 확인

* 통계정보를 확인할수 있는 딕셔너리 테이블은 pg_class 와 pg_stat 이다.
* pg_class 는 테이블 레벨의 통계 정보를 제공
* pg_stats 는 칼럼 레벨의 통계 정보를 제공
 
##### pg_class
| 칼럼 |         설명          |
|:---:|:--------------------:|
|relpages| 블록수 |
|reltuples| 레코드수 |

##### pg_stats
|칼럼 |                                                                      설명                                                                       |
|:---:|:---------------------------------------------------------------------------------------------------------------------------------------------:|
|null_frac|                                               null 비율, 모두 null 이면 1 아니면 0, 75프로 가 null 이면 0.75                                                |
|avg_width|                                                                   칼럼의 평균 길이                                                                   |
|n_distinct| NDV(number of distinct value). 테이블 건수 대비 10% 이내면 NDV 그대로 표시(양수값)<br/>NDV 10% 이상이면 NDV = -(NDV/레코드수)공식 적용(음수값)<br/>unique 컬럼의 n_distinct 값은 -1 |
|correlation|                                               컬럼 정렬 상태, -1 ~ 1 사이 값<br/>1은 완벽한 정렬 -1은 완벽히 역순 정렬                                               |

##### n_distinct
```
drop table t3;
create table t3 (c1 int, c2 int, c3 int, c4 int);
insert into t3
select i, -- unique
       mod(i,2000), -- NDV 2000(20%)
       mod(i,1001), -- NDV 1001(10.01%)
       mod(i,1000) -- NDV 1000(10%)
from generate_series(1, 10000) a(i);
analyze t3;
select attname, n_distinct from pg_stats where tablename = 't3';
+-------+----------+
|attname|n_distinct|
+-------+----------+
|c1     |-1        |
|c2     |-0.2      |
|c3     |-0.1001   |
|c4     |1000      |
+-------+----------+
```

##### correlation
```
-- 정렬 잘됨
drop table t1;
create table t1(c1 int, dummy char(100));
insert into t1 select generate_series(1, 10000), 'a';
analyze t1;

-- 역순 정렬
drop table t2;
create table t2(c1 int, dummy char(100));
insert into t2 select generate_series(1, 10000), 'a' order by 1 desc;
analyze t2;

-- 무작위 정렬
drop table t3;
create table t3(c1 int, dummy char(100));
do $$
begin
    for i in 1..200 loop
        for j in 1..49 loop
        insert into t3 values (i+(j*200), 'a');
        end loop;
    end loop;
end$$;
analyze t3;

select tablename, attname, correlation from pg_stats where tablename in ('t1', 't2', 't3') and attname = 'c1';
+---------+-------+-----------+
|tablename|attname|correlation|
+---------+-------+-----------+
|t1       |c1     |1          |
|t2       |c1     |-1         |
|t3       |c1     |0.02540557 |
+---------+-------+-----------+
```
##### index 생성후 correlation 확인
```
create unique index t1_uk on t1(c1);
create unique index t2_uk on t2(c1);
create unique index t3_uk on t3(c1);

-- index scan 방식으로 수행
explain select * from t1 where c1 between 1 and 500;
+-------------------------------------------------------------------+
|QUERY PLAN                                                         |
+-------------------------------------------------------------------+
|Index Scan using t1_uk on t1  (cost=0.29..30.29 rows=500 width=105)|
|  Index Cond: ((c1 >= 1) AND (c1 <= 500))                          |
+-------------------------------------------------------------------+

-- index scan 방식으로 수행
explain select * from t2 where c1 between 1 and 500;
+-------------------------------------------------------------------+
|QUERY PLAN                                                         |
+-------------------------------------------------------------------+
|Index Scan using t2_uk on t2  (cost=0.29..30.29 rows=500 width=105)|
|  Index Cond: ((c1 >= 1) AND (c1 <= 500))                          |
+-------------------------------------------------------------------+

-- bitmap index scan 방식 수행
-- 무작위로 흩어진 데이터를 읽을 때 발생하는 랜덤 I/O를 최소화하기 위해 비트맵을 생성하여 접근
-- 인덱스를 사용하여 조건에 맞는 모든 행의 위치(튜플 ID)를 찾고, 이를 비트맵으로 만듭니다. 이 단계에서는 실제 데이터 행을 읽지 않는다
explain select * from t3 where c1 between 1 and 500;
+--------------------------------------------------------------------+
|QUERY PLAN                                                          |
+--------------------------------------------------------------------+
|Bitmap Heap Scan on t3  (cost=7.36..185.19 rows=300 width=105)      |
|  Recheck Cond: ((c1 >= 1) AND (c1 <= 500))                         |
|  ->  Bitmap Index Scan on t3_uk  (cost=0.00..7.29 rows=300 width=0)|
|        Index Cond: ((c1 >= 1) AND (c1 <= 500))                     |
+--------------------------------------------------------------------+
```
* correlation 에 따라 인덱스 액세스 방식이 달라짐

#### 통계정보 제어

##### 테이블별 자동 통계 생성 제어 방법

```
-- 임계영역 = autovacuum_analyze_threshold + (reltuples * autovacuum_analyze_scale_factor)

-- 10만건 단위로 통계정보를 갱신
alter table t1 set (autovacuum_analyze_scale_factor = 0.0);
alter table t1 set (autovacuum_analyze_threshold = 1000000);

-- 10% 변경시 통계정보 갱신
alter table t1 set (autovacuum_analyze_scale_factor = 0.1);
alter table t1 set (autovacuum_analyze_threshold = 0);
```

##### 히스토그램버킷 개수 제어 방법

* 히스토그럄을 저장하기 위한 버킷 개수는 default_statistics_target 파라미터로 제어
* 기본 설정값 100
* 0으로 설정하면 히스트그램을 수집하지 않는다.
* 히스트로그램 수동으로 변경하는법
```
alter table t1 alter column c1 set statistics 200;
alter table t2 alter column c1 set statistics 0;
```

##### n_distinct 통계 제어 방법

* NDV(number of distinct value) 는 실행 계획 수립에 있어서 매우 중요한 정보
* 하지만 테이블이 매우 크면 값이 부정확할수 있다.
* 통계정보 생성시 모든 블록을 스캔하지 않고 일부 블록만 샘플링 하기 때문
* NDV 를 수동으로 변경하는 법
```
drop table t1;
create table t1 (c1 int, dummy char(200));

do $$
begin
    for i in 1..2000000 loop
        for j in 1..5 loop
            insert into t1 values (i, 'dummy');
        end loop;
    end loop;
end;
$$;

analyze t1;

select relpages, reltuples::integer from pg_class where relname = 't1';
-- 294,118 페이지 × 8KB = 약 2.2GB
-- 2,000,000 × 5 = 10,000,000
+--------+---------+
|relpages|reltuples|
+--------+---------+
|294118  |10000012 |
+--------+---------+

-- 고유값이 261301개 dummy 는 동일한값
-- 통계 정보는 샘플링을 통해 추정된 값이므로 실제 값과 차이가 있다
select attname, n_distinct from pg_stats where tablename = 't1';
+-------+----------+
|attname|n_distinct|
+-------+----------+
|c1     |261301    |
|dummy  |1         |
+-------+----------+

-- 실제 row 는 5인데 38로 추정
explain select * from t1 where c1 = 10;
+-------------------------------------------------------------------------------+
|QUERY PLAN                                                                     |
+-------------------------------------------------------------------------------+
|Gather  (cost=1000.00..347205.20 rows=38 width=208)                            |
|  Workers Planned: 2                                                           |
|  ->  Parallel Seq Scan on t1  (cost=0.00..346201.40 rows=16 width=208)        |
|        Filter: (c1 = 10)                                                      |
|JIT:                                                                           |
|  Functions: 2                                                                 |
|  Options: Inlining false, Optimization false, Expressions true, Deforming true|
+-------------------------------------------------------------------------------+

alter table t1 alter column c1 set (n_distinct = -0.2);
analyze t1;
select attname, n_distinct from pg_stats where tablename = 't1';
-- -0.2는 전체 행의 20%가 고유값이라는 의미
-- 절대값(2000000)으로 설정하면 테이블의 크기가 변경될 때마다 다시 설정
+-------+----------+
|attname|n_distinct|
+-------+----------+
|c1     |-0.2      |
|dummy  |1         |
+-------+----------+

-- 동일한 쿼리 실행시 row 5개로 추정
explain select * from t1 where c1 = 10;
+-------------------------------------------------------------------------------+
|QUERY PLAN                                                                     |
+-------------------------------------------------------------------------------+
|Gather  (cost=1000.00..347201.90 rows=5 width=208)                             |
|  Workers Planned: 2                                                           |
|  ->  Parallel Seq Scan on t1  (cost=0.00..346201.40 rows=2 width=208)         |
|        Filter: (c1 = 10)                                                      |
|JIT:                                                                           |
|  Functions: 2                                                                 |
|  Options: Inlining false, Optimization false, Expressions true, Deforming true|
+-------------------------------------------------------------------------------+
```
* 사용자가 변경한 n_distinct 값은 어떤 상황에서도 변경되지 않음
* 모든 레코드가 동일한 값으로 변경한후 analyze 를 수행해도 수동으로 설정한 값은 변경되지 않음
* 옵티마이저는 사용자가 수동으로 변경한 n_distinct 값을 절대적으로 신뢰
* 수동으로 NDV 를 변경한 이후에 추가 데이터 입력, 수정, 삭제로 인해 NDV 가 급격하게 감소하거나 증가한다면 부정확한 NDV 제공한다는 문제점 있음
* 따라서 NDV 를 수동으로 변경은 읽기전용 테이블에 적합
```
-- NDV 값이 변경되었을때 수동으로 변경한 NDV 값을 초기화
alter table t1 alter column c1 reset (n_distinct);
analyze t1;
```

#### 샘플링 블록 수

* 테이블이 클수록 통계 정보가 부정확한 이유는 전수 조사가 아닌 샘플링 방식이기 때문
* 3만블록(234MiB)으로 제한하여 테이블이 클수록 통계정보가 부정확할 가능성 커니다.
* 3만 블록 = 약 234MB (8KB × 30,000)
* 최대 블록을 가장 쉽게 확인하는 방법은 analyze verbose 를 사용
```
analyze verbose t1;
analyzing "public.t1"
"t1": scanned 30000 of 294118 pages
, containing 1020000 live rows and 0 dead rows; 30000 rows in sample
, 10000012 estimated total rows
```
* 3만 블록으로 제한하는 이유는 통계정보 생성 시간을 단축하기 위해서
```
VACUUM (ANALYZE, VERBOSE) t1;

vacuuming "postgres.public.t1"
finished vacuuming "postgres.public.t1": index scans: 0
pages: 0 removed, 294118 remain, 1 scanned (0.00% of total)
tuples: 0 removed, 10000012 remain, 0 are dead but not yet removable
removable cutoff: 916, which was 0 XIDs old when operation ended
frozen: 0 pages from table (0.00% of total) had 0 tuples frozen
index scan not needed: 0 pages from table (0.00% of total) had 0 dead item identifiers removed
avg read rate: 0.000 MB/s, avg write rate: 0.000 MB/s
buffer usage: 98 hits, 0 misses, 0 dirtied
WAL usage: 0 records, 0 full page images, 0 bytes
system usage: CPU: user: 0.00 s, system: 0.00 s, elapsed: 0.00 s
analyzing "public.t1"
"t1": scanned 30000 of 294118 pages
, containing 1020000 live rows and 0 dead rows; 30000 rows in sample
, 10000012 estimated total rows
```
* vacuum analyze 를 사용하면 전체 스캔을 할것 같지만 vacuum 과 analyze 를 나눠서 수행할뿐
* 직접적인 소스를 수정해서 수동으로 변경할수 있음
* /src/backend/commands/analyze.c
* std_typanalyze 함수 안 stats -> minrows = (원하는 블록 값 하드코딩)
* 바람직 하지 않은 방법
```
bool
std_typanalyze(VacAttrStats *stats)
{
	Oid			ltopr;
	Oid			eqopr;
	StdAnalyzeData *mystats;

	/* If the attstattarget column is negative, use the default value */
	if (stats->attstattarget < 0)
		stats->attstattarget = default_statistics_target;

	/* Look for default "<" and "=" operators for column's type */
	get_sort_group_operators(stats->attrtypid,
							 false, false, false,
							 &ltopr, &eqopr, NULL,
							 NULL);

	/* Save the operator info for compute_stats routines */
	mystats = (StdAnalyzeData *) palloc(sizeof(StdAnalyzeData));
	mystats->eqopr = eqopr;
	mystats->eqfunc = OidIsValid(eqopr) ? get_opcode(eqopr) : InvalidOid;
	mystats->ltopr = ltopr;
	stats->extra_data = mystats;

	/*
	 * Determine which standard statistics algorithm to use
	 */
	if (OidIsValid(eqopr) && OidIsValid(ltopr))
	{
		/* Seems to be a scalar datatype */
		stats->compute_stats = compute_scalar_stats;
		/*--------------------
		 * The following choice of minrows is based on the paper
		 * "Random sampling for histogram construction: how much is enough?"
		 * by Surajit Chaudhuri, Rajeev Motwani and Vivek Narasayya, in
		 * Proceedings of ACM SIGMOD International Conference on Management
		 * of Data, 1998, Pages 436-447.  Their Corollary 1 to Theorem 5
		 * says that for table size n, histogram size k, maximum relative
		 * error in bin size f, and error probability gamma, the minimum
		 * random sample size is
		 *		r = 4 * k * ln(2*n/gamma) / f^2
		 * Taking f = 0.5, gamma = 0.01, n = 10^6 rows, we obtain
		 *		r = 305.82 * k
		 * Note that because of the log function, the dependence on n is
		 * quite weak; even at n = 10^12, a 300*k sample gives <= 0.66
		 * bin size error with probability 0.99.  So there's no real need to
		 * scale for n, which is a good thing because we don't necessarily
		 * know it at this point.
		 *--------------------
		 */
		stats->minrows = 300 * stats->attstattarget;
	}
	else if (OidIsValid(eqopr))
	{
		/* We can still recognize distinct values */
		stats->compute_stats = compute_distinct_stats;
		/* Might as well use the same minrows as above */
		stats->minrows = 300 * stats->attstattarget;
	}
	else
	{
		/* Can't do much but the trivial stuff */
		stats->compute_stats = compute_trivial_stats;
		/* Might as well use the same minrows as above */
		stats->minrows = 300 * stats->attstattarget;
	}

	return true;
}
```
* 3만개여도 대체적으로 정확한 이유
* 샘플링의 정확성 
  * 통계학적 방법을 사용하여 전체 데이터의 특성을 예측합니다 
  * 이미지에서 보듯이 예측값(rows=6207)과 실제값(rows=6000)이 크게 차이나지 않습니다 
  * 무작위로 선택된 샘플이 전체 데이터의 특성을 잘 반영할 수 있습니다
* 옵티마이저의 보완 기능
  * 실행 계획 수립 시 여러 요소를 종합적으로 고려합니다 
  * 통계 정보 외에도 인덱스 조건, 필터 조건 등을 함께 평가합니다 
  * 이미지에서처럼 Bitmap Index Scan과 Heap Scan을 조합하여 최적의 실행 계획을 만듭니다
* 실시간 피드백
  * 실제 실행 결과를 통해 통계 정보가 지속적으로 업데이트됩니다 
  * ANALYZE 작업이 주기적으로 실행되어 통계 정보를 갱신합니다 
  * 이를 통해 시간이 지날수록 더 정확한 예측이 가능해집니다

### Explain 도구
<hr/>

* 쿼리 실행계획을 확인하는 도구
* 실행쿼리의 문제점과 성능상에 문제가 되는 수행단계를 확인가능 - 쿼리 튜닝의 시작
```
drop table t1;
drop table t2;

create table t1 (c1 int, c2 int);
create table t2 (c1 int, c2 char(100));

insert into t1
select i, mod(i, 100) + 1 from generate_series(1, 10000) a(i);

insert into t2
select mod(generate_series(1, 1000000), 10000) + 1, 'dummy';

analyse t1;
analyse t2;
```

#### Explain 사용모드
<hr/>

##### 예측모드

* 실제 수행은 하지 않고 예상 실행 계획 제공
* 쿼리앞에 explain 붙이면 예측모드로 실행
```
explain select * from t2;

+------------------------------------------------------------+
|QUERY PLAN                                                  |
+------------------------------------------------------------+
|Seq Scan on t2  (cost=0.00..27242.00 rows=1000000 width=105)|
+------------------------------------------------------------+
```

##### 실행모드

* 실제 수행을 한 후 실행 계획, 수행시간, IO 블록수를 제공
* DML 수행시 데이터 변경에 주의
* DML 에 explain analyze 를 보고싶으면 '\set AUTOCOMMIT off' 사용, 테스트 후 rollback 수행
* explain analyze 를 사용하면 단계별 수행시간, 쿼리 파싱 시간, 전체 수행시간 제공, 쿼리결과 미제공
```
explain analyse select * from t2;

+-------------------------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                                   |
+-------------------------------------------------------------------------------------------------------------+
|Seq Scan on t2  (cost=0.00..27242.00 rows=1000000 width=105) (actual time=0.589..93.057 rows=1000000 loops=1)|
|Planning Time: 4.611 ms                                                                                      |
|Execution Time: 138.595 ms                                                                                   |
+-------------------------------------------------------------------------------------------------------------+
```

###### IO 블록수 확인방법

* BUFFERS 옵션을 사용해서 IO 블록수 확인
```
explain (analyse, buffers) select * from t2;

+-------------------------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                                   |
+-------------------------------------------------------------------------------------------------------------+
|Seq Scan on t2  (cost=0.00..27242.00 rows=1000000 width=105) (actual time=0.144..84.215 rows=1000000 loops=1)|
|  Buffers: shared hit=16146 read=1096                                                                        |
|Planning Time: 0.036 ms                                                                                      |
|Execution Time: 136.381 ms                                                                                   |
+-------------------------------------------------------------------------------------------------------------+
```

##### 결과 분석 방법

```
+------------------------------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                                        |
+------------------------------------------------------------------------------------------------------------------+
|Gather  (cost=1000.00..23460.33 rows=100 width=105) (actual time=4.385..73.079 rows=100 loops=1)                  |
|  Workers Planned: 2                                                                                              |
|  Workers Launched: 2                                                                                             |
|  Buffers: shared hit=16065 read=1177                                                                             |
|  ->  Parallel Seq Scan on t2  (cost=0.00..22450.33 rows=42 width=105) (actual time=1.665..40.880 rows=33 loops=3)|
|        Filter: (c1 = 1)                                                                                          |
|        Rows Removed by Filter: 333300                                                                            |
|        Buffers: shared hit=16065 read=1177                                                                       |
|Planning:                                                                                                         |
|  Buffers: shared hit=5                                                                                           |
|Planning Time: 0.065 ms                                                                                           |
|Execution Time: 73.133 ms                                                                                         |
+------------------------------------------------------------------------------------------------------------------+
```
* start up cost : 쿼리 수행 시작 비용
  * 첫번째 레코드를 fetch 하는데 드는 비용
  * 1000.00
* total cost : 쿼리 수행 총 비용
  * 전체 레코드를 fetch 하는데 드는 비용
  * 23460.33
* actual time : 실제 수행시간
  * 첫번째 레코드를 fetch 하는데 걸린 시간, 전체 레코드를 fetch 하는데 걸린 시간 을 제공
  * 단위는 milliseconds(1/1000초)
  * 4.385..73.079
* 예츨 로우와 실제 로우
  * 예측 로우는 옵티마이저가 통계 정보를 이용해서 계산한값
  * 예측 로우와 실제 로우의 차이가 크다면 옵티마이저의 판단이 잘못되었을 가능성이 크다
  * 예측 로우(Estimate cardinality) : 100
  * 실제 로우(Actual cardinality) : 100
* width, Loops
  * width : 레코드의 평균 길이
  * pg_stat 의 avg_width 칼럼을 합산한값 : 105
  * loops : 오퍼레이션의 반복수행 횟수: 1
```
select attname, avg_width from pg_stats where tablename = 't2';
+-------+---------+
|attname|avg_width|
+-------+---------+
|c1     |4        |
|c2     |101      |
+-------+---------+
```
* filter
  * rows removed by filter : 필터 조건에 해당하지 않는 로우수
  * 333300
  * 처리건수에 비해 많은 레코드가 필터조건에 의해 버려질때 인덱스 생성 고려
  * 인덱스 생성후 다시 실행계획 시 remove by filter 가 없어짐
```
create index t2_idx01 on t2(c1);
+-------------------------------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------+
|Bitmap Heap Scan on t2  (cost=5.20..383.60 rows=100 width=105) (actual time=0.037..0.163 rows=100 loops=1)         |
|  Recheck Cond: (c1 = 1)                                                                                           |
|  Heap Blocks: exact=100                                                                                           |
|  Buffers: shared hit=103                                                                                          |
|  ->  Bitmap Index Scan on t2_idx01  (cost=0.00..5.17 rows=100 width=0) (actual time=0.020..0.020 rows=100 loops=1)|
|        Index Cond: (c1 = 1)                                                                                       |
|        Buffers: shared hit=3                                                                                      |
|Planning Time: 0.096 ms                                                                                            |
|Execution Time: 0.184 ms                                                                                           |
+-------------------------------------------------------------------------------------------------------------------+
```
* index cond : 인덱스 엑세스 조건
* recheck cond : 초기 인덱스 스캔 후 실제 데이터에 대해 조건을 다시 확인하는 과정
* buffer : io 횟수
  * shared read : 디스크 read 횟수
  * shared hit : 메모리 read 횟수
  * dirtied : 메모리 read 시 읽은 더티블록 수
  * written : 디스크로 기록한 더티 블록수
* planning time, execution time
  * planning time : 쿼리 파싱 시간
  * execution time : 쿼리 수행 시간
  * 쿼리 실행시간에 쿼리 파싱은 포함하지 않는다
  * 총 2가지를 더한 시간이 쿼리 실행시간

#### 실행계획 읽는 방법

* 원칙
  1. 안쪽부터 읽는다.
  2. 조인시에는 outer 테이블이 위에 위치를 차지한다.

##### 원칙 1 : 안쪽부터 읽는다.
```
drop table t1;

create table t1 (c1 int, dummy char(1000));

insert into t1 select mod(i, 1000) + 1, 'dummy' from generate_series(1, 10000) a(i);

create index t1_idx01 on t1(c1);
analyse t1;

explain select * from t1 where c1 between 1 and 10;
+-----------------------------------------------------------------------+
|QUERY PLAN                                                             |
+-----------------------------------------------------------------------+
|(2)Bitmap Heap Scan on t1  (cost=5.48..363.91 rows=117 width=1008)        |
|  Recheck Cond: ((c1 >= 1) AND (c1 <= 10))                                |
|(1)  ->  Bitmap Index Scan on t1_idx01  (cost=0.00..5.46 rows=117 width=0)|
|        Index Cond: ((c1 >= 1) AND (c1 <= 10))                            |
+-----------------------------------------------------------------------+
```
* (1) -> (2) 순서로 읽는다.

##### 원칙 2 : 조인시에는 outer 테이블이 위에 위치를 차지한다.

* 조인순서를 파악할떄 매우 중요
* 오라클은 먼저 엑세스 되는 테이블을 위에 위치 시킨다.

|조인방법|   outer 테이블   |  inner 테이블  | 먼저 엑세스 되는 테이블 |
|:-----:|:-------------:|:-----------:|:-------------:|
|NL 조인 | Driving 테이블 | Inner 테이블 |  Outer 테이블  |
|Merge 조인 |  두번째 소팅 테이블   | 첫번째 소팅 테이블  |  Inner 테이블  |
|Hash 조인 |  Probe 테이블   | Build 테이블   |  Inner 테이블  |

##### NL 조인

```
drop table t1;
drop table t2;
create table t1 (c1 int, dummy char(1000));
create table t2 (c1 int, dummy char(1000));
insert into t1 select generate_series(1, 10), 'dummy';
insert into t2 select generate_series(1, 10000), 'dummy';

create index t2_idx01 on t2(c1);

analyse t1;
analyse t2;

set enable_mergejoin = off;
set enable_hashjoin = off;

explain select * from t1, t2 where t1.c1 = t2.c1;
+--------------------------------------------------------------------------+
|QUERY PLAN                                                                |
+--------------------------------------------------------------------------+
|Nested Loop  (cost=0.29..81.22 rows=10 width=2016)                        |
|(1)-> Seq Scan on t1  (cost=0.00..2.10 rows=10 width=1008)                |
|(2)-> Index Scan using t2_idx01 on t2  (cost=0.29..7.90 rows=1 width=1008)|
|        Index Cond: (c1 = t1.c1)                                          |
+--------------------------------------------------------------------------+
```
* (1) -> (2) 순서로 읽는다.
* outer 테이블 t1 을 seq scan
* 1단계에서 리턴된 레코드 마다 t2_idx01 인덱스를 이용하여 inner 테이블 t2 에 엑세스
```
drop table t3;
create table t3 (c1 int, dummy char(1000));
insert into t3 select generate_series(1, 10000), 'dummy';
create index t3_idx01 on t3(c1);
analyse t3;
explain select * from t1 a, t2 b, t3 c where a.c1 = b.c1 and b.c1 = c.c1;
+----------------------------------------------------------------------------------+
|QUERY PLAN                                                                        |
+----------------------------------------------------------------------------------+
|Nested Loop  (cost=0.57..90.21 rows=10 width=3024)                                |
|  Join Filter: (c.c1 = a.c1)                                                      |
|(3)-> Nested Loop  (cost=0.29..81.22 rows=10 width=2016)                          |
|(1)     ->  Seq Scan on t1 a  (cost=0.00..2.10 rows=10 width=1008)                |
|(2)     ->  Index Scan using t2_idx01 on t2 b  (cost=0.29..7.90 rows=1 width=1008)|
|              Index Cond: (c1 = a.c1)                                             |
|(4)-> Index Scan using t3_idx01 on t3 c  (cost=0.29..0.89 rows=1 width=1008)      |
|        Index Cond: (c1 = b.c1)                                                   |
+----------------------------------------------------------------------------------+
```
* 3개 테이블 조인시 (1) -> (2) -> (3) -> (4) 순서로 읽는다.
* outer 테이블 t1 을 seq scan
* t2_idx01 인덱스를 이용하여 inner 테이블 t2 에 엑세스
* NL 결과가 outer 데이터 소스가 됨
* 리턴된 레코드 마다 t3_idx01 인덱스를 이용하여 inner 테이블 t3 에 엑세스

##### Hash 조인

```
set enable_nestloop = off;
set enable_hashjoin = on;
explain select * from t1, t2 where t1.c1 = t2.c1;
+----------------------------------------------------------------+
|QUERY PLAN                                                      |
+----------------------------------------------------------------+
|Hash Join  (cost=2.23..1568.82 rows=10 width=2016)              |
|  Hash Cond: (t2.c1 = t1.c1)                                    |
|(3)-> Seq Scan on t2  (cost=0.00..1529.00 rows=10000 width=1008)|
|(2)-> Hash  (cost=2.10..2.10 rows=10 width=1008)                |
|(1)     ->  Seq Scan on t1  (cost=0.00..2.10 rows=10 width=1008)|
+----------------------------------------------------------------+
```
* (1) -> (2) -> (3) 순서로 읽는다.
* 옵티마이저가 작은 테이블인 t1 을 hash 테이블로 만들고 스캔
* t2 를 스캔하면서 hash 테이블과 조인
* t1 에 대한 hash 테이블을 만든다
* probe 테이블인 t2 를 스캔하면서 hash 테이블과 조인
```
explain select * from t1 a, t2 b, t3 c where a.c1 = b.c1 and b.c1 = c.c1;
+------------------------------------------------------------------------------+
|QUERY PLAN                                                                    |
+------------------------------------------------------------------------------+
|Hash Join  (cost=1568.95..3135.55 rows=10 width=3024)                         |
|  Hash Cond: (c.c1 = a.c1)                                                    |
|(6)-> Seq Scan on t3 c  (cost=0.00..1529.00 rows=10000 width=1008)            |
|(5)-> Hash  (cost=1568.82..1568.82 rows=10 width=2016)                        |
|(4)     ->  Hash Join  (cost=2.23..1568.82 rows=10 width=2016)                |
|              Hash Cond: (b.c1 = a.c1)                                        |
|(3)           ->  Seq Scan on t2 b  (cost=0.00..1529.00 rows=10000 width=1008)|
|(2)           ->  Hash  (cost=2.10..2.10 rows=10 width=1008)                  |
|(1)                 ->  Seq Scan on t1 a  (cost=0.00..2.10 rows=10 width=1008)|
+------------------------------------------------------------------------------+
```
* (1) -> (2) -> (3) -> (4) -> (5) -> (6) 순서로 읽는다.
* 가장 작은 테이블 t1 을 hash 테이블로 만들고 스캔
* t1 해시 작업 수행
* probe 테이블 t2 를 스캔하면서
* 해시 조인 수행
* 해시 조인 결과에 대한 해시작업 수행
* probe 테이블 t3 를 스캔하면서 해시 조인

##### Merge 조인

```
set enable_nestloop = off;
set enable_hashjoin = off;
set enable_mergejoin = on;
explain select * from t1, t2 where t1.c1 = t2.c1;
+---------------------------------------------------------------------------------+
|QUERY PLAN                                                                       |
+---------------------------------------------------------------------------------+
|Merge Join  (cost=2.55..4.43 rows=10 width=2016)                                 |
|  Merge Cond: (t2.c1 = t1.c1)                                                    |
|  ->  Index Scan using t2_idx01 on t2  (cost=0.29..1702.29 rows=10000 width=1008)|
|  ->  Sort  (cost=2.27..2.29 rows=10 width=1008)                                 |
|        Sort Key: t1.c1                                                          |
|        ->  Seq Scan on t1  (cost=0.00..2.10 rows=10 width=1008)                 |
+---------------------------------------------------------------------------------+
```
```
explain select * from t1 a, t2 b, t3 c where a.c1 = b.c1 and b.c1 = c.c1;
+-----------------------------------------------------------------------------------------+
|QUERY PLAN                                                                               |
+-----------------------------------------------------------------------------------------+
|Merge Join  (cost=2.84..6.57 rows=10 width=3024)                                         |
|  Merge Cond: (a.c1 = c.c1)                                                              |
|  ->  Merge Join  (cost=2.55..4.43 rows=10 width=2016)                                   |
|        Merge Cond: (b.c1 = a.c1)                                                        |
|        ->  Index Scan using t2_idx01 on t2 b  (cost=0.29..1702.29 rows=10000 width=1008)|
|        ->  Sort  (cost=2.27..2.29 rows=10 width=1008)                                   |
|              Sort Key: a.c1                                                             |
|              ->  Seq Scan on t1 a  (cost=0.00..2.10 rows=10 width=1008)                 |
|  ->  Index Scan using t3_idx01 on t3 c  (cost=0.29..1702.29 rows=10000 width=1008)      |
+-----------------------------------------------------------------------------------------+
```

### 쿼리 파싱

* 쿼리 실행 순서는 파싱, 쿼리 재작성, 옵티마이징, 실행으로 나눌수 있다.
* 파싱단계
  * 문법 체크
    * 오타 및 분법 점검 체크
  * 의미 체크
    * 테이블 존재여부, 권한여부 체크
  * 쿼리 재작성
  * 쿼리 최적화
  * 쿼리 실행
* postgresql 은 shared pool 이 없는 대신 backend 프로세스가 sql 정보를 저장

#### plan caching

* 재작성된 query tree 를 backend 프로세스에 저장 하는것
* 쿼리 최적화 단계에서 생성되는 plan tree 는 저장하지 않는다.
* 문법 체크, 의미체크, 쿼리 재작성 단계는 건너뛰지만 쿼리 최적화 단계는 항상 수행

#### plan caching 동작 원리

* plan caching 대상은 prepare statement 와 function 이다.
* literal sql 은 plan caching 대상이 아니다.
* prepare statement 는 명령어 수행 시점에 재작성된 query tree 를 backend 프로세스에 저장
* 이후 execute statement 명령어를 수행하면 문접 체크, 구문체크, 쿼리 재작성 단계를 건너뛰고 최적화 단계를 수행한다.
* 쿼리 최적화 단계 수행 전에 오브젝트 변경, 통계 정보 변경등을 점검하는 revalidation 과정을 수행한다.
* 매번 쿼리 최적화 단계를 수행한다.
* 단점은 쿼리 최적화 시간 소요
* 장점은 bind peeking 이 가능하다.

#### prepare 단계

* 문법체크
* creteCachedPlan 함수 호출
* 의미 체크
* 쿼리 재작성
* completeCachedPlan 함수 호출
* saveCachedPlan 함수 호출
* 재작성된 query tree 를 backend 프로세스에 저장

#### execute 단계

* executeQuery 함수 호출
* getCachedPlan 함수 호출
* 재작성된 query tree 를 가져옴
* revalidation 과정 수행
* buildCachedPlan 함수 호출
* 쿼리 최적화 단계 수행
```postgresql
drop table t1;
create table t1 (c1 char(1), c2 date);

insert into t1 select 'T', to_date('20250106', 'YYYYMMDD') + mod(i, 30) from generate_series(1, 1000000) a(i);
insert into t1 select 'F', to_date('20250106', 'YYYYMMDD') + mod(i, 30) from generate_series(1, 100) a(i);

create index t1_c1 on t1(c1);
create index t1_c2 on t1(c2);

analyse t1;
analyse t2;

prepare stmt1(char) as select count(*) from t1 where c1 = $1;
```
```
+-----------------------------------------------------------------------------------+
|QUERY PLAN                                                                         |
+-----------------------------------------------------------------------------------+
|Finalize Aggregate  (cost=11676.77..11676.78 rows=1 width=8)                       |
|  ->  Gather  (cost=11676.55..11676.76 rows=2 width=8)                             |
|        Workers Planned: 2                                                         |
|        ->  Partial Aggregate  (cost=10676.55..10676.56 rows=1 width=8)            |
|              ->  Parallel Seq Scan on t1  (cost=0.00..9634.85 rows=416680 width=0)|
|                    Filter: (c1 = 'T'::bpchar)                                     |
+-----------------------------------------------------------------------------------+
```
```postgresql
prepare stmt2(char, char) as select count(*) from t1 where c2 between to_date($1, 'YYYYMMDD') and to_date($2, 'YYYYMMDD');

explain execute stmt2('20250106', '20250115');
```
```
+---------------------------------------------------------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                                                                   |
+---------------------------------------------------------------------------------------------------------------------------------------------+
|Finalize Aggregate  (cost=7132.12..7132.13 rows=1 width=8)                                                                                   |
|  ->  Gather  (cost=7131.90..7132.11 rows=2 width=8)                                                                                         |
|        Workers Planned: 2                                                                                                                   |
|        ->  Partial Aggregate  (cost=6131.90..6131.91 rows=1 width=8)                                                                        |
|              ->  Parallel Index Only Scan using t1_c2 on t1  (cost=0.43..5789.47 rows=136972 width=0)                                       |
|                    Index Cond: ((c2 >= to_date('20250106'::text, 'YYYYMMDD'::text)) AND (c2 <= to_date('20250115'::text, 'YYYYMMDD'::text)))|
+---------------------------------------------------------------------------------------------------------------------------------------------+
```
* postgresql 은 모든 경우 bind peeking 을 수행 함으로 히스토그램 정보를 참조해서 실행계획 수립

#### literal sql vs bind sql 성능차이

```postgresql
drop table t1;
drop table t2;
create table t1 (c1 integer, c2 integer);
create table t2 (c1 integer);

\timing on
do $$
    declare i integer;
        begin
            for i in 1..1000000 loop
                execute 'update t1 set c2=c2+1 where c1='||i||' and exists (select 1 from t2 where t2.c1=t1.c1)';
            end loop;
        end;
$$;

47 s 256 ms 후 완료
```
```postgresql
\timing on
do $$
    declare i integer;
        begin
            for i in 1..1000000 loop
                update t1 set c2=c2+1 where c1=i and exists(select 1 from t2 where t2.c1=t1.c1);
            end loop;
        end;
$$;

6 s 967 ms 후 완료
```

### 액세스 방법
<hr/>

* 쿼리 튜닝에 있어서 중요한 3가지는 액세스 방법, 조인 방법, 조인순서이다

#### seq scan
<hr/>

* 테이블을 full scan 하는 방법
* 인덱스가 존재하지 않거나 존재하더라도 읽어야 할 범위가 넓은 경우에 선택
* 테이블 크기에 따라 bulk read 전략을 사용하고 이때 ring buffer 를 사용

#### index scan
<hr/>

* leaf 블록에 저장된 키를 이용해서 테이블 레코드를 액세스 하는 방법
* 인덱스 키 순서대로 출력
* 레코드 정렬 상태에 따라서 테이블 블록 액세스 횟수가 달라짐
```postgresql
drop table t1;
create table t1 (a int, dummy char(100));
insert into t1 select generate_series(1, 58000), 'dummy';
create index t1_a on t1(a);
analyse t1;

explain (costs false, analyze, buffers)
select * from t1 where a between 1 and 4000;
```
```
+------------------------------------------------------------------------+
|QUERY PLAN                                                              |
+------------------------------------------------------------------------+
|Index Scan using t1_a on t1 (actual time=0.019..2.076 rows=4000 loops=1)|
|  Index Cond: ((a >= 1) AND (a <= 4000))                                |
|  Buffers: shared hit=72 read=9                                         |
|Planning:                                                               |
|  Buffers: shared hit=3                                                 |
|Planning Time: 0.093 ms                                                 |
|Execution Time: 2.329 ms                                                |
+------------------------------------------------------------------------+
```

#### bitmap index scan
<hr/>

* 테이블 랜덤 액세스 횟수를 줄이기 위해 고안된 방식
* 옵티마이저가 index scan 과 bitmap index scan 방식을 선택하는 기준은 인덱스 칼럼의 correlation 이다.
* 인덱스와 테이블간 정렬 관계가 불량한 경우 사용
* 액세스할 테이블 블록들을 블록 번호 순으로 정렬후 액세스
* 테이블 랜덤 액세스 횟수가 크게 줄어들고 테이블 블록은 1번씩만 액세스 하게 된다.
* 테이블 블록 번호순으로 액세스 하므로 인덱스 키 순서대로 출력되지 않는다.
```postgresql
drop table t1;
create table t1 (c1 int, dummy char(100));

do $$
  begin
    for i in 1..1000 loop
            for j in 0..57 loop
                    insert into t1 values (i + (j*1000), 'dummy');
              end loop;
      end loop;
  end$$;

create index t1_c1 on t1(c1);
analyse t1;

select relpages, reltuples from pg_class where relname = 't1';

+--------+---------+
|relpages|reltuples|
+--------+---------+
|1000    |58000    |
+--------+---------+

explain (costs false, analyse, buffers) select * from t1 where c1 between 1 and 1000;

+-----------------------------------------------------------------------------+
|QUERY PLAN                                                                   |
+-----------------------------------------------------------------------------+
|Bitmap Heap Scan on t1 (actual time=1.801..2.806 rows=1000 loops=1)          |
|  Recheck Cond: ((c1 >= 1) AND (c1 <= 1000))                                 |
|  Heap Blocks: exact=1000                                                    |
|  Buffers: shared hit=1002 read=2                                            |
|  ->  Bitmap Index Scan on t1_c1 (actual time=1.663..1.664 rows=1000 loops=1)|
|        Index Cond: ((c1 >= 1) AND (c1 <= 1000))                             |
|        Buffers: shared hit=2 read=2                                         |
|Planning:                                                                    |
|  Buffers: shared hit=12 read=2 dirtied=1                                    |
|Planning Time: 3.439 ms                                                      |
|Execution Time: 2.911 ms                                                     |
+-----------------------------------------------------------------------------+

explain (costs false, analyse, buffers) select * from t1 where c1 between 1 and 4000;

+-----------------------------------------------------------------------------+
|QUERY PLAN                                                                   |
+-----------------------------------------------------------------------------+
|Bitmap Heap Scan on t1 (actual time=0.772..2.145 rows=4000 loops=1)          |
|  Recheck Cond: ((c1 >= 1) AND (c1 <= 4000))                                 |
|  Heap Blocks: exact=1000                                                    |
|  Buffers: shared hit=1004 read=8                                            |
|  ->  Bitmap Index Scan on t1_c1 (actual time=0.637..0.638 rows=4000 loops=1)|
|        Index Cond: ((c1 >= 1) AND (c1 <= 4000))                             |
|        Buffers: shared hit=4 read=8                                         |
|Planning:                                                                    |
|  Buffers: shared hit=3                                                      |
|Planning Time: 0.107 ms                                                      |
|Execution Time: 2.418 ms                                                     |
+-----------------------------------------------------------------------------+

set enable_bitmapscan=off;
set enable_seqscan=off;
explain (costs false, analyse, buffers) select * from t1 where c1 between 1 and 4000;

+-------------------------------------------------------------------------+
|QUERY PLAN                                                               |
+-------------------------------------------------------------------------+
|Index Scan using t1_c1 on t1 (actual time=0.018..2.057 rows=4000 loops=1)|
|  Index Cond: ((c1 >= 1) AND (c1 <= 4000))                               |
|  Buffers: shared hit=4012                                               |
|Planning:                                                                |
|  Buffers: shared hit=3                                                  |
|Planning Time: 0.088 ms                                                  |
|Execution Time: 2.272 ms                                                 |
+-------------------------------------------------------------------------+
```
* bitmap index scan 을 사용하면 테이블 블록 액세스를 최소화 할수 있다.
* bitmap index scan 수행절차
  * 조건에 만족하는 인덱스키 검색
  * work_mem 공간내 여유가 있으면 exact 모드 수행
    * exact 모드는 pageTableEntry 구초제 1개가 블록 1개를 관리한다.
    * exact 모드는 비트 1개가 레코드 1개를 가르킨다
  * work_mem 공간내 여유가 없으면 lossy 모드 수행
    * lossy 모드는 pageTableEntry 구초제 1개가 chunk 1개를 관리한다.
    * lossy 모드는 비트 1개가 블록 1개를 가리킨다.
  * 비트맵 작업이 완료 된후 블록 번호순으로 pageTableEntry 를 정렬
  * exact 모드로 처리된 블록들은 비트맵 정보를 이용해서 레코드 직접 액세스
  * lossy 모드로 처리된 블록들은 블록을 액세스 하면서 레코드를 찾음
  * lossy 모드인 경우 블록내 레코드를 스캔하면서 조건에 맞는 레코드를 추출

#### cluster
<hr/>

* cluster 명령어를 사용해서 테이블을 정렬된 상태로 저장
```postgresql
cluster t3 using t3_idx01;
analyze t3;
```
* cluster 명령어는 DML, select 와도 호환이 없어 사용자 접속을 막아야 한다.
* pg_repack 를 사용하면 online 으로 cluster 를 수행할수 있다, 명령어 수행 직후와 완료 직전에만 테이블 exclusive lock 이 걸린다.
* cluster 작업은 특정 인덱스 기준으로 테이블 레코드를 정렬하는 것이므로 다른 인덱스와 테이블 간의 정렬 상태는 나빠질수 있다.

#### index only scan
<hr/>

* 테이블을 액세스 하지 않고 인덱스 만 앱세스 해서 쿼리를 수행하는 방식
* 9.2 버전 부터 제공
* 커버링 인덱스를 이용한 인덱스 스캔방식
```postgresql
drop table t3;
create table t3 (c1 int, c2 int, c3 int, dummy char(100));
insert into t3 select i, i, i, 'dummy' from generate_series(1, 10000) i;

create index t3_idx on t3(c1, c2);
analyze t3;

explain (costs false, analyze, buffers)
select count(*) from t3 where c1 between 1 and 1000 and c2 <> 0;

+-------------------------------------------------------------------------------------+
|QUERY PLAN                                                                           |
+-------------------------------------------------------------------------------------+
|Aggregate (actual time=0.604..0.605 rows=1 loops=1)                                  |
|  Buffers: shared hit=3 read=2                                                       |
|  ->  Index Only Scan using t3_idx on t3 (actual time=0.027..0.484 rows=1000 loops=1)|
|        Index Cond: ((c1 >= 1) AND (c1 <= 1000))                                     |
|        Filter: (c2 <> 0)                                                            |
|        Heap Fetches: 0                                                              |
|        Buffers: shared hit=3 read=2                                                 |
|Planning:                                                                            |
|  Buffers: shared hit=11 read=3                                                      |
|Planning Time: 1.705 ms                                                              |
|Execution Time: 0.667 ms                                                             |
+-------------------------------------------------------------------------------------+
```
* 커버링 인덱스가 존재하여 index only scan 이 수행됨
* 그러나 항상 index only scan 이 수행되는것은 아니다.

##### index only scan 시 vacuum 필요성
<hr/>

* index only scan 을 수행 하기 위해선 vacuum 을 수행해야 한다.
```postgresql
vacuum t3;

+-------------------------------------------------------------------------------------+
|QUERY PLAN                                                                           |
+-------------------------------------------------------------------------------------+
|Aggregate (actual time=0.277..0.278 rows=1 loops=1)                                  |
|  Buffers: shared hit=5                                                              |
|  ->  Index Only Scan using t3_idx on t3 (actual time=0.024..0.175 rows=1000 loops=1)|
|        Index Cond: ((c1 >= 1) AND (c1 <= 1000))                                     |
|        Filter: (c2 <> 0)                                                            |
|        Heap Fetches: 0                                                              |
|        Buffers: shared hit=5                                                        |
|Planning:                                                                            |
|  Buffers: shared hit=3                                                              |
|Planning Time: 0.166 ms                                                              |
|Execution Time: 0.305 ms                                                             |
+-------------------------------------------------------------------------------------+
```
```postgresql
create extension pg_visibility;
select * from pg_visibility_map_summary('t3');
+-----------+----------+
|all_visible|all_frozen|
+-----------+----------+
|182        |0         |
+-----------+----------+
```
* index only scan 은 all_visible 가 0 이면 수행하지 않고 vacuum 수행시 비트가 1로 변경되어 index only scan 이 수행된다.

#### Tid scan
<hr/>

* postgresql 는 레코드마다 "{블록번호, 레코드번호}"로 구성된 CTID 값을 가진다.
* Tid scan 은 CTID 를 이용한 액세스 방법
* CTID 값은 테이블 레벨에서 유일한 값이므로 CTID 액세스 방식은 다른 방식보다 빠르다.
```postgresql
drop table t4;
create table t4 (c1 int, c2 int);
insert into t4 select mod(i, 50), i from generate_series(1, 100) i;
select ctid, * from t4 limit 2;
+-----+--+--+
|ctid |c1|c2|
+-----+--+--+
|(0,1)|1 |1 |
|(0,2)|2 |2 |
+-----+--+--+

set enable_seqscan = off;
explain (costs false ,analyse ,buffers )
select * from t4 where CTID='(0,1)';
+--------------------------------------------------------+
|QUERY PLAN                                              |
+--------------------------------------------------------+
|Tid Scan on t4 (actual time=0.026..0.027 rows=1 loops=1)|
|  TID Cond: (ctid = '(0,1)'::tid)                       |
|  Buffers: shared hit=1                                 |
|Planning Time: 0.041 ms                                 |
|Execution Time: 0.038 ms                                |
+--------------------------------------------------------+
```
* tid scan 시 단건 조회
* 실 사용 시에는 거의 사용되지 않는다.

#### 액세스 제어
<hr/>

* hint 를 사용해서 액세스 방법을 제어할수 있다.
* postgresql 은 hint 대신 액세스 on/off 를 사용한다.

|항목|        설명         |
|:--:|:-----------------:|
|enable_seqscan| seq scan 사용 여부 제어 |
|enable_indexscan| index scan 사용 여부 제어 |
|enable_bitmapscan| bitmap index scan 사용 여부 제어 |
|enable_indexonlyscan| index only scan 사용 여부 제어 |
|enable_tidscan| tid scan 사용 여부 제어 |

#### 조인방법
<hr/>

* postgresql 은 3가지 조인방법을 제공
  * nested loop join
  * merge join
  * hash join
* 옵티마이저는 통계정보, 인덱스 정보, 히스토그램 정보를 이용해 적절한 조인 방법 선택
* postgresql 은 정교한 조인 제어 기능은 제공하지 않으나 조인 방법을 제어할수 있는 옵션을 제공

#### nested loop join
<hr/>

* 첫번째 테이블에서 추출된 레코드들을 이용해서 두번째 테이블로 반복적 엑세스 하는 방법
* 첫번째 테이블을 outer 테이블(driving table) 이라고 하고 두번째 테이블을 inner 테이블이라고 한다.
* 루프 횟수 및 inner 테이블에 대한 액세스 효율이 중요하다.
```postgresql
drop table t1;
drop table t2;
drop table t3;
create table t1 (c1 int, c2 int, dummy char(1000));
create table t2 (c1 int, c2 int, dummy char(1000));
create table t3 (c1 int, c2 int, dummy char(1000));

insert into t1 select i, i, 'dummy' from generate_series(1, 10000) as i;
insert into t2 select i, i, 'dummy' from generate_series(1, 10000) as i;
insert into t3 select i, i, 'dummy' from generate_series(1, 1000) as i;

create index t1_c1 on t1(c1);
create index t2_c1 on t2(c1);
create index t3_c1 on t3(c1);

analyse t1;
analyse t2;
analyse t3;

select relname, relpages from pg_class where relname in ('t1', 't2', 't3');

+-------+--------+
|relname|relpages|
+-------+--------+
|t1     |1429    |
|t2     |1429    |
|t3     |143     |
+-------+--------+

explain (costs false , analyze true, buffers true)
select * from t1 a, t2 b, t3 c where a.c1 between 1 and 10 and a.c1 = b.c1 and b.c1 = c.c1;

+-------------------------------------------------------------------------------------+
|QUERY PLAN                                                                           |
+-------------------------------------------------------------------------------------+
|Nested Loop (actual time=0.016..0.055 rows=10 loops=1)                               |
|  Join Filter: (a.c1 = b.c1)                                                         |
|  Buffers: shared hit=64                                                             |
|  ->  Nested Loop (actual time=0.011..0.031 rows=10 loops=1)                         |(3)
|        Buffers: shared hit=34                                                       |
|        ->  Index Scan using t1_c1 on t1 a (actual time=0.006..0.009 rows=10 loops=1)|(1)
|              Index Cond: ((c1 >= 1) AND (c1 <= 10))                                 |
|              Buffers: shared hit=4                                                  |
|        ->  Index Scan using t3_c1 on t3 c (actual time=0.001..0.001 rows=1 loops=10)|(2)
|              Index Cond: (c1 = a.c1)                                                |
|              Buffers: shared hit=30                                                 |
|  ->  Index Scan using t2_c1 on t2 b (actual time=0.001..0.002 rows=1 loops=10)      |(4)
|        Index Cond: (c1 = c.c1)                                                      |
|        Buffers: shared hit=30                                                       |
|Planning:                                                                            |
|  Buffers: shared hit=39                                                             |
|Planning Time: 0.407 ms                                                              |
|Execution Time: 0.074 ms                                                             |
+-------------------------------------------------------------------------------------+
```
* 수행순서 (1) -> (2) -> (3) -> (4) 순서로 읽는다.
* 테이블 액세스 순서 T1 -> T3 -> T2
* t1_c1 인덱스를 이용하여 outer 테이블인 t1 에 엑세스 추출건 10건 루프 횟수 1회
* t3_c1 인덱스를 이용해 inner 테이블인 t3 테이블 액세스 outer 테이블에서 추출된 건수 10건 이므로 10회 반복
* t1, t3 간 NL 조인 수행결과 10건 추출
* t2_c1 인덱스를 이용해 inner 테이블인 t2 액세스 첫번째 루프에서 10건 추출 했으므로 10회 반복
```postgresql
explain (costs false)
select * from t1 a, t2 b, t3 c where a.c1 between 1 and 10 and a.c1 = b.c1 and b.c1 = c.c1 and b.c2 in (10, 20);

+----------------------------------------------------+
|QUERY PLAN                                          |
+----------------------------------------------------+
|Nested Loop                                         |
|  Join Filter: (a.c1 = b.c1)                        |
|  ->  Nested Loop                                   |
|        ->  Index Scan using t1_c1 on t1 a          |
|              Index Cond: ((c1 >= 1) AND (c1 <= 10))|
|        ->  Index Scan using t3_c1 on t3 c          |
|              Index Cond: (c1 = a.c1)               |
|  ->  Index Scan using t2_c1 on t2 b                |
|        Index Cond: (c1 = c.c1)                     |
|        Filter: (c2 = ANY ('{10,20}'::integer[]))   |
+----------------------------------------------------+
```
* t1 -> t2 -> t3 순서로 테이블 액세스
```postgresql
explain (costs false)
select * from t1 a, t2 b, t3 c where a.c1 between 1 and 10 and a.c1 = b.c1 and b.c1+0 = c.c1 and b.c2 in (10, 20) and c.c2 in (10, 20);

+-------------------------------------------------------+
|QUERY PLAN                                             |
+-------------------------------------------------------+
|Nested Loop                                            |
|  ->  Nested Loop                                      |
|        ->  Index Scan using t1_c1 on t1 a             |
|              Index Cond: ((c1 >= 1) AND (c1 <= 10))   |
|        ->  Index Scan using t2_c1 on t2 b             |
|              Index Cond: (c1 = a.c1)                  |
|              Filter: (c2 = ANY ('{10,20}'::integer[]))|
|  ->  Index Scan using t3_c1 on t3 c                   |
|        Index Cond: (c1 = (b.c1 + 0))                  |
|        Filter: (c2 = ANY ('{10,20}'::integer[]))      |
+-------------------------------------------------------+
```
* t1 -> t2 -> t3 순서로 테이블 액세스
* a.c1 = b.c1 조인후 b.c1 = c.c1 조인으로 a.c1 = c.c1 조인 유추 가능하던것
* b.c1+0 = c.c1 조인으로 a.c1 = c.c1 조인 유추 불가능

##### materialize
<hr/>

```postgresql
set enable_hashjoin = off;
set enable_mergejoin = off;
explain (costs false, timing true, analyze true, buffers true)
select * from t1 a, t2 b where a.c1 between 1 and 10 and a.c2 = b.c2 and b.c2 in (10, 20);

+-------------------------------------------------------------------------------+
|QUERY PLAN                                                                     |
+-------------------------------------------------------------------------------+
|Nested Loop (actual time=24.512..24.515 rows=1 loops=1)                        |
|  Join Filter: (a.c2 = b.c2)                                                   |
|  Rows Removed by Join Filter: 19                                              |
|  Buffers: shared hit=2 read=1431                                              |
|  ->  Index Scan using t1_c1 on t1 a (actual time=0.833..0.881 rows=10 loops=1)|
|        Index Cond: ((c1 >= 1) AND (c1 <= 10))                                 |
|        Buffers: shared hit=2 read=2                                           |
|  ->  Materialize (actual time=0.146..2.362 rows=2 loops=10)                   |
|        Buffers: shared read=1429                                              |
|        ->  Seq Scan on t2 b (actual time=1.449..23.607 rows=2 loops=1)        |
|              Filter: (c2 = ANY ('{10,20}'::integer[]))                        |
|              Rows Removed by Filter: 9998                                     |
|              Buffers: shared read=1429                                        |
|Planning:                                                                      |
|  Buffers: shared hit=6                                                        |
|Planning Time: 0.290 ms                                                        |
|Execution Time: 24.540 ms                                                      |
+-------------------------------------------------------------------------------+
```
* materialize 는 inner 테이블을 인덱스가 존재하지 않을때 주로 발
* 조인 순서는 t1 -> t2 순서로 액세스 t2 에 적절한 인덱스가 없어 materialize 를 수행
* materialize 는 inner 테이블 처리 결과를 temp 테이블에 저장하는 방식 t2 에 seq scan 은 1번만 수행
* materialize 는 차선택일뿐 explain 결과에 나타나면 조인 조건 칼럼의 인덱스 생성여부 확인 필요

##### inner 테이블 액세스시 bitmap index scan 사용 이유 
<hr/>

```postgresql
drop table t1;
drop table t2;
create table t1 (c1 int, dummy char(100));
create table t2 (c1 int, dummy char(100));
-- c1 칼럼 기준 t1, t2 는 1:10000 비율로 데이터 생성
insert into t1 select i, 'dummy' from generate_series(1, 1000) as i;
insert into t2 select mod(i, 1000)+1, 'dummy' from generate_series(1, 10000000) as i;

create index t1_idx on t1(c1);
create index t2_idx on t2(c1);

analyze t1;
analyze t2;

select relname, reltuples from pg_class where relname in ('t1', 't2');
+-------+---------+
|relname|reltuples|
+-------+---------+
|t1     |1000     |
|t2     |9999997  |
+-------+---------+
select tablename, attname, correlation from pg_stats where tablename = 't2';
+---------+-------+-------------+
|tablename|attname|correlation  |
+---------+-------+-------------+
|t2       |c1     |-0.0013180748|
|t2       |dummy  |1            |
+---------+-------+-------------+

set enable_hashjoin = off;
set enable_mergejoin = off;
explain (costs false ,analyze ,buffers)
select * from t1 a, t2 b where a.c1 between 1 and 100 and a.c1 = b.c1;
+----------------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                          |
+----------------------------------------------------------------------------------------------------+
|Gather (actual time=18.089..1779.634 rows=1000000 loops=1)                                          |
|  Workers Planned: 2                                                                                |
|  Workers Launched: 2                                                                               |
|  Buffers: shared hit=16601 read=156715                                                             |
|  ->  Nested Loop (actual time=10.300..1697.191 rows=333333 loops=3)                                |
|        Buffers: shared hit=16601 read=156715                                                       |
|        ->  Parallel Seq Scan on t2 b (actual time=0.694..565.041 rows=3333333 loops=3)             |
|              Buffers: shared hit=15699 read=156715                                                 |
|        ->  Memoize (actual time=0.000..0.000 rows=0 loops=10000000)                                |
|              Cache Key: b.c1                                                                       |
|              Cache Mode: logical                                                                   |
|              Hits: 3321472  Misses: 1000  Evictions: 0  Overflows: 0  Memory Usage: 80kB           |
|              Buffers: shared hit=902                                                               |
|              Worker 0:  Hits: 3322168  Misses: 1000  Evictions: 0  Overflows: 0  Memory Usage: 80kB|
|              Worker 1:  Hits: 3353360  Misses: 1000  Evictions: 0  Overflows: 0  Memory Usage: 80kB|
|              ->  Index Scan using t1_idx on t1 a (actual time=0.000..0.000 rows=0 loops=3000)      |
|                    Index Cond: ((c1 = b.c1) AND (c1 >= 1) AND (c1 <= 100))                         |
|                    Buffers: shared hit=902                                                         |
|Planning:                                                                                           |
|  Buffers: shared hit=26 read=3                                                                     |
|Planning Time: 11.335 ms                                                                            |
|Execution Time: 1823.720 ms                                                                         |
+----------------------------------------------------------------------------------------------------+

set enable_hashjoin = off;
set enable_mergejoin = off;
set enable_indexscan = off;
set enable_seqscan = off;
set enable_bitmapscan = on;
explain (costs false ,analyze ,buffers)
select * from t1 a, t2 b where a.c1 between 1 and 100 and a.c1 = b.c1;
+---------------------------------------------------------------------------------------+
|QUERY PLAN                                                                             |
+---------------------------------------------------------------------------------------+
|Nested Loop (actual time=77.349..2328.437 rows=1000000 loops=1)                        |
|  Buffers: shared hit=973510 read=27627 written=1                                      |
|  ->  Bitmap Heap Scan on t1 a (actual time=0.037..0.464 rows=100 loops=1)             |
|        Recheck Cond: ((c1 >= 1) AND (c1 <= 100))                                      |
|        Heap Blocks: exact=2                                                           |
|        Buffers: shared hit=3 read=1                                                   |
|        ->  Bitmap Index Scan on t1_idx (actual time=0.013..0.014 rows=100 loops=1)    |
|              Index Cond: ((c1 >= 1) AND (c1 <= 100))                                  |
|              Buffers: shared hit=2                                                    |
|  ->  Bitmap Heap Scan on t2 b (actual time=3.130..21.918 rows=10000 loops=100)        |
|        Recheck Cond: (a.c1 = c1)                                                      |
|        Heap Blocks: exact=1000000                                                     |
|        Buffers: shared hit=973507 read=27626 written=1                                |
|        ->  Bitmap Index Scan on t2_idx (actual time=0.915..0.915 rows=10000 loops=100)|
|              Index Cond: (c1 = a.c1)                                                  |
|              Buffers: shared hit=283 read=850                                         |
|Planning:                                                                              |
|  Buffers: shared hit=3                                                                |
|Planning Time: 0.151 ms                                                                |
|Execution Time: 2379.459 ms                                                            |
+---------------------------------------------------------------------------------------+
```
* NL 조인 성능은 inner 테이블 액세스시 효율과 밀접한 관계
* inner 테이블 정렬이 불량하면 bitmap index scan 을 사용
* NL 조인시 bitmap index scan 은 레코드마다 수행하여 버퍼 io 감소가 전혀 없고 index scan 보다 느림
* pg_prewarm() 을 이용해 주기적으로 혹은 배치 작업 전 테이블 블록을 로딩할수 있다면 bitmap index scan 을 사용하지 않아도 된다.
* inner 테이블이 정렬되지 않은 상태에서 NL 조인은 index scan 이 유리하다

#### hash join
<hr/>

* 해시조인은 build 와 probe 단계로 수행한다.
* build 단계는 첫번째 테이블의 조인컬럼에 해시 함수를 적용해 해시 테이블 자료 구조에 데이터를 입력하는 단계
* probe 단계는 두번째 테이블을 스캔하면서 조인 칼럼에 같은 해시 함수를 적용하면서 해시 테이블을 검색하는 단계
* 이때 첫번째 테이블을 build 테이블 두번째 테이블을 probe 테이블이라 한다.
* 해시테이블 자료 구조는 backend 프로세스 내 work_mem 메모리 내에 생성되므로 일반적으로 작은 테이블을 build 테이블로 선택한다.
* 해시조인은 in-memory, grace, hybrid 해시 조인으로 구분된다.
* work_mem 내에서 수행할수 있으면 in-memory 해시조인을 수행하고 그렇지 않으면 grace or hybrid 해시조인을 수행한다.
* postgresql 은 hybrid 해시조인을 수행한다. probe 테이블의 데이터가 skew 하면 히스토그램을 참고한다.

##### 해시조인 원리
<hr/>

* 해시 함수(h)를 이용한다.
* x = Y 이면 hash(x) = hash(y) 이다.
* h(x) != h(y) 이면 x != y 이다.
* x !=y 이면 h(x) != h(y) 인것이 가장 이상적
* x != y 이면 h(x) = h(y) 인것이 해시충돌이다.
* 해시조인은 equal 조인에만 사용 가능하다.

##### in-memory 해시조인
<hr/>

* work_mem 내에서 수행할수 있는 해시조인
```postgresql
drop table t1;
drop table t2;
create table t1 (c1 int, dummy char(10));
create table t2 (c1 int, dummy char(10));

insert into t1 select i, 'dummy' from generate_series(1, 10) as i;
insert into t2 select i, 'dummy' from generate_series(1, 1000) as i;

analyze t1;
analyze t2;

explain (costs false ,analyze ,buffers)
select * from t1 a, t2 b where a.c1 = b.c1;

+-----------------------------------------------------------------------+
|QUERY PLAN                                                             |
+-----------------------------------------------------------------------+
|Hash Join (actual time=0.060..0.314 rows=10 loops=1)                   |
|  Hash Cond: (b.c1 = a.c1)                                             |
|  Buffers: shared hit=7                                                |
|  ->  Seq Scan on t2 b (actual time=0.013..0.124 rows=1000 loops=1)    |
|        Buffers: shared hit=6                                          |
|  ->  Hash (actual time=0.013..0.013 rows=10 loops=1)                  |
|        Buckets: 1024  Batches: 1  Memory Usage: 9kB                   |
|        Buffers: shared hit=1                                          |
|        ->  Seq Scan on t1 a (actual time=0.004..0.005 rows=10 loops=1)|
|              Buffers: shared hit=1                                    |
|Planning:                                                              |
|  Buffers: shared hit=64                                               |
|Planning Time: 1.792 ms                                                |
|Execution Time: 0.347 ms                                               |
+-----------------------------------------------------------------------+
```
* buckets: 해시테이블 버킷수 최소 1024
* batches: in-memory 해시조인 처리한 경우 1 그렇지 않으면 2 이상
* memory usage: work_mem 메모리 사용량

##### grace, hybrid 해시조인
<hr/>

* build 테이블이 너무 크면 build 테이블을 여러개의 논리적인 파티션으로 나눈후 build 를 여러번 수행, probe 단계를 여러번 반복해서 읽는다 -> classic 해시조인
* grace 해시조인은 
  * build 테이블과 probe 테이블에 동일한 해시 함수 적용 N 개의 논리적 파티션 생성
  * 위 결과로 build 파티션 N 개, probe 파티션 N 개 생성 후 temporary 테이블스페이스 저장
  * build 파티션 0과 probe 파티션 0해시조인 이후 n-1 파티션까지 차례로 해시조인
* grace 해시조인은 probe 테이블에 1회만 액세스 classic 해시조인 보다 빠르나 temporary 테이블스페이스 추가공간 사용
* hybrid 해시조인은 build 파티션, probe 파티션 0번을 temporary 테이블스페이스에 저장 하지 않고 work_mem 내에 저장하여 수행
  * build 테이블을 몇개 파티션으로 나눌지 결정
  * build 테이블 읽고 0번 파티션 해당하는 레코드에 대한 build 수행 나머지 파티션 temporary 테이블스페이스에 저장
  * probe 테이블 읽고 0번 파티션에 대한 probe 수행 나머지 파티션 temporary 테이블스페이스에 저장
  * 0번을 build 테이블 0번을 probe 테이블로 해시조인
  * 이후 다음 파티션을 차례로 해시조인 여러번 해시 조인을 수행하는것을 multi-batch 라고 한다.
```postgresql
drop table t1;
drop table t2;
create table t1 (c1 int, dummy char(10));
create table t2 (c1 int, dummy char(10));

insert into t1 select generate_series(1, 100000), 'dummy';
insert into t2 select mod(generate_series(1, 400000), 100000)+1, 'dummy';

analyze t1;
analyze t2;

set work_mem ='1MB';
explain (costs false ,analyze ,buffers)
select * from t1 a, t2 b where a.c1 = b.c1;

+---------------------------------------------------------------------------+
|QUERY PLAN                                                                 |
+---------------------------------------------------------------------------+
|Hash Join (actual time=139.433..764.243 rows=400000 loops=1)               |
|  Hash Cond: (b.c1 = a.c1)                                                 |
|  Buffers: shared hit=2704, temp read=1605 written=1605                    |
|  ->  Seq Scan on t2 b (actual time=0.012..32.193 rows=400000 loops=1)     |
|        Buffers: shared hit=2163                                           |
|  ->  Hash (actual time=138.585..138.587 rows=100000 loops=1)              |
|        Buckets: 65536  Batches: 4  Memory Usage: 1661kB                   |
|        Buffers: shared hit=541, temp written=319                          |
|        ->  Seq Scan on t1 a (actual time=0.007..9.176 rows=100000 loops=1)|
|              Buffers: shared hit=541                                      |
|Planning:                                                                  |
|  Buffers: shared hit=16                                                   |
|Planning Time: 3.983 ms                                                    |
|Execution Time: 783.205 ms                                                 |
+---------------------------------------------------------------------------+
```
* build 시 35536 개 버킷생성 1661KB 메모리 사용 4 batch 수행 build 와 probe temp IO 발생

##### skew 데이터 촤적화(histojoin)

* build input 이 work_mem 초과하여 multi-batch 수행
* probe 데이터가 skew 되어있을 경우(ex.천만건중 1~9가 100만건 90%)
* 이런 경우 skew 한 데이터를 temporary 테이블스페이스에 저장하면 대량 temp IO 발생 하여 histojoin 을 사용한다.
* 히스토그램을 이용한 hybrid 해시조인 이며 MCV(most common value) 를 확인후 MCV 데이터를 별도 해시 버킷에 저장해 temp io 제거
```postgresql
drop table t1;
drop table t2;
create table t1 (c1 int, dummy char(10));
create table t2 (c1 int, dummy char(10));

insert into t1 select generate_series(1, 100000), 'dummy';
insert into t2 select mod(generate_series(1, 9000000), 9)+1, 'dummy';
insert into t2 select generate_series(10, 1000009), 'dummy';

analyze t1;
analyze t2;

select most_common_vals from pg_stats where tablename = 't2' and attname = 'c1';

+-------------------+
|most_common_vals   |
+-------------------+
|{8,7,5,2,6,3,1,4,9}|
+-------------------+

select relpages from pg_class where relname = 't2';

+--------+
|relpages|
+--------+
|54055   |
+--------+

set work_mem = '1MB';
explain (costs false ,analyze ,buffers)
select * from t1 a, t2 b where a.c1 = b.c1;
set work_mem = '4MB';

+-----------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                     |
+-----------------------------------------------------------------------------------------------+
|Hash Join (actual time=197.729..10183.251 rows=9099991 loops=1)                                |
|  Hash Cond: (b.c1 = a.c1)                                                                     |
|  Buffers: shared hit=16007 read=38589 dirtied=18796 written=17351, temp read=3527 written=3527|
|  ->  Seq Scan on t2 b (actual time=0.297..6030.172 rows=10000000 loops=1)                     |
|        Buffers: shared hit=15751 read=38304 dirtied=18796 written=17351                       |
|  ->  Hash (actual time=197.361..197.362 rows=100000 loops=1)                                  |
|        Buckets: 65536  Batches: 4  Memory Usage: 1662kB                                       |
|        Buffers: shared hit=256 read=285, temp written=319                                     |
|        ->  Seq Scan on t1 a (actual time=0.228..14.191 rows=100000 loops=1)                   |
|              Buffers: shared hit=256 read=285                                                 |
|Planning:                                                                                      |
|  Buffers: shared hit=16                                                                       |
|Planning Time: 28.938 ms                                                                       |
|Execution Time: 10611.550 ms                                                                   |
+-----------------------------------------------------------------------------------------------+
```
* temp read=3527 temp write=3527 temp io 발생
* 기존 테이블 대비 매우 작은 io 발생, skew 최적화 효과

### outer 조인
<hr/>

* outer 조인은 조인 성공 여부와 무관하게 한쪽 집합의 레코드를 모두 출력하는 방식
* Postgresql 은 ANSI SQL 표준에 따라 outer 조인을 수행한다.
```postgresql
create table t1 (c1 int, dummy char(10));
create table t2 (c1 int, dummy char(10));
insert into t1 values (1, 'dummy');
insert into t2 values (1, 'dummy');
insert into t1 values (2, 'dummy');

select a.c1, b.c1
from t1 a left join t2 b on a.c1 = b.c1;
+--+----+
|c1|c1  |
+--+----+
|1 |1   |
|2 |null|
+--+----+
select a.c1, b.c1
from t1 a left join t2 b on a.c1 = b.c1 and a.c1 = 1;
+--+----+
|c1|c1  |
+--+----+
|1 |1   |
|2 |null|
+--+----+
select a.c1, b.c1
from t1 a left join t2 b on a.c1 = b.c1 and a.c1 = 2;
+--+----+
|c1|c1  |
+--+----+
|1 |null|
|2 |null|
+--+----+
select a.c1, b.c1
from t1 a left join t2 b on a.c1 = b.c1
where a.c1 = 1;
+--+--+
|c1|c1|
+--+--+
|1 |1 |
+--+--+
select a.c1, b.c1
from t1 a left join t2 b on a.c1 = b.c1
where a.c1 = 2;
+--+----+
|c1|c1  |
+--+----+
|2 |null|
+--+----+
```

#### NL outer 조인
<hr/>

* NL outer 조인은 기준 테이블을 항상 먼저 DRiving 한다.
```postgresql
drop table t1;
drop table t2;
create table t1 (c1 int, c2 int, dummy char(10));
create table t2 (c1 int, c2 int, dummy char(10));

insert into t1 select i, i, 'dummy' from generate_series(1, 1000000) as i;
insert into t2 select i, i, 'dummy' from generate_series(1, 1000000) as i;

create index t1_c1 on t1(c1);
create index t2_c1 on t2(c1);

create unique index t2_uk on t2(c2);

analyze t1;
analyze t2;

set enable_hashjoin = off;
set enable_mergejoin = off;
set enable_bitmapscan = off;

explain (costs false, analyze, buffers)
select * from t1 a, t2 b
where a.c1 between 1 and 10
  and a.c1 = b.c1
  and b.c2 = 1;
+------------------------------------------------------------------------------+
|QUERY PLAN                                                                    |
+------------------------------------------------------------------------------+
|Nested Loop (actual time=0.547..0.638 rows=1 loops=1)                         |
|  Buffers: shared hit=5 read=3                                                |
|  ->  Index Scan using t2_uk on t2 b (actual time=0.530..0.531 rows=1 loops=1)|
|        Index Cond: (c2 = 1)                                                  |
|        Buffers: shared hit=1 read=3                                          |
|  ->  Index Scan using t1_c1 on t1 a (actual time=0.010..0.099 rows=1 loops=1)|
|        Index Cond: ((c1 = b.c1) AND (c1 >= 1) AND (c1 <= 10))                |
|        Buffers: shared hit=4                                                 |
|Planning:                                                                     |
|  Buffers: shared hit=41 read=3 dirtied=1                                     |
|Planning Time: 2.519 ms                                                       |
|Execution Time: 0.656 ms                                                      |
+------------------------------------------------------------------------------+
```
* t2 테이블을 driving table 로 선택 t2 -> t1 순서로 액세스
* left join 으로 변경하면 t1 테이블 먼저 driving
```postgresql
set enable_material = off;
explain (costs false, analyze, buffers)
select * from t1 a left join t2 b on a.c1 = b.c1 and b.c2 = 1
where a.c1 between 1 and 10;
+-------------------------------------------------------------------------------+
|QUERY PLAN                                                                     |
+-------------------------------------------------------------------------------+
|Nested Loop Left Join (actual time=0.017..0.037 rows=10 loops=1)               |
|  Join Filter: (a.c1 = b.c1)                                                   |
|  Rows Removed by Join Filter: 9                                               |
|  Buffers: shared hit=44                                                       |
|  ->  Index Scan using t1_c1 on t1 a (actual time=0.007..0.010 rows=10 loops=1)|
|        Index Cond: ((c1 >= 1) AND (c1 <= 10))                                 |
|        Buffers: shared hit=4                                                  |
|  ->  Index Scan using t2_uk on t2 b (actual time=0.002..0.002 rows=1 loops=10)|
|        Index Cond: (c2 = 1)                                                   |
|        Buffers: shared hit=40                                                 |
|Planning:                                                                      |
|  Buffers: shared hit=8                                                        |
|Planning Time: 0.161 ms                                                        |
|Execution Time: 0.053 ms                                                       |
+-------------------------------------------------------------------------------+
```
* index drop 시 t1 먼저 driving 하여 NL outer 조인 수행
```postgresql
drop index t1_c1;
drop index t2_c1;

explain (costs false, analyze, buffers)
select * from t1 a left join t2 b on a.c1 = b.c1 and b.c2 = 1
where a.c1 between 1 and 10;
+---------------------------------------------------------------------------------+
|QUERY PLAN                                                                       |
+---------------------------------------------------------------------------------+
|Nested Loop Left Join (actual time=0.230..37.089 rows=10 loops=1)                |
|  Join Filter: (a.c1 = b.c1)                                                     |
|  Rows Removed by Join Filter: 9                                                 |
|  Buffers: shared hit=6410                                                       |
|  ->  Gather (actual time=0.218..37.056 rows=10 loops=1)                         |
|        Workers Planned: 2                                                       |
|        Workers Launched: 2                                                      |
|        Buffers: shared hit=6370                                                 |
|        ->  Parallel Seq Scan on t1 a (actual time=13.893..24.881 rows=3 loops=3)|
|              Filter: ((c1 >= 1) AND (c1 <= 10))                                 |
|              Rows Removed by Filter: 333330                                     |
|              Buffers: shared hit=6370                                           |
|  ->  Index Scan using t2_uk on t2 b (actual time=0.002..0.002 rows=1 loops=10)  |
|        Index Cond: (c2 = 1)                                                     |
|        Buffers: shared hit=40                                                   |
|Planning:                                                                        |
|  Buffers: shared hit=11 dirtied=1                                               |
|Planning Time: 9.946 ms                                                          |
|Execution Time: 37.112 ms                                                        |
+---------------------------------------------------------------------------------+
```
* NL 조인은 항상 기준 테이블을 driving 한다.

#### hash outer 조인
<hr/>

* 해시조인은 outer 조인시 driving table 을 선택하는것이 중요하다.
* 기준 집합이 큰 테이블이 build 테이블이 되면 해시테이블 생성시 많은 메모리를 사용하게 되어 성능이 저하된다.
* outer 조인시 기준집합이 build 테이블이 되는것이 원칙이나 probe input 보다 크면 서로 역활을 바꿔줄수 있다.
```postgresql
create table t1 (c1 int, c2 int, dummy char(10));
create table t2 (c1 int, c2 int, dummy char(10));

insert into t1 select i, i, 'dummy' from generate_series(1, 1000) as i;
insert into t2 select mod(i, 1000) + 1, i, 'dummy' from generate_series(1, 10000000) as i;

analyze t1;
analyze t2;

select relname, relpages from pg_class where relname in ('t1', 't2');
+-------+--------+
|relname|relpages|
+-------+--------+
|t1     |7       |
|t2     |63695   |
+-------+--------+

explain (costs false, analyze, buffers)
select * from t1 a left join t2 b on a.c1 = b.c1;
+-------------------------------------------------------------------------+
|QUERY PLAN                                                               |
+-------------------------------------------------------------------------+
|Hash Right Join (actual time=8.538..3354.078 rows=10000000 loops=1)      |
|  Hash Cond: (b.c1 = a.c1)                                               |
|  Buffers: shared hit=16100 read=47602                                   |
|  ->  Seq Scan on t2 b (actual time=0.204..735.129 rows=10000000 loops=1)|
|        Buffers: shared hit=16100 read=47595                             |
|  ->  Hash (actual time=8.301..8.302 rows=1000 loops=1)                  |
|        Buckets: 1024  Batches: 1  Memory Usage: 58kB                    |
|        Buffers: shared read=7                                           |
|        ->  Seq Scan on t1 a (actual time=0.664..1.407 rows=1000 loops=1)|
|              Buffers: shared read=7                                     |
|Planning:                                                                |
|  Buffers: shared hit=39                                                 |
|Planning Time: 1.363 ms                                                  |
|Execution Time: 3683.000 ms                                              |
+-------------------------------------------------------------------------+
```
* 기준 집합인 t1 이 build 테이블
```postgresql
explain (costs false, analyze, buffers)
select * from t2 b left join t1 a on a.c1 = b.c1;
+-------------------------------------------------------------------------+
|QUERY PLAN                                                               |
+-------------------------------------------------------------------------+
|Hash Left Join (actual time=7.089..3318.181 rows=10000000 loops=1)       |
|  Hash Cond: (b.c1 = a.c1)                                               |
|  Buffers: shared hit=16139 read=47563                                   |
|  ->  Seq Scan on t2 b (actual time=0.310..731.004 rows=10000000 loops=1)|
|        Buffers: shared hit=16132 read=47563                             |
|  ->  Hash (actual time=6.757..6.758 rows=1000 loops=1)                  |
|        Buckets: 1024  Batches: 1  Memory Usage: 58kB                    |
|        Buffers: shared hit=7                                            |
|        ->  Seq Scan on t1 a (actual time=0.010..0.096 rows=1000 loops=1)|
|              Buffers: shared hit=7                                      |
|Planning Time: 0.139 ms                                                  |
|Execution Time: 3643.543 ms                                              |
+-------------------------------------------------------------------------+
```
* 큰테이블이 기준이 된경우 작은 테이블인 t1 이 build 테이블로 선택된다.
* build input 인 t2 를 t1 으로 swap

#### hash left & hash right
<hr/>

* 