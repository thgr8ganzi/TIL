## microservice

* 하드웨어 중심에서 소프트웨어 중심으로 IT 시스템의 변화
* 분산화된 시스템으로 서비스의 부하가 들어도 어느정도 안전하게 유지 가능
* 시스템이 클라우드로 이전하면서 확장성과 안정성 강화
* Anti-Fragile 시스템 구축
  * Auto Scaling
  * Microservice
  * chaos engineering
  * continuous delivery
* 자동확장성을 가진 시스템
* 전체 서비스를 구성하고있는 개별적이고 독립적인 모듈을 개발하고 배포하여 운용할수 있는 세분화된 서비스
* 시스템이 예측하지 못한 상황이어도 전체 시스템이 무너지지 않고 안정적으로 운영될수 있도록 하는 방법
* 지속적인 통합과 지속적인 배포를 통해 빠르게 시스템을 개선하고 배포할수 있는 방법

### cloud Native Architecture

* 확장 가능한 아키텍처
  * 시스템의 수평적 확장에 유연
  * 확장된 서버로 시스템의 부하 분산, 가용성 보장
  * 시스템 또는, 서비스 애플리케이션 단위의 패키지(컨테이너 기반 패키지)
  * 모니터링
* 탄력적 아키텍처
  * 서비스 생성-통합-배포, 비즈니스 환경 변화에 대응시간 단축
  * 분할된 서비스 구조
  * 무상태 통신 프로토콜
  * 서비스의 추가와 삭제 자동으로 감지
  * 변경된 서비스 요청에 따라 사용자 요청 처리(동적)
* 장애격리
  * 특정 서비스에 오류가 발생해도 다른 서비스에 영향 주지 않음

### cloud native application

* microservice 로 개발
* CI/CD 를 통한 지속적인 통합 및 배포
  * 통합서버, 소스관리, 빌드도구, 테스트 도구
    * Jenkins, Team CI, Travis CI
  * Continuous Delivery
  * Continuous Deployment
    * 카나리 배포, 블루그린 배포
* Devops 문화
  * 개발팀과 운영팀의 협업
* Container 기반의 가상화
  * 적은 리소스를 사용하여 가상화 가능

### 12 FACTORS

* PAS 회사 Heroku 에서 제안한 클라우드 네이티브 애플리케이션 개발 방법론
* 클라우드 네이티브 애플리케이션 개발시 고려해야할 12가지 요소
  1. 코드통합
     2. 버전 관리를 위해 코드를 한곳에서 관리
  2. 종속성의 배제
     3. 각 마이크로서비스는 자체 종속성을 가지고 패키징 전체 시스템에 영향을 주지 않고 변경, 수저 가능
  3. 환경설정 외부관리
     4. 하드코딩 되지 않은 코드 외부에서 작업들 제어
  4. 백업 서비스의 분리
     5. 보조 서비스를 이용하여 기능들을 추가로 가질수 있어야함
  5. 개발, 테스트, 운용 환경 분리
     6. 빌드, 릴리스, 실행환경 분리하여 롤백기능 지원 
  6. 무상태성 프로세스
     7. 각각의 서비스는 분리된체 각각의 서비스에서 운용
  7. 포트바인딩
     8. 각각 서비스는 자체 포트에서 노출되는 인터페이스 및 기능과 연결
  8. 동시성
     9. 동일한 인스턴스 내에선 동시성 제어 가능
  9. 서비스의 올바른 상태 유지
     10. 삭제 가능하고 확장성 가능하고 정상적으로 종료 가능한 서비스
  10. 개발과 운용 환경 통일
      11. 서로 종속적이지 않게 운용하여 개발과 운용간의 차이를 줄임
  11. 로그 분리
      12. 로깅시스템으로 이벤트 스트림으로 처리하고 로그를 분리하여 관리
  12. 관리 프로세스
      13. 운용되는 모든 마이크로 서비스들을 파악하기 위해 적절한 관리도구가 있어야함, 리포팅, 데이터 분석

### 12 FACTORS + 3

* API First
  * API 형태로 서비스를 제공
* Telemetry
  * 모든 지표를 시각화 하고 수치화 하여 관리
