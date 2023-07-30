
## DOM

-----------------------

### 문서 구조

* DOM 은 문서 구조를 표현하는 트리 형태의 자료구조이다.
* document 전역 바딩인들 통해 객체에 접근 할수 있다.
* documentElement 속성은 \<html> 태그를 나타내는 객체를 잠조한다.

### 트리

* 모든 노드는 자식 노드를 참조하며 이 자식 노드는 다시 자식 노드를 갖는다.
* 자료구조가 하위 구조를 갖고 있으면서 순환하지 않고 명확한 하나의 루트를 갖는 경우 트리라고 한다.
* 트리는 컴퓨터 과학에서 많이 등장한다.
* HTML 문서나 프로그램과 같은 재귀 구조를 표현하는것 외에도 요소를 일반적인 배열보다 트리에 더 효율적으로 찾거나 삽입할수 있기 때문에 정렬된 데이터 집합을 유지하기 위해 보통 사용된다.

### 트리 이동

* parentNode 속성은 부모 노드를 참조한다.
* childNodes 속성은 자식 노드를 참조한다.
* firstChild 속성은 첫번째 자식 노드를 참조한다.
* lastChild 속성은 마지막 자식 노드를 참조한다. 자식이 없는경우 Null 값을 가진다.
* previlousSibling 속성은 첫번째 자식노드 nextSibling 속성은 마지막 자식노드를 참조한다.

### 요소 찾기

* href 속성으로 링크를 가져올수 있다
* getElementById 메서드는 id 속성을 사용해 요소를 찾는다.
* getElementsByTagName 메서드는 태그 이름을 사용해 요소를 찾는다.
```
let link = document.body.getElementsByTagName("a")[0];
let href = link.getAttribute("href");

let ostrich = document.getElementById("gertrude");
console.log(ostrich.src)
```

### 문서 변경

* remove 메서드는 요소를 제거한다.
* appendChild 메서드는 요소를 추가한다.
* insertBefore 메서드로 첫번째 인수로 전달된 노드를 두번째 인수로 전달된 노드 앞에 삽입한다.
* replaceChild 메서드는 첫번째 인수로 전달된 노드로 두번째 인수로 전달된 노드를 교체한다.

### 노드 생성

* 텍스트 노드는 document.createTextNode 메서드로 생성한다.
* 요소 노드는 document.createElement 메서드로 생성한다.

### 속성

* getAttribute 메서드는 요소의 속성을 가져온다.
* setAttribute 메서드는 요소의 속성을 설정한다.
* 이러한 속성 앞에 dat- 를 붙이면 사용자 정의 데이터 속성을 만들수 있다.
* className 속성은 class 속성을 가져오거나 설정한다.

### 레이아웃

* p 태그나 h1 태그 같은 요소는 문서의 전체 너비를 차지하며 별도의 행으로 렌더링 되며 block 요소라고 한다.
* span 태그나 strong 태그 같은 요소는 자신의 내용만큼만 너비를 차지하며 인라인 요소라고 한다.
* offsetWidth 속성은 요소의 너비를 가져오고 offsetHeight 속성은 요소의 높이를 가져온다.
* clientWidth 속성은 테두리 너비를 제외한 요소의 너비를 가져오고 clientHeight 속성은 테두리 너비를 제외한 요소의 높이를 가져온다.
* getBoundingClientRect 메서드는 요소의 크기와 위치를 가져온다. top, bottom, left, right 속성을 갖는 객체를 반환한다.
* 전체 문서를 기준으로 상대적인 위치를 원한다면 pageXOffset, pageYOffset 속성을 사용한다.

### 스타일링

* 스타일 속성에는 송성과 콜론과 값 과같은 선언이 하나 이상 포함 될수 있다.
* display 속성은 요소가 어떻게 렌더링 되는지를 결정한다.
* block 태그는 주변 텍스트와 같은 행에 표시되지 않으며 자체 행만으로 끝난다.
* style 속성을 통해 요소의 속성을 직접 조작할수 있다.

### CSS 

* HTML 의 스타일 체계를 CSS 라고 한다.
* style 태그 안에 지정한다.
* 여러 규칙을 동일한 속성 값에 적용하면 가장 마지막에 읽게 되는 규칙이 우선순위가 높게 적용된다.

### 쿼리 선택자

* querySelector 메서드는 선택자 문자열을 전달받아 일치하는 모든 요소가 포함된 NodeList 를 반환한다.
* querySelector 메서드는 선택자 문자열을 전달받아 일치하는 첫번째 요소를 반환한다. 일치하는 요소가 없으면 null 을 반환한다.

### 위치 지정과 애니메이션

* position 스타일 속성은 static, relative, absolute, fixed, sticky 값 중 하나를 가질수 있다.
* static 값은 요소를 문서 흐름에 따라 배치하며 기본값이다.
* absolute 값은 요소를 문서 흐름에서 제거하고 가장 가까운 위치 지정 조상 요소를 기준으로 배치한다.
* top left right bottom 속성은 요소의 위치를 지정한다.
* requestAnimationFrame 메서드는 브라우저에게 애니메이션을 수행하고 싶다는 것을 알린다.
```
<p style="text-align: center">
    <img src="./cat.png" style="position: relative">
</p>
<script>
    let cat = document.querySelector('img');
    let angle = Math.PI / 2;
    function animate(time, lastTime) {
        if (lastTime != null) {
            angle += (time - lastTime) * 0.001;
        }
        cat.style.top = (Math.sin(angle) * 20) + "px";
        cat.style.left = (Math.cos(angle) * 200) + "px";
        requestAnimationFrame(newTime => animate(newTime, time));
    }
    requestAnimationFrame(animate);
</script>
```
