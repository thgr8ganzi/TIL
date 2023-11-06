
## POSTGRESQL

------------------

### 명령어

* `SELECT VERSIOM();` : 버전확인
* `CREATE DATABASE <DB명>;` : DB 생성
* 명령문 뒤에 세미콜론(;)은 ANSI SQL 표준이다.
```
CREATE TABLE teachers (
    id bigserial,
    first_name varchar(25),
    last_name varchar(50),
    school varchar(50),
    hire_date date,
    salary numeric
)
```
* `CREATE TABLE <테이블명> (<컬럼명> <데이터타입>, ...);` : 테이블 생성
```
INSERT INTO teachers (first_name, last_name, school, hire_date, salary)
VALUES ('Janet', 'Smith', 'F.D. Roosevelt HS', '2011-10-30', 36200),
       ('Lee', 'Reynolds', 'F.D. Roosevelt HS', '1993-05-22', 65000),
       ('Samuel', 'Cole', 'Myers Middle School', '2005-08-01', 43500),
       ('Betty', 'Diaz', 'Myers Middle School', '2001-10-30', 36200),
       ('Betty', 'Diaz', 'Myers Middle School', '2005-08-30', 43500),
       ('Kathleen', 'Roush', 'F.D Roosevelt HS', '2010-10-22', 38500)
```
* `INSERT INTO <테이블명> (<컬럼명>, ...) VALUES (<값>, ...);` : 테이블에 데이터 삽입
* 
