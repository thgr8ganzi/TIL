
## HTTP 와 폼

-----------------------

### 프로토콜

* 클라이언트가 보낸 요청을 request 라고 한다.
* GET 은 요청 방식 method 이다.
* GET 은 리소스를 얻고자함 DELETE 와 PUT 은 데이터를 바꾸고 POST 는 데이터를 보낸ㄴ다.
* 방식 다음에 오는것은 요청하는 리소스의 경로이다.
* 그 다음 오는것은 HTTP 프로토콜 버전이다.
* 2로 시작하는 상태코드는 성공이다
* 4로 시작하는 코드는 요청에 문제가 있음을 알린다.
* 5로 시작하는 코드는 서버에 문제가 있음을 알린다.
* 헤더에는 요청의 응답이나 추가정보를 name : value 형태로 보낸다.
* 대부분 헤더는 클라이언트와 서버가 요청이나 응답에 헤더를 포함할지 여부를 자유롭게 결정할수 있다.
* 호스트 이름을 지정하는 Host 헤더가 포함되어야 한다.
* 헤더 다음에는 요청과 응답에 공백 라인과 전송된 데이터를 포함하는 본문이 차례로 포함된다.
```
GET /18_http.html HTTP/1.1
Host: eloquentjavascript.net
User-Agent: your browser's name

HTTP/1.1 200 OK
Content-Length: 65585
Content-Type: text/html
Last-Modified: Mom, 07 Jan 2019 10:29:45 GMT

<!doctype html>
.....
```

### 브라우저와 HTTP

* \<form> 태그안 method 를 생략하면 GET 요청이다.
* 필드의 name 속성과 해당 값이 쌍으로 이뤄진다.
* 쿼리 스트링의 일부 문자는 이스케이프 처리가 되어 나타난다 %3F는 물음표다
* URL 인코딩 형식은 퍼센트 부호와 문자코드를 인코딩 하는 16진수(base 16) 두자리를 이용한다.
* encodeURIComponent 는 인코딩을 decodeURIComponent 는 디코딩을 한다.
* POST 로 전송하면 쿼리스트링은 URL 에 추가되지 않고 요청 본문에 포함된다.

```
<form method="GET" action="example/message.html">
    <p>Name: <input type="text" name="name"></p>
    <p>Message: <br><textarea name="message"></textarea></p>
    <p><button  type="submit">Send</button></p>
</form>

GET /exampe/message.html?name=Jean&message=Yes%3F HTTP/1.1

POST /exampe/message.html HTTP/1.1
Content-length: 24
Content-type: application/x-www-form-urlencoded

name=Jean&message=Yes%3F
```

### 패치

* 브라우저의 자바스크립트에서 HTTP 요청을 가는ㅇ하게 하는 인터페이스는 fetch 라고 한다.
* fetch 는 프로미스를 반환 하며 서버 응답 정보를 갖는 Response 객체로 리졸브 된다.
* 헤더 이름은 대소문자를 구분하지 않고 Map 유사 객체로 래핑된다.
* 서버가 오류 코드를 응답해도 성공적으로 리졸브 되고 네트워크 오류나 서버를 찾을수 없는 경우 거부될수 있다.
* fetch 의 첫번째 인수는 URL 이며 상대경로로 취급하며 현재 문서를 기준한다.
* 응 답의 실제 내용을 가져오려면 text 메서드를 사용하고 json 메서드를 사용할수도 있다.
* 기본적으로 GET 방식으로 요청하고 두번째 인수를 다르게 설정할수 있다.
* 요청 본문을 추가하기 위해 body 옵션을 포함할수 있고 헤더를 설정하려면 heders 옵션을 사용한다.
* range 옵션을 사용해 일부만 반환하도록 지시할수 있다.
* 브라우저는 Host 같은 요청 헤더의 일부와 서버 본문 크기를 알아내는데 필요한 헤더를 자동으로 추가한다.
* 직접 추가시 인증정보와 같은 내용을 포함하거나 받으려는 파일의 형식을 지정할수 있다.
```
fetch('example/data.txt').then(response => {
    console.log(response.status); // 200
    console.log(response.headers.get('Content-Type')) // text/plain
})

fetch('example/data.txt')
.then(resp => resp.text())
.then(text => console.log(text))
// This is the content of data.txt

fetch('example/data.txt', {method: 'DELETE'})
.then(resp => console.log(resp.status))
// 405

fetch('example/data.txt', {headers: {Range: 'bytes=8-19'}})
.then(resp => resp.text())
.then(text => console.log(text))
// the content
```

### HTTP 샌드박싱

