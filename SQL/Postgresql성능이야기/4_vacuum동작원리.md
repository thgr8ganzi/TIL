## Vacuum
<hr/>

* vacuum 은 불필요한 쓰레기 데이터들을 정리하고 정리된 공간을 압축해 디스크 공간 효율성을 높인다

### postgresql MVCC
<hr/>

* MVCC(multi version concurrency control)는 다중 버전 동시성 제어
* 쿼리가 수행한 시점의 데이터 버전을읽을수 있는 기능 제공
* 수행한 시점의 기준은 트랜잭션 ID 이며 1씩 증가
* 쿼리가 시작된 시점의 XID 와 같거나 작은 데이터 버전을 읽는것이 MVCC 의 기본 원리
* 이를 통해 read, write 작업간 블로킹 제거
* mvcc 구현을 위해 이전데이터를 보관해야 하는데 이때 vacuum 이 사용된다

### XID
<hr/>

* XID 는 트랜잭션 ID로 4바이트로 구성되어 있으며 1씩 증가
* MVCC 기본원칙은 쿼리가 시작한 시점의 XID 와 같거나 작은 데이터 버전을 읽는것
* postgresql 은 4바이트 XID 사용이 끝나 wraparound 가 발생하기 전에 이전 XID 를 frozen XID 로 변경하여 문제해결 (anti-wraparound vacuum)

### vacuum 효과
<hr/>

```postgresql
vacuum table_name;
```
* 인덱스를 위한 별도 vacuum 명령어는 없다.
```postgresql
drop table t1;
create table t1 (c1 int);
select txid_current();
+------------+
|txid_current|
+------------+
|799         |
+------------+
insert into t1 values (1);
+------------+
|txid_current|
+------------+
|802         |
+------------+
vacuum t1;
vacuum full t1;
```
* vacuum 을 수행하면 이전 레코드를 삭제하고 테이블내 재활용 할수 있는 공간 생긴다.
* vacuum full 을 수행하면 테이블을 압축하여 디스크 공간을 최대한 확보한다.

### vacuum lock
<hr/>

* vacuum 명령어는 select, DML 과 락 호환성이 . select, DML 이 수행되는 동안 vacuum 이 수행불가
```postgresql
begin;
lock table t1 in row exclusive mode;
vacuum t1;
begin;
lock table t1 in access share mode;
vacuum full t1;
select pid, pg_stat_activity.wait_event_type||'-'||pg_stat_activity.wait_event_type, pg_blocking_pids(pid) holder, pg_stat_activity.query
from pg_stat_activity;
```

### vacuum redo
<hr/>

* vacuum 수행시 대량 redo 발생하면 디스크 IO 증가로 인한 IO 병목 현상 발생 가능
```postgresql
drop table t1;
create table t1 (c1 int, dummy char(500));
insert into t1 select generate_series(1, 1000000), 'dummy';
analyze t1;
select relpages, round(pg_class.relpages*8/1024, 0) "size(MiB)"
from pg_class where relname = 't1';
+--------+---------+
|relpages|size(MiB)|
+--------+---------+
|66667   |520      |
+--------+---------+
update t1 set c1 = c1 * 10;
analyze t1;
select relpages, round(pg_class.relpages*8/1024, 0) "size(MiB)"
from pg_class where relname = 't1';
+--------+---------+
|relpages|size(MiB)|
+--------+---------+
|133334  |1041     |
+--------+---------+
```
* update 수행시 delete & insert 방식으로 동작하기 때문에 테이블 크기가 2배로 증가
* redo 양은 1248MiB 이며, postgresql 복구 메커니증 과 관련
* postgresql 은 체크포인트 발생 이후에 블록에 발생하는 첫번째 변경사항은 블록 단위로 WAL 로그에 기록
* 다음 체크포인트 발생 하기 전까지 레코드 단위로 WAL 로그에 기록 
* full_page_writes 파라미터가 이런 동작 제어하며 기본값 on, off 시 디스크 failure 후 복구 불가능
* 마이그레이션시 full_page_writes 를 off 하면 redo 양이 줄어들어 마이그레이션 시간 단축 가능

