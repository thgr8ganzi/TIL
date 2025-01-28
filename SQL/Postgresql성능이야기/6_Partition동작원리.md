## Partition 동작원리
<hr/>

* postgresql 은 oracle 과 같이 다양한 유형의 파티션을 생성하거나 인덱스만 파티션으로 나누는 기능은 제공하지 않는다
* 상속을 이용하므로 global index 를 사용할 수 없다
* 하지만 다차원 레벨의 서브 파티션 생성 기능이나 파티션별 인덱스 생성기능을 이용한 다양한 튜닝 기법 적용 가능
* Postgresql 은 부모 테이블을 생성한 후 부모 테이블의 구조를 상속해 자식 테이블 생성, 물리적으로 보면 각각 다른 테이블

### partition pruning
<hr/>

* 입력조건에 맞는 파티션만 액세스 하는것을 파티션 프루닝이라고 한다
* constraint_exclusion 을 on 또는 partition 으로 설정
  * partition: 파티션 테이블의 check 조건만 검사
  * on: 모든 테이블의 check 조건 검사
  * off: 파티션 pruning 비활성화
* 종류는 range, list, hash, sub 등이 있다

#### Range Partition
<hr/>

* 파티션 생성시 check 조건을 이용하므로 기본적으로 range 파티션과 list 파티션을 생성할 수 있다
* 나머지 연산자를 이용해 해시 파티션 흉내 낼수 있음
```postgresql
create table range_p1(c1 int, logdate date, dummy char(100));

create table range_p1_y201701
(check ( logdate >= DATE '2017-01-01' and logdate < DATE '2017-02-01' ))
inherits (range_p1);

create table range_p1_y201702
(check ( logdate >= DATE '2017-02-01' and logdate < DATE '2017-03-01' ))
inherits (range_p1);

create table range_p1_y201703
(check ( logdate >= DATE '2017-03-01' and logdate < DATE '2017-04-01' ))
inherits (range_p1);

create table range_p1_y201704
(check ( logdate >= DATE '2017-04-01' and logdate < DATE '2017-05-01' ))
inherits (range_p1);
```
* 파티션 테이블을 생성하고 이때 check 조건으로 범위를 지정하고 상속 받을 부모 테이블 지정
```postgresql
create or replace function range_p1_insert_func()
returns trigger as $$
begin
if (new.logdate >= DATE '2017-01-01' and new.logdate < DATE '2017-02-01')
then insert into range_p1_y201701 values (new.*);
elsif (new.logdate >= DATE '2017-02-01' and new.logdate < DATE '2017-03-01')
then insert into range_p1_y201702 values (new.*);
elsif (new.logdate >= DATE '2017-03-01' and new.logdate < DATE '2017-04-01')
then insert into range_p1_y201703 values (new.*);
elsif (new.logdate >= DATE '2017-04-01' and new.logdate < DATE '2017-05-01')
then insert into range_p1_y201704 values (new.*);
else raise exception 'out of range';
end if;
return null;
end;
$$ language plpgsql;

create trigger range_pr_insert_trig
    before insert on range_p1
    for each row execute procedure range_p1_insert_func();
do $$
    begin
        for i in 1..120 loop
                for j in 1..10000 loop
                        insert into range_p1 values
                            (j+(10000*(i-1)), to_date('20170101', 'yyyyMMdd')+i-1, 'dummy');
                    end loop;
            end loop;
    end;
$$;
analyze range_p1_y201701;
analyze range_p1_y201702;
analyze range_p1_y201703;
analyze range_p1_y201704;
select pg_class.relname, pg_class.relpages, pg_class.reltuples
from pg_class where relname like 'range_p1%';
+----------------+--------+---------+
|relname         |relpages|reltuples|
+----------------+--------+---------+
|range_p1        |0       |-1       |
|range_p1_y201701|5345    |310000   |
|range_p1_y201702|4828    |280000   |
|range_p1_y201703|5345    |310000   |
|range_p1_y201704|5173    |300000   |
+----------------+--------+---------+
```
* 파티션된 테이블은 각각 독립적인 테이블이다.
```postgresql
show constraint_exclusion;
+--------------------+
|constraint_exclusion|
+--------------------+
|partition           |
+--------------------+
explain (costs false)
select sum(c1), min(c1), max(c1)
from range_p1
where logdate = to_date('20170112', 'yyyyMMdd');
+-----------------------------------------------------------------------------------------+
|QUERY PLAN                                                                               |
+-----------------------------------------------------------------------------------------+
|Finalize Aggregate                                                                       |
|  ->  Gather                                                                             |
|        Workers Planned: 2                                                               |
|        ->  Partial Aggregate                                                            |
|              ->  Parallel Append                                                        |
|                    ->  Parallel Seq Scan on range_p1_y201701 range_p1_2                 |
|                          Filter: (logdate = to_date('20170112'::text, 'yyyyMMdd'::text))|
|                    ->  Parallel Seq Scan on range_p1_y201703 range_p1_4                 |
|                          Filter: (logdate = to_date('20170112'::text, 'yyyyMMdd'::text))|
|                    ->  Parallel Seq Scan on range_p1_y201704 range_p1_5                 |
|                          Filter: (logdate = to_date('20170112'::text, 'yyyyMMdd'::text))|
|                    ->  Parallel Seq Scan on range_p1_y201702 range_p1_3                 |
|                          Filter: (logdate = to_date('20170112'::text, 'yyyyMMdd'::text))|
|                    ->  Parallel Seq Scan on range_p1 range_p1_1                         |
|                          Filter: (logdate = to_date('20170112'::text, 'yyyyMMdd'::text))|
+-----------------------------------------------------------------------------------------+
```
* 파티션 키 칼럼으로 상수조건을 입력했지만 모든 파티션을 검색하는 것을 확인할 수 있다
```
explain (costs false)
select sum(c1), min(c1), max(c1)
from range_p1
where logdate = date '20170212';
+------------------------------------------------------------------------+
|QUERY PLAN                                                              |
+------------------------------------------------------------------------+
|Finalize Aggregate                                                      |
|  ->  Gather                                                            |
|        Workers Planned: 2                                              |
|        ->  Partial Aggregate                                           |
|              ->  Parallel Append                                       |
|                    ->  Parallel Seq Scan on range_p1_y201702 range_p1_2|
|                          Filter: (logdate = '2017-02-12'::date)        |
|                    ->  Parallel Seq Scan on range_p1 range_p1_1        |
|                          Filter: (logdate = '2017-02-12'::date)        |
+------------------------------------------------------------------------+
```
* check 조건과 동일한 형식 입력시 파티션 프루닝이 발생한다