* 브라우저에서는 스크립트가 다른 도메인에 대한 요청을 허용하지 않음으로 사용자를 보호한다.
* 서버에서 헤더를 읍담에 명시적으로 포함하여 괜찮다는것을 브라우저에 알릴수도 있다.
```
Access-Control-Allow-Origin: *
```

### 탁월한 HTTP

* RPC 와 HTTP 통신으로 자바스크립트 프로그램과 서버는 총신할수 있다.
* HTTP 는 메서드와 리소스 중심으로 통신한다.
* addUser 라는 원격 프로시저를 호출하는 대신 /users/larry PUT 요청
* 함수 인수에 해당 사용자 속성을 인코딩 하는 대신 JSON 문서 형식 사용
* HTTP 를 사용하면 리소스 캐시와 같은 HTTP 에서 제공하는 기능을 보다 쉽게 사용할수 있다.

### 보안과 HTTP

* 보안 HTTP 프로토콜은 https:// 로 시작한다.
* 클라이언트는 데이터를 교환하기전에 인증 기관에서 발행한 브라우저가 인식할수 있는 암호화 인증서가 서버에 있는지 확인한다.
* 이 연결을 통한 모든 데이터는 도청과 변조를 방지할수 있는 방식으로 암호화 된다.
* 따라서 HTTPS 는 웹사이트를 가장한 스누핑을 할수 없다.

### 폼필드

* 폼은 자바스크립트가 웹개발의 대세가 되기전에 웹사이트에서 사용자가 작성한 정보를 HTTP 요청으로 보내기 위해 설계 됐다.
* 이 설계는 새로운 페이지로 이동하는 동작은 언제나 서버와 상호작용이 일어난다고 가정한다.
* \<form> 태그는 체크박스 등 다양한 필드를 포함한다.
* \<input> 태그의 속성은 다음과 같다
* text: 한줄의 텍스트 필드
* password: text 와 동일하지만 입력한 텍스트를 숨긴다.
* checkbox: 온/오프 전환
* radio: 다중 선택 필드
* file: 사용자가 자신의 컴퓨터에서 파일을 선택할수 있다.
* 멀티라인 텍스트 필드는 \<textarea>를 사용하며 닫는 태그가 필요하다.
* \<select> 태그는 미리 정의된 여러 옵션중 선택하는 태그이며 change 이벤트가 발생한다.

### 포커스

* \<select> 메뉴는 사용자가 입력한 텍스트가 포함된 옵션으로 이동하도록 반응하고 화살표키에는 선택 항목이 위 아래로 움직이도록 반응한다.
* focus 와 blur 로 포커스를 제어할수 있다
* HTML 에선 autofocus 속성을 제공한다.
* Tabindex 속성으로 사용자가 포커스를 받는 순서에 영향을 줄수도 있다.

### 필드 비활성화

* disabled 속성으로 폼 필드를 비활성화 할수 있다.

### 전체 폼

* form 필드 안에는 elements 라는 속성이 포함되어 폼요소 내부 필드에 관한 유사 배열을 포함한다.
* type 속성이 submit 인 버튼을 누르면 폼이 전송된다.
```
<form action="example/submit.html">
    Name: <input type="text" name="name"><br>
    password: <input type="password" name="password">
</form>
<script>
    let form = document.querySelector('form');
    console.log(form.elements[1].type); // password
    console.log(form.elements.password.type) // password
    console.log(form.elements.name.form === form) // true
    form.addEventListener('submit', event => {
        event.preventDefault();
    })
</script>
```

### 텍스트 필드

* \<textarea> 태그나 text, password 유형의 \<input> 태그로 작성한 필드에서는 공통 인터페이스를 가진다.
* value 속성은 현재 내용을 문자열 값을가진다.
* selectionStart, selectionEnd 속성은 텍스트에서 커서와 선택에 관한 정보를 제공한다.
* textarea change 이벤트는 포커스를 잃으면 발생한다.
* 즉시 반응하려면 input 이벤트를 등록해야 한다.
```
<textarea></textarea>
<script>
    let textarea = document.querySelector('textarea');
    textarea.addEventListener('keydown', event => {
        if(event.keyCode == 13){
            replaceSelection(textarea, 'KHaseKhenmy');
            event.preventDefault();
        }
    });
    function replaceSelection(field, word){
        let from = field.selectionStart, to = field.selectionEnd;
        field.value = field.value.slice(0, from) + word + field.value.slice(to);
        field.selectionStart = from + word.length;
        field.selectionEnd = from + word.length;
    }
</script>
```

### 체크박스와 라디오 버튼

