## HTTP Status Code

* 특정 HTTP 요청이 성공적으로 완료되었는지 여부 또는 왜 실패했는지를 나타내는 세 자리 숫자
* <a href="https://httpwg.org/specs/rfc9110.html#overview.of.status.codes" target="_blank">RFC 9110</a> 에 정의
* 5가지 클래스로 분류
  * 1xx (Informational): 요청된 작업을 완료하고 최종 응답을 보내기 전에 연결 상태 또는 요청 진행 상황을 전달하기 위한 임시 응답
  * 2xx (Success): 성공적인 응답
  * 3xx (Redirection): 요청을 이행하기 위해 사용자 에이전트가 추가 조치를 취해야 함(리디렉션)
  * 4xx (Client Error): 클라이언트 오류, HEAD 요청에 응답을 제외하고 서버는 오류 상황에 대한 설명과 그것이 일시적인지 영구적인지 여부를 포함해 보내야 한다.
  * 5xx (Server Error): 서버 오류, HEAD 요청에 응답을 제외하고 서버는 오류 상황에 대한 설명과 그것이 일시적인지 영구적인지 여부를 포함해 보내야 한다.

### 1xx (Informational)

* 100 continue
  * 요청 초기 부분이 수신되었으며 서버에서 아직 거부 되지 안ㄴㅎ았음을 나타냄
  * 서버는 요청이 완전히 수신되어 조치를 취한후 응답을 보낼 것임을 알림
* 101 Switching Protocols
  * 서버가 요청을 이해하고 클라이언트의 응답할 의향이 있음을 알림
  * 서버는 응답후 어떤 프로토콜이 적용될것인지 나타내는 응답을 헤더 필드에 생성 하야함

### 2xx (Success)

* 200 OK
  * 요청이 성공적으로 완료되었음을 나타냄
* 201 Created
  * 요청이 성공적으로 완료되었으며 새로운 리소스가 생성되었음을 나타냄
* 202 Accepted
  * 요청처리가 승인되었지만 처리가 완료 되었는지는 알수 없음
* 203 Non-Authoritative Information
  * 요청이 성공했지만 포함된 내용이 변환 프록시에 의해 원본 서버의 응답내용에서 수정되었음을 나타냄
* 204 No Content
  * 요청이 성공적으로 완료되었지만 응답내용이 없음
* 205 Reset Content
  * 서버가 요청을 이행하였으며 클라이언트가 보낸 요청을 원본서버에서 수신한 원래 상태로 재성정하기 원한다는것을 나타냄
* 206 Partial Content
  * 서버가 선택된 표현의 하나 이상의 부분을 전송하여 대상 리소스에 대한 범위 요청을 성공적으로 이행

### 3xx (Redirection)

* 300 Multiple Choices
  * 요청한 리소스에 여러 선택사항이 있음을 나타냄
  * 요청을 해당 식별자중 하나 이상으로 리다이렉트 하거나 사용자가 선택하도록 하기 위해 응답에 목록을 포함해야함
* 301 Moved Permanently
  * 요청한 리소스가 새로운 URI 에 위치해 있음을 나타냄
  * 응답 헤더에 Location 필드에 새로운 URL 을 포함해야함
* 302 Found
  * 요청한 리소스가 일시적으로 다른 URI 에 위치해 있음을 나타냄
  * 응답 헤더에 Location 필드에 새로운 URL 을 포함해야함
* 303 See Other
  * 원래 요청에 대한 간접적인 응답을 제공하기 위한 Location 헤더 필드의 URI 에 표싣힌 대로 서버가 사용자를 다른 리소스로 리디렉션 하고 있음을 나타냄
* 304 Not Modified
  * 조건부 GET 또는 HEAD 요청의 경우 리소스가 마지막 요청 이후 변경되지 않았음을 나타냄
  * 서버는 응답에 ETag 또는 Last-Modified 헤더 필드를 포함해야함
* 305 Use Proxy 
  * 더 이상 사용하지 않음
* 306 Switch Proxy
  * 더 이상 사용하지 않음
* 307 Temporary Redirect
  * 요청한 리소스가 일시적으로 다른 URI 에 상주해 있음을 나타냄
  * 응답 헤더에 Location 필드에 새로운 URL 을 포함해야함
* 308 Permanent Redirect
  * 요청한 리소스가 새로운 영구 URI 가 할당되었음을 알림
  * 응답 헤더에 Location 필드에 새로운 URL 을 포함해야함

### 4xx (Client Error)

