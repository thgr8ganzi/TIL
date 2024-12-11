## JVM 내부 구조

### JVM 동작 방식

* JVM은 자바 애플리케이션을 실행하기 위해 다음과 같은 과정을 거친다.
  1. 자바 소스코드(.java)를 자바 컴파일러(javac)로 컴파일하여 바이트코드(.class)로 변환한다.
  2. 클래스 로더를 통해 class 파일들을 JVM으로 로딩한다.
  3. 로딩된 class 파일들은 Execution engine을 통해 해석된다.
  4. 해석된 바이트코드는 Runtime Data Areas에 배치되어 실질적인 수행이 이루어진다.

### JVM 구성 요소

* JVM은 크게 Class Loader, Execution Engine, Runtime Data Areas로 구성된다.
* Class Loader: .class 파일을 JVM으로 동적 로드하고, 링크를 통해 배치하는 작업을 수행한다.
* Execution Engine: Class Loader에 의해 메모리에 적재된 바이트 코드를 실행하는 역할을 수행한다.
* Runtime Data Areas: JVM의 메모리 영역으로, Method Area, Heap, Stack, PC Register, Native Method Stack으로 구성된다.
* JNI(Java Native Interface): 자바 애플리케이션에서 C, C++로 작성된 네이티브 메소드를 호출하거나 반대로 자바 메소드를 C, C++로 구현할 수 있는 인터페이스를 제공한다.
* Native Method Libraries: JNI를 통해 호출되는 C, C++로 작성된 라이브러리이다.

### Class Loader

* Class Loader는 JVM 내로 클래스 파일을 로드하고, 링크를 통해 배치하는 작업을 수행하고 이를 통해 클래스를 사용할 수 있게 준비한다.
* 로드: 클래스 파일을 가져와 JVM의 메모리에 올리는 것
* 링크: Verify, Prepare, Resolve의 단계로 나뉜다.
  * Verify: .class 파일 형식이 유효한지 검증한다.
  * Prepare: 클래스 변수(static 변수)와 기본값에 필요한 메모리를 준비한다.
  * Resolve: 심볼릭 메모리 레퍼런스를 메소드 영역에 있는 실제 레퍼런스로 교체한다.
* 초기화: static 변수의 할당 및 static 블록이 실행된다.

### Execution Engine

* Interpreter: 바이트 코드를 한줄씩 실행한다.
* JIT 컴파일러: 인터프리터의 성능을 향상시키기 위해, 인터프리터가 반복되는 코드를 발견하면 JIT 컴파일러로 반복되는 코드를 모두 네이티브 코드로 변경하여 캐싱하고 이후에는 인터프리터가 사용하는 대신 네이티브 코드를 사용한다.
* Garbage Collector: 더 이상 참조되지 않는 객체를 탐지하여 제거한다.

### Runtime Data Areas

* Heap: new 키워드로 생성된 객체와 배열이 생성되는 공간이다.
  * 동적으로 생성된 객체와 배열이 저장(객체 인스턴스, 배열, 인스턴스 변수)
* Method Area: 클래스 멤버 변수와 클래스 메소드의 바이트 코드가 저장되는 공간이다.
  * 클래스 구조와 정적 데이터를 저장(클래스 구조 정보 (필드, 메소드, 생성자 등), 정적 변수, 메소드 코드, 런타임 상수 풀에 대한 참조)
* Runtime Constant Pool: 각 클래스와 인터페이스의 상수, 메소드와 필드에 대한 참조, 메소드와 인터페이스의 이름, 타입에 대한 정보가 저장된다.
  * 메소드 영역 내에 존재하지만, 각 클래스와 인터페이스마다 별도로 존재(리터럴 상수 (문자열 리터럴, 정수형 상수, 실수형 상수), 심볼릭 레퍼런스 (클래스, 인터페이스, 메소드, 필드에 대한 참조))
* Stack: 지역 변수와 파라미터, 리턴 값, 연산 중 발생하는 값들을 임시로 저장하는 스택이다.
* PC Register: 쓰레드마다 생성되는 공간으로, 쓰레드가 어떤 부분의 명령어를 어떤 순서로 실행할지 기록한다.
* Native Method Stack: 자바 외 언어의 네이티브 메소드 스택이다.
* PC Register: 쓰레드마다 생성되는 공간으로, 쓰레드가 어떤 부분의 명령어를 어떤 순서로 실행할지 기록한다.
* Native Method Stack: 자바 외 언어의 네이티브 메소드 스택이다.