#### List Partition
<hr/>

* list 파티션은 range 파티션과 동일하게 check 조건을 이용해 생성
```postgresql
create table list_p1 (c1 int, code int, dummy char(100));
create table list_p1_code1 (check ( code = 1 ))inherits (list_p1);
create table list_p1_code2 (check ( code = 2 ))inherits (list_p1);
create table list_p1_code3 (check ( code = 3 ))inherits (list_p1);
create table list_p1_code4 (check ( code = 4 ))inherits (list_p1);

create or replace function list_p1_insert_func()
returns trigger as $$
begin
    if (new.code = 1) then
        insert into list_p1_code1 values (new.*);
    elsif (new.code = 2) then
        insert into list_p1_code2 values (new.*);
    elsif (new.code = 3) then
        insert into list_p1_code3 values (new.*);
    elsif (new.code = 4) then
        insert into list_p1_code4 values (new.*);
    else
        raise exception 'unknown code';
    end if;
    return null;
end;
$$ language plpgsql;

create trigger list_p1_insert_trig
    before insert on list_p1
    for each row execute procedure list_p1_insert_func();

do $$
begin
    for i in 1..4 loop
        for j in 1..300000 loop
            insert into list_p1 values (j, i, 'dummy');
        end loop;
    end loop;
end$$;

analyze list_p1_code1;
analyze list_p1_code2;
analyze list_p1_code3;
analyze list_p1_code4;

select pg_class.relname, pg_class.relpages, pg_class.reltuples
from pg_class where relname like 'list_p1%';
+-------------+--------+---------+
|relname      |relpages|reltuples|
+-------------+--------+---------+
|list_p1      |0       |-1       |
|list_p1_code1|5173    |300000   |
|list_p1_code2|5173    |300000   |
|list_p1_code3|5173    |300000   |
|list_p1_code4|5173    |300000   |
+-------------+--------+---------+
show constraint_exclusion;
+--------------------+
|constraint_exclusion|
+--------------------+
|partition           |
+--------------------+
explain (costs false)
select sum(c1), min(c1), max(c1)
from list_p1
where code = 2;
+--------------------------------------------------------------------+
|QUERY PLAN                                                          |
+--------------------------------------------------------------------+
|Finalize Aggregate                                                  |
|  ->  Gather                                                        |
|        Workers Planned: 2                                          |
|        ->  Partial Aggregate                                       |
|              ->  Parallel Append                                   |
|                    ->  Parallel Seq Scan on list_p1_code2 list_p1_2|
|                          Filter: (code = 2)                        |
|                    ->  Parallel Seq Scan on list_p1 list_p1_1      |
|                          Filter: (code = 2)                        |
+--------------------------------------------------------------------+
```
* list 파티션도 pruning 이 동작

