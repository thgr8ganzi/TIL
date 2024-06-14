## RESTful API

### API

* Application Programming Interface
* 두개의 소프트웨어 구성 요소가 서로 통신할수 있게 하는 메커니즘

### API 작동 원리

* 일반적으로 클라이언트와 서버 측면에서 설명
* 요청을 보내는 애플리케이션이 클라이언트
* 응답을 보내는 애플리케이션이 서버

#### SOAP

* Simple Object Access Protocol
* 세일즈 포스에서 만든 단순 객체 접근 프로토콜
* XML 기반의 메시지 전송 프로토콜

#### RPC API

* Remote Procedure Call
* 클라이언트가 서버에서 함수나 프로시저를 완료하면 서버가 출력을 클라이언트로 다시 전송

#### Websocket API

* JSON 객체를 사용하여 데이터를 전달하는 또 다른 최산 API
* 클라이언트와 서버간의 양방향 통신 지원
* 서버가 연결된 클라이언트에 콜백 메시지를 전송 할수 있다.

### REST API

* 클라이언트가 서버에 요청을 데이터로 전송
* 클라이언트 입력을 사용하여 내부 함수를 시작하고 출력하여 클라이언트에 반환

### REST API 란

* REST: Representational State Transfer(분산 하이퍼 미디어 시스템) 아키텍처 스타일의 디자인 원칙을 준수하는 API(제약조건 집합)
* Roy Fielding 2000년 박사학위 논문에서 처음 소개
* 기본적으로 하나의 애플리케이션이나 서비스가 다른 애플리케이션이나 서비스 내 리소스에 액세스 할수 있게 해준다.
* HTTP 프로토콜 위에 JSON, HTML, XLT, Python, PHP 또는 일반 텍스트를 통해 몇가지 형식으로 전송
* 헤더, 매개변수, 메타데이터, 권한, URI, 캐싱, 쿠키 등 중요한 식별자 정보 포함
* 자원의 이름 으로 구분하여 해당 자원의 상태를 주고받는 모든것
* 기본적으로 웹의 기존 기술과 HTTP 프로토콜을 활용하기에 웹의 장점을 최대한 활용할수 있는 아키텍처 스타일

### REST API 구성 원칙

* Uniform Interface(균일한 인터페이스)
  * 요청이 어디서 오는지 무관하게 동일한 리소스에 대한 모든 요청은 동일해야한다.
* Client-Server(클라이언트-서버 디커플링)
  * 서로에게 완전히 독립적이어야 한다.(상호작용 x)
  * 클라이언트가 알아야하는 유일한 정보는 URI 이다
  * 서버가 알아야하는 유일한 정보는 클라이언트에서 넘어오는 데이터 이다
* Stateless(무상태성)
  * 서버는 클라이언트 요청과 관련된 데이터를 저장할수 없다.
* Cache(캐싱 가능)
  * 리소스를 클라이언트 또는 서버에서 캐싱할수 있어야 한다.
  * 서버 응답에는 전달된 리소스에 캐싱이 허용되는지 여부가 포함되어야 한다.
* Layered System(계층구조 아키텍처)
  * 호출과 응답이 서로 다른 계층을 통과한다.
  * 앤드포인트 또는 미들웨어 통신하는지 클라이언트나 서버가 알수 없도록 한다.
* Code-On_demand(코드 온디맨드(옵션))
  * 일반적으로 정적 리소스를 전송하지만 특정 상황에 동적 코드를 전송할수 있다.

### Uniform Interface

* identification of resources
  * 리소스가 URI로 식별되어야 한다.
  * 이름을 지닐수 있는 모든 정보, 개념적인 대상
* manipulation of resources through representations
  * 리소스 표현은 HTTP 메시지를 통해 전송되어야 한다.
  * 특정한 상태의 자원을 클라이언트가 주면 서버가 표현해줌
* self-descriptive messages(잘 지켜지지 않음)
  * 메시지는 스스로 설명해야 한다.
  * 보통 REST API 는 목적지가 빠져있어 스스로를 설명할수 없다.
  * Content-Type 의 JSON 이라는 정보외에 JSON 값을 설명할수 없다