* 체크박스 필드는 두가지 값을 갖는 토글이다.
* \<label> 태그는 문서와 입력 필드를 연결한다.
* 레이블의 아무곳이나 클릭하게 되면 해당 필드가 활성화 되고 포커스가 가게 되며 필드가 토글된다.
* 라디오 버튼은 체크박스와 유사하지만 name 속성이 같은 다른 라디오 버튼과 내부적으로 연결돼어 항상 하나만 활성화 된다.
* querySelectorAll('[name=color]') 로 name 속성이 color 인 요소를 찾는다.
```
Color:
<label>
    <input type="radio" name="color" value="orange">Orange
</label>
<label>
    <input type="radio" name="color" value="lightgreen">Lightgreen
</label>
<label>
    <input type="radio" name="color" value="lightblue">Lightblue
</label>
<script>
    let buttons = document.querySelectorAll('[name=color]')
    for (let button of Array.from(buttons)) {
        button.addEventListener('change', () => {
            document.body.style.background = button.value;
        })
    }
</script>
```

### 셀렉트 필드

* 셀렉트 필드는 개념적으로 라디오 버튼과 유사하며 옵션중 선택할수 있다.
* 셀렉트 태그에 multiple 속성을 사용하면 사용자가 하나의 옵션이 아닌 여러 옵션을 선택할수 있다.
* \<option> 태그는 값을 갖는다 value 속성을 사용해 정의한다.
* multiple 속성일 경우 현재 선택돈 옵션중 하나의 값만 제공하므로 그다지 의미가 없으니 보여주는 필드가 다르다
* 셀렉트 필드의 옵션 태그는 옵션속성으로 유사배열 객체로 접근할수 있다.
* selected 속성으로 선택여부를 확인할수 있다.
```
<select multiple>
    <option value="1">0001</option>
    <option value="2">0010</option>
    <option value="4">0100</option>
    <option value="8">1000</option>
</select> = <span id="output">0</span>
<script>
    let select = document.querySelector('select');
    let output = document.querySelector('#output');
    select.addEventListener('change', () => {
        let number = 0;
        for (let option of Array.from(select.options)) {
            if(option.selected){
                number += Number(option.value)
            }
        }
        output.textContent = number
    })
</script>
```

### 파일필드

* 자바스크립트에서는 사용자의 컴퓨터에서 개인 파일을 쉽게 읽을수 없지만 사용자가 브라우저로 파일을 선택하면 자바스크립트에서 읽을수 있게 해준다.
* 파일 필드 요소의 files 속성은 해당필드에서 선택한 파일을 포함하는 유사 배열 객체고 처음엔 비어있다.
* multiple 속성을 지원해서 여러가지 파일을 동시에 선택할수 있다.
* files 객체엔 name, size, type 같은 속성을 갖는다
* 디스크에서 파일을 읽는데 시간이 걸리므로 해당 문서가 정지되지 않게 하려면 인터페이스는 비동기 방식이어야 한다.
* 파일 읽기는 FileReader 객체를 생성하고 생성한 객체를 위한 load 이벤트 핸들러를 등록후 raedAsText 메서드를 호출하고 메서드에 전달한다
* 파일 로딩이 끝나면 FileReader 객체의 result 속성에 파일내용이 포함되고 error 속성도 포함된다.
* 이 인터페이스는 프로미스가 자바 스크립트 언어의 일부가 되기 전에 설계 됐으며 프로미스로 래핑할수 있다.
```
<input type="file" multiple>
<script>
    let input = document.querySelector('input');
    input.addEventListener('change', () => {
        for (let file of Array.from(input.files)) {
            let reader = new FileReader();
            reader.addEventListener('load', () => {
                console.log('File', file.name, 'start With', reader.result.slice(0, 20));
            })
            reader.readAsText(file)
        }
    });
    
    function readFileText(file){
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result))
            reader.addEventListener('error', () => reject(reader.error))
            reader.readAsText(file)
        })
    }
</script>
```

### 클라이언트 측에 데이터 저장

* 자바스크립트 바인딩은 페이지를 닫을때마다 버려지게 된다.
* localStorage 객체를 사용하면 페이지가 다시 로딩되더라도 데이터가 저장된다.
* localStorage 의 값은 그값을 덮거나 removeItem 으로 제거할때까지 유지된다.
* localStorage 에 저장한 데이터는 운칙적으로 동일한 사이트의 스크립트 에서만 읽고 수정할수 있다.
* JSON.parser 에 null 을 전달하면 null 문자열로 파싱한다.
* Object.assign 을 사용해 객체를 복제할수 있다.
* sessionStorage 라는 객체는 각 세션이 종료 될때 사라진다 대게는 브라우저를 닫을때 다.