### Hash Partition
<hr/>

* postgresql 은 hash 파티션을 지원하지 않지만 나머지 연산자를 이용해 hash 파티션을 흉내낼 수 있다
```postgresql
create table hash_p1 (c1 int, code int, dummy char(100));
create table hash_p1_code1 (check ( code % 4 = 1 )) inherits (hash_p1);
create table hash_p1_code2 (check ( code % 4 = 2 )) inherits (hash_p1);
create table hash_p1_code3 (check ( code % 4 = 3 )) inherits (hash_p1);
create table hash_p1_code4 (check ( code % 4 = 0 )) inherits (hash_p1);

create or replace function hash_p1_insert_func()
returns trigger as $$
begin
    if (new.code % 4 = 1) then insert into hash_p1_code1 values (new.*);
    elsif (new.code % 4 = 2) then insert into hash_p1_code2 values (new.*);
    elsif (new.code % 4 = 3) then insert into hash_p1_code3 values (new.*);
    elsif (new.code % 4 = 0) then insert into hash_p1_code4 values (new.*);
    else raise exception 'code must be between 1 and 4';
    end if;
    return null;
end;
$$ language plpgsql;

create trigger hash_p1_insert_trig
    before insert on hash_p1
    for each row execute procedure hash_p1_insert_func();

do $$
begin
    for i in 1..1200000 loop
        insert into hash_p1 values (i, i, 'dummy');
    end loop;
end$$;

analyze hash_p1_code1;
analyze hash_p1_code2;
analyze hash_p1_code3;
analyze hash_p1_code4;

select pg_class.relname, pg_class.relpages, pg_class.reltuples
from pg_class where pg_class.relname like 'hash_p1e%';
+-------------+--------+---------+
|relname      |relpages|reltuples|
+-------------+--------+---------+
|hash_p1      |0       |-1       |
|hash_p1_code1|5173    |300000   |
|hash_p1_code2|5173    |300000   |
|hash_p1_code3|5173    |300000   |
|hash_p1_code4|5173    |300000   |
+-------------+--------+---------+
show constraint_exclusion;
+--------------------+
|constraint_exclusion|
+--------------------+
|partition           |
+--------------------+
explain (costs false )
select sum(c1), min(c1), max(c1)
from hash_p1
where code = 100;
+--------------------------------------------------------------------+
|QUERY PLAN                                                          |
+--------------------------------------------------------------------+
|Finalize Aggregate                                                  |
|  ->  Gather                                                        |
|        Workers Planned: 2                                          |
|        ->  Partial Aggregate                                       |
|              ->  Parallel Append                                   |
|                    ->  Parallel Seq Scan on hash_p1_code1 hash_p1_2|
|                          Filter: (code = 100)                      |
|                    ->  Parallel Seq Scan on hash_p1_code2 hash_p1_3|
|                          Filter: (code = 100)                      |
|                    ->  Parallel Seq Scan on hash_p1_code3 hash_p1_4|
|                          Filter: (code = 100)                      |
|                    ->  Parallel Seq Scan on hash_p1_code4 hash_p1_5|
|                          Filter: (code = 100)                      |
|                    ->  Parallel Seq Scan on hash_p1 hash_p1_1      |
|                          Filter: (code = 100)                      |
+--------------------------------------------------------------------+
```
* check 미 입력시 pruning 이 동작하지 않음
```postgresql
explain (costs false )
select sum(c1), min(c1), max(c1)
from hash_p1
where code = 100
and (code % 4) = (100 % 4);
explain (costs false )
select sum(c1), min(c1), max(c1)
from hash_p1
where code = 100
  and (code % 4) = (100 % 4);
```