* Authentication and Authorization
  * 인증과 권한을 통한 보안

## Monolithic vs Microservice

* Monolithic
  * 모든 업무 로직이 하나의 애플리케이션 형태로 패키지 되어 서비스
  * 애플리케이션에서 사용하는 데이터가 한곳에 모여 참조되어 서비스 되는 형태
  * 전통적인 방식의 개발방법
  * 하나의 애플리케이션으로 구성
  * 개발, 배포, 운영이 단일화
  * 서비스가 커질수록 유지보수가 어려워짐
  * 서비스가 커질수록 배포시간이 길어짐
  * 서비스가 커질수록 장애가 발생할 확률이 높아짐
  * 서비스가 커질수록 확장성이 떨어짐
* Microservice
  * 함께 작동하는 작은 규모의 서비스들이 모여 하나의 애플리케이션을 구성 
  * 서비스를 분리하여 개발, 배포, 운영
  * 서비스간의 의존성이 낮음
  * 서비스간의 통신은 HTTP, REST API
  * 서비스간의 통신은 비동기 방식
  * 서비스간의 통신은 메시지 큐
  * 서비스간의 통신은 이벤트 기반

### MicroService 특징

* challenges
  * 기존에 방식을 상당히 바꿔야함
* small well chosen deployable units
  * 서비스 경계를 잘 구분해서 배포 가능한 단위로 구성
* bounded context
  * 서비스간의 경계를 명확히 구분
* Restful API
  * 서비스간의 통신은 HTTP, REST API
* configuration management
  * 서비스간의 환경설정을 외부에서 관리
* cloud Enabled
  * 클라우드 환경에서 운영 가능
* Dynamic Scale up and down
  * 서비스의 확장성을 유연하게 조절 가능
* CI/CD
  * 지속적인 통합과 배포
* visibility
  * 모니터링, 로깅, 트레이싱

### Everythings should be a microservice?

* Multiple Rates of Chnage
  * 기존 개발 대비 비용, 시간 공수를 받아들일수 있는지
* Independent Life Cycles
  * 각각의 서비스들이 독립적으로 운용될수 있도록 경계가 잘 만들어져 있는가
* Independent Scalability
  * 각각 서비스들이 유지보수 및 확장성이 가능한가
* Isolated Failure
  * 오류들이 독립적으로 발생하게 설계되어 있는지
* Simplify interactions with External Dependencies
  * 외부 종속성과 상호 작용 단순화, 응집력
* Polyglot Programming
  * 다양한 언어로 개발 가능 한지

### Microservice Architecture

* two pizza team
* teams communicating through APU contracts
* Develop, Test and Deploy each service independently
* Consumer Driven Contracts

#### service mesh

* 마이크로서비스 아키텍처를 적용한 시스템의 내부 통신
* 서비스간의 통신을 관리하는 인프라스트럭처 레이어
* 추상화를 통해 복잡한 내부 네트워크 제어

### SOA vs Microservice

* SOA
  * 재사용을 통한 비용절감
  * 공통의 서비스를 ESB 에 모아 사업 측면에서 공통 서비스 형식으로 서비스 제공
* MSA
  * 서비스간 결합도를 낮추어 변화에 능동적으로 대응
  * 각 독립된 서비스가 노출된 REST API 사용

### Spring Cloud

* 마이크로 서비스 아키텍처를 지원하기 위한것
* 스프링 클라우드를 사용하면 환경설정,서비스 검색, 회복성, 프록시 등등 다양한 기능을 제공
* Centralized Configuration
  * 서비스들의 환경설정을 중앙에서 관리
  * spring cloud config
* location transparency
  * 서비스 검색
  * spring cloud eureka
* load balancing
  * 서비스간의 부하분산
  * spring cloud ribbon
  * spring cloud gateway
* Easier REST clients
  * REST API 호출을 쉽게
  * spring cloud openfeign
* Visibility and Monitoring
  * 모니터링
  * spring cloud sleuth
  * spring cloud zipkin
* Fault Tolerance
  * 회복성
  * spring cloud hystrix
  * spring cloud resilience4j