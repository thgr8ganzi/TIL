### shared buffer 동작원리

#### shared buffer 3가지 목표

* shared buffer 는 disk io 를 최소화 함으로 io 성능을 향상시키는것
  * 매우큰 버퍼를 빠르게 엑세스
  * 많은 사용자가 동시에 접근할때 경합 최소화
  * 자주 사용되는 블록은 최대한 오랫동안 버퍼내에 있어야함

#### shared buffer 구조

<img src="https://private-user-images.githubusercontent.com/91363333/386836488-9b0c7d0b-c58e-434a-a75c-7053aceaaa9b.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MzE3NTEyOTUsIm5iZiI6MTczMTc1MDk5NSwicGF0aCI6Ii85MTM2MzMzMy8zODY4MzY0ODgtOWIwYzdkMGItYzU4ZS00MzRhLWE3NWMtNzA1M2FjZWFhYTliLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDExMTYlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQxMTE2VDA5NTYzNVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWU3ZDIyOGViODY3OTAwOTFkOTMyNzFlZmFlYTAzNzg0YjUxY2NmMTMyZmVjNDU4MWRjMWM1YmUxOTllMzQ1MjkmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.bSzCVwfVnBtlL2LV54sZy1vo6bstDj3XBKxZetUlEgo">

* 해시테이블
* 해시테이블에 딸린 해시엘리먼트 및 엘리먼트키
* 버퍼 상태를 관리하는 버퍼 디스크럽터
* 실제 블록을 저장하는 버퍼 풀

#### 해시 테이블

* 해시테이블은 메모리내의 버퍼를 관리할때 효과적인 구조
* 해시충돌이 발생하면 성능이 떨어짐
* 해시테이블을 논리적인 N개의 세그먼트로 나누어서 관리하는것을 segmented 해시테이블 이라고하며 postgresql 에서 사용

#### directory

* segmented 해시테이블을 N개의 논리적 해시 세그먼트로 나눈것 따라서 N개로 나눈 각 세그먼트의 시작위치를 가리키는 별도 배열 필요 이것을 디렉토리라 한다
* 디렉토리 기본설정은 256 shared buffer 에 크기에 따라 증가한다.

#### 버퍼파티션

* 디렉토리, 해시세그먼트, 해시테이블 은 shared buffer 내 공유 리소스
* 공유 리소스는 LW(light weight) lock 으로 보호 backend 프로세스가 공유 메모리를 엑세스 하기 위해 락획득해야함
* 락획등은 공유리소스를 보호하지만 락 경합으로 성능 저하 발생할수 있음
* postgresql 은 햐시테이블을 N개의 버퍼파티션을 나누고 버퍼파티션마다 1개의 LW lock 을 할당함
* 9.4 이전 버전은 버퍼파티션 16개 LW 락 16개 -> 9.5 이후 128개 LW 락 128개
* NUM_BUFFER_PARTITIONS 설정으로 버퍼파티션 개수 조정가능

#### 해시엘리먼트

* 엘리먼트는 Next 엘리먼트를 가리키는 포인터와 hashValue 로 구성
* DB 시작 시점에 일정 개수만큼 미리 할당 필요시마다(버퍼할당시) 맨뒤에서부터 꺼내쓰는 방식
* 9.5 이전버너 1개의 freeList 가 해시 엘리멘트 전부 관리 -> 9.5 이후 여러개 freeList 가 관리
* 각 freeList 는 해시엘리먼트 맨뒤 배열을 가르키고 있음

#### 버퍼디스크립터

* 버퍼디스크립터는 버퍼 메타데이터를 관리하기 위한 구조체

#### spin lock, LW lock

* shared buffer 에서 spin lock 과 LW lock 을 사용
* oracle 의 mutex, latch 와 비슷한 역할

|항목 | spin lock | LW lock |
|---|---|---|
|사용부하 | 매우 매우 적음|매우적음|
|context switch | 없음 | 있음 |
|동작방식 | spin | 큐 & 포스트 |
|사용용도|구조체내 변수를 액세스|구조체를 액세스|
|사용모드 | exclusive | share & exclusive |

#### spin lock

* 매우매우 가벼운 락
* 구조체 변수값을 변경할때 구조체 변수도 공유메모리 내에 존재하므로 spin lock 을 사용
* 변수값을 변경하는것과 같은 오퍼레이션은 매우 짧은 시간에 수행되기 때문에 다른 프로세스가 이미 spin 락을 획득하더라도 몇라례 spin 후 락을 획득할수 있음
* TAS(Test & Set)를 인라인 어셈블리어로 구현

#### LW lock

* postgresql 은 큐 & 포스팅 방식을 이용해서 LW lock 을 획득
* 읽기 모드일 경우 LW 락을 share 모드로 획득, 쓰기 모드일 경우 exclusive 모드로 획득
* 락을 획득하지 못할경우 대기 큐에 등록하고 다음 프로세스가 깨워줄때 까지 대기 상태 유지

### shared buffer 에서 버퍼 읽기

* shared buffer 는 해시테이블, 해시 엘리먼트, 버퍼 디스크립터, 버퍼풀 로 구성
* 해시 테이블은 배열 구조이며 해시 충돌을 최소화 하기 위해 segmented 해시테이블을 사용
* 동시성을 높이기 위해 논리적인 파티션으로 나눠서 관리
* 파티션당 lw 락은 1개
* 해시 엘리먼트는 엘리먼트와 엘리먼트 키로 구성
* 엘리먼트는 bufferTag 에 대한 hashvalue 와 다음번 엘리먼트를가리키는 포인터로 구성
* 엘리먼트 키는 bufferTag 와 버퍼 id 를 저장
* bufferTag 란 블록에 대한 주민등록 번호
* bufferTag 는 데이터베이스번호, 테이블스페이스 번호, 오브젝트 번호, fork 번호, 블록번호로 구성
* main 오브젝트 fork 번호는 0, FSM 은 1, VM 은 2
* 버퍼디스크립터는버퍼의 메타정보를 관리하는 구조체 배열, 배열수는 버퍼수와 동일