### Sub Partition
<hr/>

* 성능 향상을 위해 파티션을 고려할때 서브 파티션 지원 여부는 중요
* 1차 파티션은 날짜, 2차 파티션은 날짜내 코드별로 나누는 작업이 필요할때가 있기 때문
* postgresql 은 이러한 작업을 매우 쉽게 구현
```postgresql
create table mp1(c1 int, logdate date, code int, dummy char(100));

create table mp1_y201701
(check ( logdate >= date '2017-01-01' and logdate < date '2017-02-01' ))inherits (mp1);

create table mp1_y201702
(check ( logdate >= date '2017-02-01' and logdate < date '2017-03-01' ))inherits (mp1);

create table mp1_y201701_code1 (check ( code = 1 ))inherits (mp1_y201701);
create table mp1_y201701_code2 (check ( code = 2 ))inherits (mp1_y201701);

create table mp1_y201702_code1 (check ( code = 1 ))inherits (mp1_y201702);
create table mp1_y201702_code2 (check ( code = 2 ))inherits (mp1_y201702);

create or replace function mp1_insert_func()
returns trigger as $$
begin
    if ( NEW.logdate >= date '2017-01-01'
             and NEW.logdate < date '2017-02-01' )
        and (new.code = 1)
    then insert into mp1_y201701_code1 values (NEW.*);
    elsif ( NEW.logdate >= date '2017-01-01'
             and NEW.logdate < date '2017-02-01' )
        and (new.code = 2)
    then insert into mp1_y201701_code2 values (NEW.*);
    elsif ( NEW.logdate >= date '2017-02-01'
             and NEW.logdate < date '2017-03-01' )
        and (new.code = 1)
    then insert into mp1_y201702_code1 values (NEW.*);
    elsif ( NEW.logdate >= date '2017-02-01'
             and NEW.logdate < date '2017-03-01' )
        and (new.code = 2)
    then insert into mp1_y201702_code2 values (NEW.*);
    else
        raise exception 'Date out of range.  Fix the mp1_insert_func() function!';
    end if;
    return null;
end;
$$ language plpgsql;

create trigger mp1_insert_trig
    before insert on mp1
    for each row execute procedure mp1_insert_func();

do $$
begin
    for i in 1..59 loop
        for j in 1..2 loop
            for k in 1..10000 loop
                    insert into mp1
                    values (k, to_date('20170101', 'YYYYMMDD'), j, 'dummy');
                end loop;
            end loop;
    end loop;
end $$;

analyze mp1_y201701_code1;
analyze mp1_y201702_code1;
analyze mp1_y201701_code2;
analyze mp1_y201701_code2;

select pg_class.relname, pg_class.relpages, pg_class.reltuples
from pg_class
where pg_class.relname like 'mp1%'

                              +-----------------+--------+---------+
                            |relname          |relpages|reltuples|
                            +-----------------+--------+---------+
                              |mp1              |0       |-1       |
                            |mp1_y201701      |0       |-1       |
                            |mp1_y201702_code2|5091    |280000   |
                            |mp1_y201702      |0       |-1       |
                            |mp1_y201701_code1|5637    |310000   |
                            |mp1_y201701_code2|5637    |310000   |
                            |mp1_y201702_code1|5091    |280000   |
                            +-----------------+--------+---------+
```
```postgresql
SHOW constraint_exclusion;
+--------------------+
|constraint_exclusion|
+--------------------+
|partition           |
+--------------------+
explain (costs false)
select sum(c1), min(c1), max(c1)
from mp1
where logdate between date '20170101'
        and date'20170131';
+-------------------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                             |
+-------------------------------------------------------------------------------------------------------+
|Finalize Aggregate                                                                                     |
|  ->  Gather                                                                                           |
|        Workers Planned: 2                                                                             |
|        ->  Partial Aggregate                                                                          |
|              ->  Parallel Append                                                                      |
|                    ->  Seq Scan on mp1 mp1_1                                                          |
|                          Filter: ((logdate >= '2017-01-01'::date) AND (logdate <= '2017-01-31'::date))|
|                    ->  Seq Scan on mp1_y201701 mp1_2                                                  |
|                          Filter: ((logdate >= '2017-01-01'::date) AND (logdate <= '2017-01-31'::date))|
|                    ->  Parallel Seq Scan on mp1_y201701_code1 mp1_3                                   |
|                          Filter: ((logdate >= '2017-01-01'::date) AND (logdate <= '2017-01-31'::date))|
|                    ->  Parallel Seq Scan on mp1_y201701_code2 mp1_4                                   |
|                          Filter: ((logdate >= '2017-01-01'::date) AND (logdate <= '2017-01-31'::date))|
+-------------------------------------------------------------------------------------------------------+
```
* 1차 check 조건 입력시 1차 파티션 pruning 이 발생
```postgresql
explain (costs false)
select sum(c1), min(c1), max(c1)
from mp1
where logdate between date '20170101'
    and date'20170131'
and code = 2;
+----------------------------------------------------------------------------------------------------------------------+
|QUERY PLAN                                                                                                            |
+----------------------------------------------------------------------------------------------------------------------+
|Finalize Aggregate                                                                                                    |
|  ->  Gather                                                                                                          |
|        Workers Planned: 2                                                                                            |
|        ->  Partial Aggregate                                                                                         |
|              ->  Parallel Append                                                                                     |
|                    ->  Seq Scan on mp1 mp1_1                                                                         |
|                          Filter: ((logdate >= '2017-01-01'::date) AND (logdate <= '2017-01-31'::date) AND (code = 2))|
|                    ->  Seq Scan on mp1_y201701 mp1_2                                                                 |
|                          Filter: ((logdate >= '2017-01-01'::date) AND (logdate <= '2017-01-31'::date) AND (code = 2))|
|                    ->  Parallel Seq Scan on mp1_y201701_code2 mp1_3                                                  |
|                          Filter: ((logdate >= '2017-01-01'::date) AND (logdate <= '2017-01-31'::date) AND (code = 2))|
+----------------------------------------------------------------------------------------------------------------------+
```
* 2차 check 조건 입력시 2차 파티션 pruning 이 발생