### Age
<hr/>

* 테이블 튜플의 나이
* 속성
  * 데이터베이스, 테이블, 레코드별 나이 관리
  * 사용자 데이터베이스 생성시 나이는 template1 데이터 베이스의 나이와 같다, template1 데이터베이스 복제하기 때문
  * 테이블 생성시 나이 1살
  * 레코드 입력시 나이 1살
  * 트랜잭션이 발생할때마다 데이터베이스, 테이블, 레코드 나이가 1살씩 증가
  * 나이 = 현재 XID - 생성 시점 XID
  * 나이가 오래된 테이블과 레코드는 vacuum 대상
  * vacuum 이후 테이블과 레코드 나이는 어려짐
```postgresql
create database mydb2;
select datname, datfrozenxid, age(datfrozenxid) from pg_database
where datname in ('mydb2', 'template1', 'template0');
+---------+------------+---+
|datname  |datfrozenxid|age|
+---------+------------+---+
|template1|731         |84 |
|template0|731         |84 |
|mydb2    |731         |84 |
+---------+------------+---+
```
* 사용자 데이터베이스를 생성하면 template1 데이터베이스의 오브젝트들을 모두 복사하여 template1 데이터베이스의 나이와 같다
```postgresql
create table t1(c1 int, dummy char(100));
select 'DATABASE' || datname as name, age(datfrozenxid) as age from pg_database
where datname = 'mydb'
union all
select 'TABLE' || relname as name, age(relfrozenxid) as age from pg_class
where relname = 't1';
+------------+---+
|name        |age|
+------------+---+
|DATABASEmydb|86 |
|TABLEt1     |1  |
+------------+---+
```
* 테이블 생성시 나이는 1살,이때 데이터베이스 나이 1살 증가
```postgresql
insert into t1 values (1, 'dummy');
select 'DATABASE' || datname as name, age(datfrozenxid) as age from pg_database
where datname = 'mydb'
union all
select 'TABLE' || relname as name, age(relfrozenxid) as age from pg_class
where relname = 't1'
union all
select 'REC(t1)' || c1 as name, age(xmin) as age from t1;
+------------+---+
|name        |age|
+------------+---+
|DATABASEmydb|88 |
|TABLEt1     |3  |
|REC(t1)1    |1  |
+------------+---+
```
* 레코드 입력시 나이는 1살, 이때 테이블, 데이터베이스 나이 1살 증가
* 데이터베이스 나이는 데이터베이스내 어떤 테이블보다 많다
* 테이블 나이는 테이블내 어떤 레코드보다 많다

#### vacuum_freeze_min_age
<hr/>

```postgresql
select name, setting from pg_settings where name like 'vacuum%';
+---------------------------------+----------+
|name                             |setting   |
+---------------------------------+----------+
|vacuum_buffer_usage_limit        |2048      |
|vacuum_cost_delay                |0         |
|vacuum_cost_limit                |200       |
|vacuum_cost_page_dirty           |20        |
|vacuum_cost_page_hit             |1         |
|vacuum_cost_page_miss            |2         |
|vacuum_failsafe_age              |1600000000|
|vacuum_freeze_min_age            |50000000  |
|vacuum_freeze_table_age          |150000000 |
|vacuum_multixact_failsafe_age    |1600000000|
|vacuum_multixact_freeze_min_age  |5000000   |
|vacuum_multixact_freeze_table_age|150000000 |
+---------------------------------+----------+
```
* pg_settings 테이블에서 vacuum 관련 파라미터 확인 가능
* vacuum_freeze_min_age 파라미터를 이용해 vacuum 작업시 xid frozen 대상 레코드 선택

### Autovacuum
<hr/>

* vacuum 작업을 자동으로 수행
* autovacuum off 로 설정해도 anti-wraparound autovacuum 은 수행
* XID frozen 작업을 적절한 시점에 수행하지 못하면 DB 를 사용할수 없을정도로 심각

