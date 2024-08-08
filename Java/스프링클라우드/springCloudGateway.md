## gateway

* 사용자가 설정한 각각 엔드포인트로 클라이언트를 대신해서 요청, 응답을 주고 받는 프록시 역활
* 시스템의 내부 구조는 숨기고 외부의 요청에 대해서 적절한 형태로 가공해서 응답
* 클라이언트 사이드에서 엔드포인트를 직접접으로 호출했을경우 직접 수정할 필요가 없게 해준다.
* 각각의 마이크로 서비스에 대한 모든 요청을 일괄적으로 처리
* 인증 및 권한 부여
* 서비스 검색 통합(마이크로 서비스 검색)
* 응답 캐싱
* 정책, 회로 차단기 및 Qos 다시 시도
* 속도 제한
* 부하 분산
* 로깅, 추적, 상관 관계
* 헤더, 쿼리 문자열 및 청구 변환
* IP 허용 목록에 추가

### Netflix Ribbon

* RestTemplate
  * 전통적으로 하나의 어플리케이션에서 다른 서비스를 사용하기 위해 만들어진 API
```
RestTemplate restTemplate = new RestTemplate();
restTemplate.getForObject("http://localhost:8080", User.class, 200);
```
* Feign client
  * RestTemplate 을 대체하기 위해 만들어진 라이브러리
  * Feign 은 인터페이스 기반으로 작성되어 있어서 사용자가 인터페이스를 정의하고 이를 통해 서비스를 호출
```
@FeignClient(name = "stores")
public interface StoreClient {
    @RequestMapping(method = RequestMethod.GET, value = "/stores")
    List<Store> getStores();
}
```
* Ribbon: client side load Balancer
  * 서비스 이름으로 호출
  * health check
  * 비동기 처리가 잘 되지 않아 최근에 사용X

### Netflix Zuul

* API Gateway
* 서비스 디스커버리 클라이언트와 연동하여 서비스를 찾아서 라우팅
* spring boot 2.4 부터 사용X

### filter

* predicate filter
  * 라우팅 전에 요청을 변경
* pre filter
  * 라우팅 전에 요청을 변경
* post filter
  * 라우팅 후에 응답을 변경
* gateway handler mapping
  * 라우팅 정보를 가지고 있음
* property, java code 로 변경가능