### 파티션 인덱스

* postgresql 은 파티션 테이블을 독립적인 테이블로 관리
* 특징
  * 파티션 레벨의 local 인덱스만 지원 전체 테이블 레벨의 global 인덱스는 지원하지 않음
  * 파티션 partial 인덱스 제공
  * unique 인덱스 생성시 파티션 칼럼 포함해야 하는 제약사항 없음
* 자식 테이블은 별로 테이블이라 하나로 묶는 global 개념이 없고 각각 독립적인 테이블이므로 인덱스도 독립적으로 생성
```postgresql
create unique index range_p1_y201701_uk on range_p1_y201701 (c1);
create unique index range_p1_y201702_uk on range_p1_y201702 (c1);
create unique index range_p1_y201703_uk on range_p1_y201703 (c1);
create unique index range_p1_y201704_uk on range_p1_y201704 (c1);

select to_char(logdate, 'yyyymm') yyyymm, min(c1), max(c1)
from range_p1
group by to_char(logdate, 'yyyymm')
order by 1;
+------+------+-------+
|yyyymm|min   |max    |
+------+------+-------+
|201701|1     |310000 |
|201702|310001|590000 |
|201703|590001|900000 |
|201704|900001|1200000|
+------+------+-------+
insert into range_p1 values (1, date '2017-01-01', 'dummy');
[23505] ERROR: duplicate key value violates unique constraint "range_p1_y201701_uk" Detail: Key (c1)=(1) already exists. Where: SQL statement "insert into range_p1_y201701 values (new.*)" PL/ pgSQL function range_p1_insert_func() line 4 at SQL statement
```
* 1번 파티션에 '1' 입력시 1번 파티션에 이미 '1' 이 있어 에러 발생
```postgresql
insert into range_p1 values (1, date '2017-02-01', 'dummy');
mydb.public> insert into range_p1 values (1, date '2017-02-01', 'dummy')
[2025-01-27 11:40:15] completed in 8 ms
```
* 파티션 단위로 unique 보장하기 때문에 2번 파티션에 '1' 입력 가능
```postgresql
insert into range_p1 values (1, date '2017-01-01', 'dummy');
insert into range_p1 values (1, date '2017-02-01', 'dummy');
insert into range_p1 values (1, date '2017-03-01', 'dummy');
insert into range_p1 values (1, date '2017-04-01', 'dummy');

select c1, logdate from range_p1 where c1=1;
+--+----------+
|c1|logdate   |
+--+----------+
|1 |2017-01-01|
|1 |2017-02-01|
|1 |2017-03-01|
|1 |2017-04-01|
+--+----------+
```

