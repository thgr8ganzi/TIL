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