* 400 Bad Request
  * 서버가 요청을 이해할 수 없음을 나타냄
  * 잘못된 요청 구문, 잘못된 요청 메시지 프레이밍, 사기성 요청 라우팅
* 401 Unauthorized
  * 인증이 필요함을 나타냄
  * 서버는 응답에 WWW-Authenticate 헤더 필드를 포함해야함
* 402 Payment Required
  * 잠시 사용되어지지 않는 예약된 코드
* 403 Forbidden
  * 서버가 요청을 거부함을 나타냄
  * 요청에 인증 자격 증명이 제공된 경우 액세스 권한이 없음
  * 리소스를 숨시려면 404를 사용해야함
* 404 Not Found
  * 요청한 리소스를 찾을 수 없음을 나타냄
  * 영구적으로 사용할 수 없는 리소스에 대해 410을 사용해야함
* 405 Method Not Allowed
  * 요청된 메서드가 대상 리소스에서 지원되지 않는 메소드 일경우
  * 서버는 Allow 헤더 필드에 허용되는 메서드를 포함해야함
* 406 Not Acceptable
  * 요청된 리소스가 요청된 표현을 생성할 수 없음을 나타냄
* 407 Proxy Authentication Required
  * 401과 유사 하지만 프록시를 사용하려면 클라이언트가 자체 인증해야함을 나타냄
  * 서버는 응답에 Proxy-Authenticate 헤더 필드를 포함해야함
* 408 Request Timeout
  * 서버가 준비기간된 시간내에 완전한 요청 메시지를 받지 못했음을 나타냄
* 409 Conflict
  * 요청이 현재 리소스의 상태와 충돌함을 나타냄
* 410 Gone
  * 대상 리소스에 대한 액세스가 더이상 가능하지 않고 영구적으로 불가능할때 나타냄
  * 리소스를 의도적으로 사용하지 못하게 하고싶을때
* 411 Length Required
  * Content-Length 헤더 필드가 요청에 포함되지 않았음을 나타냄
* 412 Precondition Failed
  * 요청 헤더 필드에서 지정된 선행 조건이 서버에서 평가되지 않았음을 나타냄
* 413 Payload Too Large
  * 서버가 처리할 수 있는 요청 페이로드가 너무 큼을 나타냄
* 414 URI Too Long
  * 서버가 처리할 수 있는 URI 가 너무 길음을 나타냄
* 415 Unsupported Media Type
  * 콘텐츠가 리소스에서 지원되지 않는 형식이기 때문에 서버가 요청을 거부함
  * Accept-Encoding 헤더에 사용하여 서버가 지원하는 형식을 나타내야함
* 416 Range Not Satisfiable
  * 요청한 범위중 어느것도 만족할수 없거나 클라이언트가 너무 작거나 겹치는 범위를 요청했기때문에 서버가 요청을 이행할 수 없음을 나타냄
* 417 Expectation Failed
  * 서버가 요청의 Expect 헤더 필드에 명시된 요구사항을 충족시키지 못함을 나타냄
* 418 I'm a teapot
  * 만우절 장난으로 정의된 HTTP 상태 코드
* 421 Misdirected Request
  * 요청이 대상 URI 에 대한 신뢰할수 있는 응답을 생성할수 없거나 의사가 없는 서버로 전달되었음을 알림
* 422 Unprocessable Entity
  * 서버가 현재는 거부했지만 다른 프로토콜로 업그레이드 한후에는 수행할수 있음을 알림
  * 서버는 응답에 Upgrade 헤더 필드를 보내야함

### 5xx (Server Error)

* 500 Internal Server Error
  * 서버가 요청을 처리하는 동안 예기치 않은 상황이 발생하여 요청을 완료할 수 없음을 나타냄
* 501 Not Implemented
  * 서버가 요청을 처리할 준비가 되어있지 않음을 나타냄
* 502 Bad Gateway
  * 서버가 게이트웨이 또는 프록시 역할을 하고 있으며 상위 서버로부터 잘못된 응답을 수신했음을 나타냄
* 503 Service Unavailable
  * 일시적인 과부하 또는 예정된 유지관리로 인해 서버가 요청을 처리할수 없음을 알림
* 504 Gateway Timeout
  * 서버가 게이트웨이 또는 프록시 역할을 하고 있으며 상위 서버로부터 응답을 받지 못했음을 나타냄
* 505 HTTP Version Not Supported
  * 서버가 요청에 사용된 HTTP 프로토콜 버전을 지원하지 않음을 나타냄