* 파티션 키 칼럽을 제외한 특정 칼럼으로 unique를 보장하는 방법 없음

### 파티션 입력 성능 향상 방법
<hr/>

* rule 보다는 trigger 사용
* 자주 입력되는 파티션을 trigger 윗부분에 위치
* 가능하면 파티션 지정해서 입력
```postgresql
create table list_p1 (c1 int, code int, dummy char(100));

create table list_p1_code1 (check ( code = 1 )) inherits (list_p1);
create table list_p1_code2 (check ( code = 2 )) inherits (list_p1);
create table list_p1_code3 (check ( code = 3 )) inherits (list_p1);
create table list_p1_code4 (check ( code = 4 )) inherits (list_p1);

create or replace function list_p1_insert_func()
returns trigger as $$
begin
    if (new.code = 1) then insert into list_p1_code1 values (new.*);
    elsif (new.code = 2) then insert into list_p1_code2 values (new.*);
    elsif (new.code = 3) then insert into list_p1_code3 values (new.*);
    elsif (new.code = 4) then insert into list_p1_code4 values (new.*);
    else raise exception 'insert error';
    end if;
    return null;
end;
$$
language plpgsql;

create trigger list_p1_insert_trig
before insert on list_p1
for each row execute procedure list_p1_insert_func();

create or replace rule list_p1_code1_insert_rule as
    on insert to list_p1 where code = 1
    do instead insert into list_p1_code1 values (new.*);

create or replace rule list_p1_code2_insert_rule as
    on insert to list_p1 where code = 2
    do instead insert into list_p1_code2 values (new.*);

create or replace rule list_p1_code3_insert_rule as
    on insert to list_p1 where code = 3
    do instead insert into list_p1_code3 values (new.*);

create or replace rule list_p1_code4_insert_rule as
    on insert to list_p1 where code = 4
    do instead insert into list_p1_code4 values (new.*);

create or replace function insert_list_p1(v1 int, v2 int) returns
  void as $$
begin
  perform dblink_connect('myconn', 'inert into list_p1 values (' || v1 || ', ' || v2 || ', ''dummy'')');
end;
$$ language plpgsql;

create or replace function loop_insert_list_p1() returns void as $$
begin
  for i in 1..4 loop
          for j in 1..100000 loop
                  perform insert_list_p1(j, i);
            end loop;
    end loop;
end;
$$ language plpgsql;
```
* 데이터 입력시 해당 파티션을 찾기 위한 방법으로 trigger, rule 을 사용할수 있다.
* bulk insert, loop insert 모두 rule 보다 trigger 가 빠르다
```postgresql
-- trigger
\timing
do $$
begin
    for i in 1..4 loop
        for j in 1..100000 loop
            insert into list_p1 values (j, i, 'dummy');
        end loop;
    end loop;
end$$;
completed in 14 s 297 ms

-- rule
do $$
  begin
    for i in 1..4 loop
            for j in 1..100000 loop
                    insert into  list_p1 values (j, i, 'dummy');
              end loop;
      end loop;
  end$$;
completed in 14 s 639 ms
```