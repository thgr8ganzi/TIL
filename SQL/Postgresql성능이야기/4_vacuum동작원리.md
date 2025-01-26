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

#### autovacuum_freeze_max_age
<hr/>

```postgresql
create or replace function insert_t1 (v1 int) returns void as $$
begin
    perform dblink('myconn', 'insert into t1 select ' || '''' || v1 || '''');
end;
$$ language plpgsql;

create or replace function loop_insert_t1 (v_begin int, v_end int) returns void as $$
begin
    for i in v_begin..v_end loop
        perform insert_t1(i);
    end loop;
end;
$$ language plpgsql;

create extension pg_visibility;
create extension dblink;

drop table txid_bump_t;
create table txid_bump_t (c1 int);

drop table t1;
create table t1 (c1 int, dummy char(1000));
select dblink_connect('myconn', 'dbname=mydb port=5432 user=user password=password');
+--------------+
|dblink_connect|
+--------------+
|OK            |
+--------------+
select loop_insert_t1(1, 200000);
select 'TABLE' || relname as name, age(relfrozenxid)
from pg_class where relname = 't1'
union all
select 'REC(t1)'||c1 as name, age(xmin) from t1 limit 3;
+--------+------+
|name    |age   |
+--------+------+
|TABLEt1 |200002|
|REC(t1)1|200002|
|REC(t1)2|200001|
+--------+------+
select pid, query from pg_stat_activity;
```

### visibility map
<hr/>

* MVCC 특성때문에 필요한 오브젝트
* visibility map 은 테이블의 블록별 레코드의 가시성 여부를 관리
* 테이블 블록당 2비트로 구성
* all_visible
  * 블록내 모든 레코드가 모든 트랙잭션을 볼수있는 visible 상태면 1 그렇지 않으면 0
  * vacuum 직후 all_visible 이 1 로 변경 그 후 레코드가 1건이라도 변경 되면 0 으로 변경
  * index only scan 방식을 수행하려면 all_visible 이 1 이어야 함
* all_frozen
  * 블록내 모든 레코드가 frozen 이면 1 아니면 0
  * 다음 frozen 작업시에 all_frozen 비트가 0인 블록만 처리
  * all_frozen 비트로 vacuum 성능향상

### HOT(heap only tuple)
<hr/>

* MVCC 모델의 약점을 극복하기 위한 튜닝기법
* MVCC 는 이전 레코드를 테이블 블록내에 저장하는것인데 이를 위해 update -> delete & insert 방식으로 동작
* HOT 은 변경되는 칼럼이 인덱스 칼럼이 아니면 테이블 레코드만 변경(delete & insert)한다.
* 즉 인덱스는 변경하지 않고 테이블내 이전 레코드가 현재 레코드를 가리키도록한다. 이를 hot chain 이라고 한다.
* 만약 같은 레코드를 수차례 변경하면 hot chain 이 길어지는데 이때 hot chain pruning 이 발생
* HOT 은 변경된 레코드가 이전 레코드와 같은 블록에 저장할때만 동작
* 다른 블록에 저장하려면 FILLFACTOR 를 조정하여 HOT 이 동작하도록 유도
```postgresql
drop table t1;
create table t1(c1 int, c2 int) with (fillfactor = 10);

insert into t1 values (1, 1);
insert into t1 select i, i from generate_series(100, 200)i;

create index t1_index on t1(c1);
analyze t1;

select pg_class.relname, pg_class.relpages from pg_class where relname = 't1';
+-------+--------+
|relname|relpages|
+-------+--------+
|t1     |5       |
+-------+--------+
CREATE EXTENSION pageinspect;
select lp, lp_off, t_xmin, t_xmax, t_ctid, t_data from heap_page_items(get_raw_page('t1', 0)) where lp=1;
+--+------+------+------+------+------------------+
|lp|lp_off|t_xmin|t_xmax|t_ctid|t_data            |
+--+------+------+------+------+------------------+
|1 |8160  |200844|0     |(0,1) |0x0100000001000000|
+--+------+------+------+------+------------------+
select lp, lp_off, t_xmin, t_xmax, t_ctid, t_data from heap_page_items(get_raw_page('t1_index', 1)) where lp=1;
+--+------+------+------+------+------+
|lp|lp_off|t_xmin|t_xmax|t_ctid|t_data|
+--+------+------+------+------+------+
|1 |8160  |null  |null  |null  |null  |
+--+------+------+------+------+------+
update t1 set c2 = 2 where c1 = 1;
select lp, lp_off, t_xmin, t_xmax, t_ctid, t_data from heap_page_items(get_raw_page('t1', 0)) where lp in (1, 23);
+--+------+------+------+------+------------------+
|lp|lp_off|t_xmin|t_xmax|t_ctid|t_data            |
+--+------+------+------+------+------------------+
|1 |8160  |200844|200855|(0,23)|0x0100000001000000|
|23|7456  |200855|0     |(0,23)|0x0100000002000000|
+--+------+------+------+------+------------------+
```
* 1차 변경후 lp(line pointer) 23 을 가르키는 hot chain 생성
```postgresql
update t1 set c2 = 3 where c1 = 1;
select lp, lp_off, t_xmin, t_xmax, t_ctid, t_data from heap_page_items(get_raw_page('t1', 0)) where lp in (1, 23, 24);+--+------+------+------+------+------------------+
|lp|lp_off|t_xmin|t_xmax|t_ctid|t_data            |
+--+------+------+------+------+------------------+
|1 |23    |null  |null  |null  |null              |
|23|7488  |200855|200856|(0,24)|0x0100000002000000|
|24|7456  |200856|0     |(0,24)|0x0100000003000000|
+--+------+------+------+------+------------------+
```
* 2차 변경후 lp(1) 은 offset 칼럼을 이용해 lp(23)을 가르키면 모두 null 로 변경
* 이를 통해 hot chain 이 짧게 유지하려는 특성 확인
```postgresql
update t1 set c2 = 4 where c1 = 1;
select lp, lp_off, t_xmin, t_xmax, t_ctid, t_data from heap_page_items(get_raw_page('t1', 0)) where lp in (1, 23, 24, 25);
+--+------+------+------+------+------------------+
|lp|lp_off|t_xmin|t_xmax|t_ctid|t_data            |
+--+------+------+------+------+------------------+
|1 |24    |null  |null  |null  |null              |
|23|7456  |200857|0     |(0,23)|0x0100000004000000|
|24|7488  |200856|200857|(0,23)|0x0100000003000000|
+--+------+------+------+------+------------------+
```
* 3차 변경후 HOT chain 은 길어지지 않고 lp(23) 재사용
```postgresql
select count(*) from t1;
select lp, lp_off, t_xmin, t_xmax, t_ctid, t_data from heap_page_items(get_raw_page('t1', 0)) where lp in (1, 23, 24, 25);
+--+------+------+------+------+------------------+
|lp|lp_off|t_xmin|t_xmax|t_ctid|t_data            |
+--+------+------+------+------+------------------+
|1 |23    |null  |null  |null  |null              |
|23|7488  |200857|0     |(0,23)|0x0100000004000000|
+--+------+------+------+------+------------------+
```
* 스캔 후 single page vacuum 이 수행되어 lp(24) 삭제
* fillfactor 를 비율에 따라 페이지 블록에 몇퍼센트 까지 채울지 정해지고 낮을수록 초기 공간은적은 대신 HOT 이 더 잘 동작