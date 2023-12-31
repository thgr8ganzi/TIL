
## NODE.JS

----------------

### 배경

* 단일스레드의 비동기 프로그램은 데이터 입출력에서 이점을 보인다.
* Node.js는 Chrome V8 엔진에서 실행되며 웹 브라우저 외부에서 자바스크립트 코드를 실행하는 오픈소스 크로스 플랫폼 백엔드 자바스크립트 런타임 환경이다

### 노드 명령어

* `node hello.js` 같은 명령어로 js 파일을 실행할수 있다.
* console 바인딩과 process 바인딩은 전역으로 사용할수 있다.
* `process.exit(0)` 명령어로 해당 프롯스를 종료한후 node 를 시작한 프로그램에 종료 상태 코드를 전달한다.
* `process.argv` 명령어로 스크립트에 전달된 명령줄 인수를 확인할수 있다.
* Array, Math, JSON 은 존재하고 document, prompt 같은 브라우저 기능은 존재하지 않는다.

### 모듈

* 다른 파일의 내장 기능에 접근하려면 모듈 시스템을 사용해야 한다.
* / 나 ./ 또는 ../ 로 시작하는 경로는 현재 모듈의 경로에서 상대적으로 해석된다.
* ./는 현재 디렉토리 ../는 상위 디렉토리 /는 파일 시스템의 루트이다
* .js 확장자는 생략 할수 있으며 해당파일이 존재하는 경우 노드에서 그 파일을 추가한다.
* 상대경로나 절대경로 처럼 보이지 않는 문자열이 require 에 전달되면 require 는 내장 모듈이나 node_modules 디렉토리에서 설치된 모듈을 참조한다고 가정한다.
* require('fs') 는 노드 내장 파일 시스템 모듈을 제공한다.
* 이러한 라이브러리를 설치하는 일반적인 방법은 NPM 을 사용하는것이다.
* exports 속성을 추가하면 속성이 모듈의 인터페이스에 추가 된다.

### NPM 으로 설치

* NPM 은 자바스크립트 모듈의 온라인 저장소이며 대부분은 노드용 으로 작성됐다.
* `npm install`을 히면 NPM 은 node_module 디렉토리에 모듈을 설치한다.
* 각 어플리케이션에서 설치하는 패키지를 완전히 제어할수 있고 애플리케이션을 제거할때 버전을 관리하고 정리하기 쉽다.

### 패키지파일

* npm init 명령어를 사용하면 패키지 파일을 생성할수 있다.
* 패키지 파일은 프로젝트의 이름, 버전, 설명, 라이센스, 패키지의 의존성을 명시한다.
* 설치할 패키지 이름을 지정하지 않고 npm install 을 실행하면 NPM 에서는 package.json 에 나열된 종속성을 설치한다.
* 아직 종속성에 포함되지 않은 패키지를 설치하면 NPM 에서 해당 패키지를 package.json 에 추가한다.

### 버전

* package.json 파일에는 프로그램의 버전과 종속성 버전을 모두 나열한다.
* NPM 에서는 시맨틱 버저닝이라는 스키마를 따를것을 요구한다.
* 이 스키마는 해당 버전의 번호와 호환되는 버전 정보를 작성한다.
* 종속성 버전 번호 앞 캐럭(^)은 지정된 번호와 호환되는 모든 버전이 설치될수 있음을 나타낸다.
* npm 외에도 yarn 이 있으며 약간 다른 인터페이스와 설치전략을 가지고있다.

### 파일 시스템 모듈

* 노드에서 가장 일반적으로 사용되는 모듈중 파일시스템을 나타내는 fs 모듈이다.
* readFile 함수는 파일을 읽은후 해당 파일 내용으로 콜백을 호출한다.'
* readFile 두번째 인수는 해당파일을 문자열로 디코딩하는데 사용하 문자 인코딩을 나타낸다. 대부분은 UTF-8을 사용한다.
* 인코딩을 전달하지 않으면 Node 에서는 이진데이터 사용을 판단해 문자열대신 Buffer 객체를 제공한다.
* Buffer 객체는 유사배열 이며 파일의 바이트(8비트 청크)를 나타내는 숫자가 포함된다.
* writeFile 함수는 파일을 디스크에 기록할때 사용한다.
* readdir 은 디렉토리의 파일을 문자열 배열로 반환한다.
* stat 는 파일에 대한 정보를 조회한다.
* rename 은 파일의 이름을 바꾼다.
* unlink 는 파일을 제거한다.
* 버전 10.1 부터 fs 패키지에 제공되는 promise 객체가 포함돾다
* fs 의 많은 함수에는 동기변형도 포함돼 있으며 동일한 함수 이름끝에 sync 를 추가했다.
* readFile 의 동기버전은 readFileSync 다.

### HTTP 모듈

* http 모듈은 서버를 실행하고 HTTP 요청을 만드는 기능을 제공한다.
* createServer 에 인수로 전달된 함수는 클라이언트에서 서버에 연결할때마다 request, response 바인딩은 들어오고 나가는 객체다
* server.listen 을 호출하면 서버가 포트로 연결이 들어오기를 기다린다.

### 스트림

* 쓰기 가능한 스트림은 노드에서 흔히 사용되는 개념이다.
* 이 객체는 Buffer 객체를 전달할수 있는 write 메서드가 존재하며 end 메서드로 스트림을 닫는다.
* 읽은 수 있는 스트림은 Http 서버의 콜백으로 전달된 인수를 읽을수 있는 스트림이다.
* 스트림에서 읽기는 메서드가 아닌 이벤트 핸들러를 사용해 처리한다.
* 노드에서 이벤트를 생성하는 객체는 브라우저의 addEventListener 와 유사한 on 메서드가 있다.

### 파일서버

* 다양한 HTTP 메서드를 처리하는 함수를 저장하기 위해 method 객체를 사용한다.
* 요청 핸들러의 프로미스가 거부되면 catch 호출에서는 오류를 응답객체로 변환하고 돌려보낼수 있다.
* 응답내용의 status 필드는 생략될수 있으며 기본값은 200이다.
* body 값이 읽을수 있는 스트림일경우 쓰기가능한 스트림으로 전달하는데 사용하는 pipe 메서드를 갖는다.
* text/plan 과 같은 콘텐츠 유형은 MINE 이라고 한다.
* HTTP 응답에 아무런 데이터가 포함돼 있지 않으면 204 상태코드를 사용한다.
* HTTP 표준은 요청을 멱등하게 만들것을 권장한다.
```
const {createServer} = require('http');

const methods = Object.create(null);

createServer((request, response) => {
    let handler = methods[request.method] || notAllowed;
    handler(request)
        .catch(error => {
            if(error.status != null) return error;
            return {body: String(error), status: 500};
        })
        .then(({body, status = 200, type = "text/plain"}) => {
            response.writeHead(status, {"Content-Type": type});
            if(body && body.pipe) body.pipe(response);
            else response.end(body);
        });
}).listen(8000);
async function notAllowed(request) {
    return {
        status: 405,
        body: `Method ${request.method} not allowed.`
    };
}
```

### 롱폴링

* 변경사항을 즉시 클라이언트에게 알리려면 해당 클라이언트에 연결돼 있어야 한다.
* HTTP 요청에서는 단순한 정보의 흐름만 허용한다.
* 웹소켓으로 데이터를 교환하는 연결을 할수 있다.
* 노드는 각각에 대해 별도의 제어스레드를 작성하지 않아도 많은 연결을 쉽게 관리할수 있으므로 이와같은 시스템에 적합하다