* hypermedia as the engine of application state(HATEOAS)(잘 지켜지지 않음)
  * 애플리케이션의 상태는 Hyperlink 를 통해 전이되어야 한다.
  * HTML 의 a 태그를 통해 상태를 전이할수 있지만 JSON 은 link 를 통해 표현할수 있지만 지켜지지 않음

### URI 가 필요한 이유

* 서버와 클라이언트가 각각 독립적으로 진화
* 서버의 기능이 변경되어도 클라이언트를 업데이트할 필요 없음
* REST 를 만들게 된 계기 : 웹의 확장성을 고려하여 만들어짐

### REST 를 따라야 하는가

* 우리는 REST 를 만든사람의 의도를 제대로 사용하지 못함
* 그러나 회사내에서 충분히 논의된 API 는 REST 라고 부를수 있고 어느정도 적용해 사용가능

### 일반적으로 REST API 를 사용하는 법

#### HTTP 메소드

* GET : 리소스를 조회
  * 전달하고 싶은 데이터는 쿼리스트링으로 전달
  * `curl -X GET http://localhost:3000/api/v1/users`
  * http 1.1 이상 버전부터는 body 로 전달 할수는 있음
* POST : 요청 데이터 처리, 주로 등록
  * 메시지 body 를 통해 서버로 요청 데이터 전달
  * `curl -X POST http://localhost:3000/api/v1/users -d '{"name": "John Doe"}' -H "Content-Type: application/json"`
* PUT : 리소스를 업데이트, 리소스 없으면 생성
  * 클라이언트가 리소스의 구체적 전체 경로를 지정해야함 
  * `curl -X PUT http://localhost:3000/api/v1/users/1 -d '{"name": "Jane Doe"}' -H "Content-Type: application/json"`
* DELETE : 리소스 삭제
  * `curl -X DELETE http://localhost:3000/api/v1/users/1`
* PATCH : 리소스 부분 업데이트,(PUT 은 전체 업데이트)
  * `curl -X PATCH http://localhost:3000/api/v1/users/1 -d '{"name": "Jane Doe"}' -H "Content-Type: application/json"`
  * PUT 과 달리 멱등성을 가지지 않음(동일한 요청이 다른 결과 야기)
* HEAD : GET 과 동일하지만 응답시 메시지 부분(body)을 제외하고 상태줄과 헤더만 반환
  * 응답의 상태 코드만 확인할때 사용
  * 서버 응답헤더로 리소스 확인
  * `curl -X OPTIONS http://localhost:3000/api/v1/users`
* OPTIONS : 대상 리소스에 대한 통신 가능 옵션(메소드)을 설명, 주로 CORS 에서 사용
  * 예비요청에 사용됨
  * 요청하기전 안전한지 미리 검사
* CONNECT : 목적 리소스로 식별되는 서버로의 터널을 설정
  * 요청한 히소스에 대해 양방향 연결을 시작하는 메소드
  * 클라이언트는 원하는 목적지와 TCP 연결을 HTTP 프록시 서버에 요청
  * 서버는 클라이언트를 대신하여 연결의 생성 진행
* TRACE : 대상 리소스에 대한 경로를 따라 메시지 루프백 테스트를 수행
  * 최초 client 요청에 body 가 포함될수 없음
  * 최종 송신자에게 반드시 응답의 내용로 수신한 메시지 반송

#### URI

* 소문자 사용
* 언더바(_) 보다는 하이픈(-) 사용
* 슬래시(/)는 계층 관계를 나타내는데 사용
* 행위는 URI 대신 Method 로 표현
* 파일 확장자는 URI 말고 Accept 헤더로 표현
* 전달하고자 하는 명사를 사용하되 컨트롤자원을 의미하는경우 동사 사용
* 영어는 복수형

### Content-Type 헤더 종류

* Content-Type: application/x-www-form-urlencoded 
  * Form의 내용을 HTTP 메시지 바디를 통해서 전송(key=value, 쿼리 파라미터 형식)
  * 전송 데이터를 url encoding 처리 
  * abc김 = abc%EA%B9%80 
* Content-Type: multipart/form-data
  * 파일 업로드 같은 바이너리 데이터 전송 시 사용
  * 다른 종류의 여러 파일과 Form의 내용 함께 전송 가능. 그래서 이름이 multipart 이다.
* Content-Type: application/json
  * TEXT, XML, JSON 데이터 전송 시 사용