#### shared buffer 내에 있는 블록 읽기

1. backend 프로세스에서 buffer tag 생성
   2. 생성된 buffer tag 를 이용해서 해시값 계산
   3. 생성된 hash value 를 이용해서 버퍼 파티션 번호 계산
2. 해당 버퍼 파티션에 대한 LW lock shared 모드 획득
3. hashValue 를 이용 해서 해시테이블 버킷번호 계산
   4. 버킷 번호를 해시 세그먼트 번호와 인덱스 번호로 치환
   5. 해시 체인을 따라가며 찾는다.
4. 버퍼 디스크립터 배열에 저장된 PIN 을 설정한다.
5. 버퍼 파티션에 대한 LW 락 해제
6. 버퍼 풀 배열 인덱스 내용 읽기 
7. PIN 해제

#### disk read 가 발생하는 경우

* shared buffer 내에 존재하지 않는 블록은 disk 에서 read 함
* disk read 를 통해 블록을 shared buffer 로 로딩후 버퍼를 읽는다.

##### part-1 버퍼 검색

1. buffer tag 생성
   2. 생성된 buffer tag 를 이용해서 hash value 계산
   3. 생성된 hash value 를 이용해서 버퍼 파티션 번호 계산
2. 해당 버퍼 파티션에 대한 lw lock shared 모드 획득
3. hash value 를 이용해서 해시테이블 버킷 번호를 계산
   4. 버킷 번호를 해시 테이블 세그먼트 번호와 인덱스 번호로 치환
   5. 해시 체인을 따라가며 찾는다. 찾기 실패
4. 버퍼 파티션 락 해제

##### part-2 새 버퍼 할당

5. buffer strategy control 구조체의 first free buffer 값 획득
   6. first free buffer 값 변경을 위해 spin lock 획득
   7. first free buffer 값 변경
6. 버퍼 디스크립터 배열 인덱스에 pin 설정
7. 해당 버퍼 파티션에 대한 lw lock exclusive 모드 획득
8. 해시 엘리먼트 풀에서 엘리먼트 1개 할당
   9. free list 포인트를 이전 엘리먼트로 변경
9. 할당받은 해시 엘리먼트를 해시 체인에 연결후 레코드 복사
10. 버퍼 디스크립터 배열 인덱스에 버퍼 헤드락 설정
    11. usage_count 증가
    12. 버퍼 헤더락 해제
11. 버퍼 파티션에 설정한 lw lock 해제

##### part-3 디스크에서 데이터 읽기

12. buffer io lock array 배열 인덱스에 대한 lw 락을 exclusive 모드로 획득
13. 버퍼 디스크립터 배열 인덱스에 버퍼 레더락을 설정
    14. bm_io_in_progress 설정
    15. 버퍼 레더락 해제
14. 버퍼 풀 배열 인덱스에 블록 로딩
15. 버퍼 디스크립터 배열 인덱스에 버퍼 헤더락 설정
    16. bm_io_in_progress 해제
    17. 버퍼 헤더락 해제
16. buffer io lock array 배열 인덱스에 대한 lw 락 해제
17. 버퍼 풀 배열 인덱스 내용 읽기
18. pin 해제

### buffer replacement 를 위한 clock sweep 알고리즘

* empty buffer 가 없을때 share buffer 내의 버퍼를 디스크에 기록해야할 때 사용
* 디스크에 기록되는 버퍼를 victim 버퍼라고 하고 victim 버퍼를 선정하는 알고리즘을 buffer replacement 알고리즘이라고 함
* shared buffer 의 목적이 disk read 를 최소화 함으로 성능을 향상시키는것이므로 효율적으로 victim 버퍼를 선정하는것이 중요

#### clock sweep 알고리즘

* 이 알고리즘은 덜 사용된 버퍼를 victim 으로 선정하는 NFU(Not Frequently Used) 알고리즘을 기반으로 함
* 덜 사용된 버퍼를 선정하기 위해서 버퍼마다 액세스 된 횟수 관리
* 버퍼 디스크립터 내 state 항목내 usage_count 를 증가시켜서 엑세스 횟수 관리
* BM_MAX_USAGE_COUNT 설정값으로 정의된 수(기본 5)까지만 증가
* clock sweep 알고리즘은 victim 버퍼를 찾기위해 버퍼를 시계 방향으로 탐색
* 버퍼디스크립터 배열은 0번부터 최대인덱스까지 연결하여 논리적 원형태로 만들고 victim 버퍼를 찾으면 반환하고 검색 멈춤 다음검색시 해당 인덱스 다음부터 검색
* sweep 은 검색하면서 청소를 한다는뜻으로 usage_count 를 1 감소 시키는것을 의미
* clock sweep 은 시계 방향으로 돌면서 ref count 와 usage count 가 0이면 victim 으로 선정
* victim 버퍼가 dirty 상태이면 디스크에 기록후 버퍼를 반환

#### 공정한 경쟁
* oracle 의 터치 카운트 알고리즘과 비슷
* 매우짧은 순간 특정 버퍼를 여러번 액세스 하더라고 해당 숫자 이상으로 카운트 하지 않아 공정한 경쟁이 일어난다.
* Postgresql 은 clock sweep 알고리즘이 최대 6차례 순회하기 전에 다시 엑세스 하지 않는다면 victim 으로 선정되고 